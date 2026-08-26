import asyncio
import json
import logging
import os
from typing import Any

from openai import AsyncOpenAI

from prompts import (
    IngestionParameters,
    construct_system_prompt,
    construct_user_prompt,
)

logger = logging.getLogger(__name__)


class GenerationError(Exception):
    """Raised when content generation fails."""

    pass


async def generate_single_deliverable(
    extracted_text: str,
    output_format: str,
    params: IngestionParameters,
) -> dict[str, Any]:
    """
    Generate a single deliverable using OpenAI API.

    Args:
        extracted_text: Source content from Phase 1
        output_format: Target deliverable format
        params: Generation parameters (audience, tone, etc.)

    Returns:
        Dictionary with status, format, and content (or error details)
    """
    try:
        system_prompt = construct_system_prompt(output_format, params)
        user_prompt = construct_user_prompt(extracted_text, output_format)

        logger.info(f"Generating {output_format} using Groq API...")

        # Initialize AsyncOpenAI client with Groq API key
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")

        client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )

        # Try available Groq models in priority order
        models_to_try = [
            "mixtral-8x7b-32768",  # fallback if it becomes available again
            "llama-2-70b-chat",    # fallback
            "qwen-max",            # Qwen models
            "openai/gpt-oss-120b", # GPT-OSS models (recommended)
            "openai/gpt-oss-20b",  # Fast model
        ]
        response = None
        last_error = None
        
        for model in models_to_try:
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    temperature=0.7,
                    max_tokens=2000,
                    timeout=60,
                )
                logger.info(f"Successfully used {model} for {output_format}")
                break
            except Exception as e:
                last_error = e
                if model != models_to_try[-1]:
                    logger.warning(f"Model {model} failed, trying {models_to_try[models_to_try.index(model) + 1]}")
                    continue
                raise
        
        if response is None:
            raise Exception(f"All models failed: {str(last_error)}")

        content = response.choices[0].message.content or ""

        # Special handling for Twitter/X thread: parse into array
        if output_format == "Twitter/X Post":
            tweets = _parse_twitter_thread(content)
            return {
                "status": "success",
                "format": output_format,
                "content": tweets,
                "raw": content,
            }

        return {
            "status": "success",
            "format": output_format,
            "content": content,
        }

    except asyncio.TimeoutError:
        logger.error(f"Timeout generating {output_format}")
        return {
            "status": "error",
            "format": output_format,
            "error": "Generation timeout (60s exceeded)",
        }
    except Exception as e:
        logger.error(f"Error generating {output_format}: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "format": output_format,
            "error": f"Generation failed: {str(e)}",
        }


def _parse_twitter_thread(content: str) -> list[str]:
    """
    Parse generated Twitter thread content into individual tweets.

    Attempts to extract individual tweets from the generated content.
    Handles various formats (numbered, prefixed, etc.).

    Args:
        content: Raw generated content

    Returns:
        List of individual tweets
    """
    tweets = []
    lines = content.split("\n")

    for line in lines:
        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Remove tweet numbering prefixes
        if line.startswith("Tweet "):
            # Format: "Tweet 1: content" or "Tweet 1:\ncontent"
            parts = line.split(":", 1)
            if len(parts) > 1:
                tweet = parts[1].strip()
            else:
                tweet = line[6:].strip()
        else:
            tweet = line

        # Filter out meta-text
        if tweet and not tweet.lower().startswith("thread") and len(tweet) > 10:
            tweets.append(tweet)

    return tweets[:5]  # Return max 5 tweets


async def generate_deliverables_async(
    extracted_text: str,
    params: IngestionParameters,
) -> dict[str, Any]:
    """
    Generate all selected deliverables concurrently using AsyncOpenAI.

    Executes all generation tasks in parallel using asyncio.gather() to minimize
    total latency. Individual failures don't block other deliverables.

    Args:
        extracted_text: Source content from Phase 1 ingestion
        params: Generation parameters (audience, tone, detail level, selected outputs)

    Returns:
        Dictionary with generation_id, deliverables, execution time, and status

    Raises:
        GenerationError: If no deliverables are provided or all generations fail
    """
    import time

    if not params.selected_outputs:
        raise GenerationError("No output formats specified")

    start_time = time.time()

    # Create concurrent generation tasks
    tasks = [
        generate_single_deliverable(
            extracted_text, output_format, params
        )
        for output_format in params.selected_outputs
    ]

    logger.info(
        f"Starting parallel generation of {len(tasks)} deliverables..."
    )

    # Execute all tasks concurrently
    results = await asyncio.gather(*tasks, return_exceptions=False)

    execution_time = time.time() - start_time

    # Organize results by format
    deliverables = {}
    errors = {}

    for result in results:
        if isinstance(result, dict):
            if result.get("status") == "success":
                format_name = result.get("format")
                content = result.get("content")
                deliverables[format_name] = content
            else:
                format_name = result.get("format", "unknown")
                error_msg = result.get("error", "Unknown error")
                errors[format_name] = error_msg
                logger.warning(
                    f"Generation failed for {format_name}: {error_msg}"
                )

    # Log summary
    logger.info(
        f"Generation complete: {len(deliverables)} successful, "
        f"{len(errors)} failed in {execution_time:.2f}s"
    )

    # Determine overall status
    if len(deliverables) == 0:
        status = "error"
        error_message = "All generation attempts failed"
    elif len(errors) > 0:
        status = "partial_success"
        error_message = f"{len(errors)} deliverable(s) failed to generate"
    else:
        status = "success"
        error_message = None

    from uuid import uuid4

    return {
        "status": status,
        "generation_id": str(uuid4()),
        "deliverables": deliverables,
        "errors": errors if errors else None,
        "execution_time_seconds": round(execution_time, 2),
        "error_message": error_message,
    }


async def generate_with_retry(
    extracted_text: str,
    params: IngestionParameters,
    max_retries: int = 1,
) -> dict[str, Any]:
    """
    Generate deliverables with retry logic for transient failures.

    Args:
        extracted_text: Source content
        params: Generation parameters
        max_retries: Maximum number of retry attempts

    Returns:
        Generation result dictionary
    """
    last_error = None

    for attempt in range(max_retries + 1):
        try:
            return await generate_deliverables_async(extracted_text, params)
        except Exception as e:
            last_error = e
            if attempt < max_retries:
                logger.warning(
                    f"Generation attempt {attempt + 1} failed, retrying... ({str(e)})"
                )
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
            else:
                logger.error(f"Generation failed after {max_retries + 1} attempts")

    raise GenerationError(f"Generation failed: {str(last_error)}")
