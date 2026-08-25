"""
Enterprise Gen AI Content Transformation Platform - Phase 1 Ingestion Engine
Production-ready FastAPI backend with defensive error handling and async operations.
"""

import json
import logging
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
import os

from parsers import extract_content
from generator import generate_with_retry
from prompts import IngestionParameters as GenerationParams

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("PORT", 8000))

# Validate required environment variables
if not OPENAI_API_KEY:
    raise ValueError(
        "OPENAI_API_KEY environment variable is required but not set. "
        "Please configure it in .env file."
    )

# Initialize FastAPI app
app = FastAPI(
    title="NTRO Platform - Phase 1 Ingestion Engine",
    description="Production-ready content ingestion and transformation API",
    version="1.0.0",
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Enum Definitions ====================


class TargetAudience(str, Enum):
    """Target audience for content transformation."""

    GENERAL_PUBLIC = "General Public"
    EXECUTIVES = "Executives"
    TECHNICAL_EXPERTS = "Technical Experts"
    MEDIA = "Media"


class Tone(str, Enum):
    """Tone for content transformation."""

    FORMAL = "Formal"
    URGENT = "Urgent"
    CONVERSATIONAL = "Conversational"
    REASSURING = "Reassuring"


class Language(str, Enum):
    """Output language."""

    ENGLISH = "English"
    HINDI = "Hindi"


class DetailLevel(str, Enum):
    """Level of detail for outputs."""

    BRIEF = "Brief"
    STANDARD = "Standard"
    COMPREHENSIVE = "Comprehensive"


# ==================== Pydantic Models ====================


class IngestionParameters(BaseModel):
    """Parameters controlling content ingestion and transformation."""

    target_audience: TargetAudience = Field(
        default=TargetAudience.GENERAL_PUBLIC,
        description="Target audience for the transformed content",
    )
    tone: Tone = Field(
        default=Tone.FORMAL, description="Desired tone of the transformed content"
    )
    language: Language = Field(
        default=Language.ENGLISH, description="Output language"
    )
    detail_level: DetailLevel = Field(
        default=DetailLevel.STANDARD, description="Level of detail in outputs"
    )
    selected_outputs: list[str] = Field(
        default_factory=lambda: ["Executive Summary"],
        description="List of selected output deliverables",
    )

    @field_validator("selected_outputs")
    @classmethod
    def validate_outputs(cls, v: list[str]) -> list[str]:
        """Validate that selected_outputs is non-empty."""
        if not v:
            raise ValueError("At least one output format must be selected")
        return v


class FileInfo(BaseModel):
    """Information about uploaded file."""

    filename: Optional[str] = Field(default=None, description="Original filename")
    size_bytes: Optional[int] = Field(default=None, description="File size in bytes")


class IngestionResponse(BaseModel):
    """Response model for ingestion endpoint."""

    status: str = Field(default="success", description="Operation status")
    ingestion_id: str = Field(description="Unique ingestion identifier (UUID)")
    file_info: Optional[FileInfo] = Field(
        default=None, description="Information about uploaded file"
    )
    extracted_text: str = Field(
        description="Complete extracted/combined text content"
    )
    char_count: int = Field(description="Total character count")
    word_count: int = Field(description="Total word count")
    parameters: dict = Field(description="Ingestion parameters as dict")
    timestamp: str = Field(description="ISO 8601 timestamp")


class HealthResponse(BaseModel):
    """Health check response model."""

    status: str = Field(default="operational", description="Service status")
    phase: str = Field(default="Phase 1: Ingestion Engine", description="Current phase")


# ==================== Exception Handlers ====================


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle ValueError with sanitized JSON response."""
    logger.warning(f"Validation error: {str(exc)}")
    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "code": "VALIDATION_ERROR",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with sanitized JSON response."""
    error_id = str(uuid4())
    logger.error(
        f"Unhandled exception [{error_id}]: {type(exc).__name__}: {str(exc)}",
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred during processing.",
            "error_id": error_id,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )


# ==================== API Endpoints ====================


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint for monitoring service status.

    Returns:
        HealthResponse: Current service operational status
    """
    return HealthResponse()


@app.post("/api/v1/ingest", response_model=IngestionResponse)
async def ingest_content(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    parameters: str = Form(...),
) -> IngestionResponse:
    """
    Main ingestion endpoint. Accepts file upload or raw text and applies
    specified parameters. Returns extracted/combined content with metadata.

    Args:
        file: Optional uploaded file (PDF, DOCX, images, audio, video)
        raw_text: Optional raw text input or transcript
        parameters: JSON-stringified IngestionParameters

    Returns:
        IngestionResponse: Structured response with extracted content and metadata

    Raises:
        HTTPException 400: If neither file nor raw_text provided, or invalid parameters
        HTTPException 500: If processing fails
    """
    ingestion_id = str(uuid4())

    try:
        # Validate that at least one input is provided
        if not file and not raw_text:
            logger.warning(
                f"[{ingestion_id}] Ingestion rejected: no file or raw_text provided"
            )
            raise ValueError(
                "At least one of 'file' or 'raw_text' must be provided."
            )

        # Parse and validate parameters
        try:
            params_dict = json.loads(parameters)
            ingestion_params = IngestionParameters(**params_dict)
        except json.JSONDecodeError as e:
            logger.warning(f"[{ingestion_id}] Invalid JSON parameters: {str(e)}")
            raise ValueError(f"Invalid JSON in parameters: {str(e)}") from e
        except ValueError as e:
            logger.warning(
                f"[{ingestion_id}] Invalid ingestion parameters: {str(e)}"
            )
            raise

        # Initialize content accumulator
        combined_content = ""
        file_info_obj = None

        # Process uploaded file if provided
        if file:
            try:
                file_bytes = await file.read()

                if not file_bytes:
                    raise ValueError("Uploaded file is empty.")

                logger.info(
                    f"[{ingestion_id}] Processing file: {file.filename} "
                    f"({len(file_bytes)} bytes)"
                )

                # Extract content using appropriate parser
                extracted_text = extract_content(file.filename or "unknown", file_bytes)
                combined_content += extracted_text

                # Store file metadata
                file_info_obj = FileInfo(
                    filename=file.filename, size_bytes=len(file_bytes)
                )

                logger.info(
                    f"[{ingestion_id}] File extraction successful: "
                    f"{len(extracted_text)} chars extracted"
                )

            except ValueError as e:
                logger.error(f"[{ingestion_id}] File processing error: {str(e)}")
                raise HTTPException(
                    status_code=400,
                    detail=f"File processing failed: {str(e)}",
                )
            except Exception as e:
                logger.error(
                    f"[{ingestion_id}] Unexpected file processing error: {str(e)}",
                    exc_info=True,
                )
                raise HTTPException(
                    status_code=500,
                    detail="Unexpected error during file processing.",
                )

        # Process raw text if provided
        if raw_text and raw_text.strip():
            if combined_content:
                combined_content += "\n\n"  # Double newline separator
            combined_content += raw_text.strip()
            logger.info(
                f"[{ingestion_id}] Raw text added: {len(raw_text)} chars"
            )

        # Ensure content is not empty
        if not combined_content.strip():
            logger.warning(f"[{ingestion_id}] Combined content is empty after processing")
            raise ValueError("No extractable content found in file or text input.")

        # Calculate metrics
        char_count = len(combined_content)
        word_count = len(combined_content.split())

        # Build response
        response = IngestionResponse(
            status="success",
            ingestion_id=ingestion_id,
            file_info=file_info_obj,
            extracted_text=combined_content,
            char_count=char_count,
            word_count=word_count,
            parameters=ingestion_params.model_dump(),
            timestamp=datetime.utcnow().isoformat(),
        )

        logger.info(
            f"[{ingestion_id}] Ingestion completed successfully. "
            f"Output: {char_count} chars, {word_count} words"
        )

        return response

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        # Convert ValueError to HTTP 400
        logger.warning(f"[{ingestion_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Catch-all for unexpected errors
        logger.error(
            f"[{ingestion_id}] Unexpected ingestion error: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during ingestion.",
        )


@app.post("/api/v1/generate")
async def generate_content(
    extracted_text: str = Form(...),
    parameters: str = Form(...),
) -> dict:
    """
    Content generation endpoint. Takes Phase 1 extracted text and generates
    targeted multi-platform deliverables using dynamic prompt engineering.

    Args:
        extracted_text: Source content from Phase 1 ingestion
        parameters: JSON-stringified IngestionParameters with selected outputs

    Returns:
        Dictionary with generation_id, deliverables, and execution time

    Raises:
        HTTPException 400: If invalid parameters
        HTTPException 500: If generation fails
    """
    generation_id = str(uuid4())

    try:
        # Validate inputs
        if not extracted_text or not extracted_text.strip():
            raise ValueError("Extracted text cannot be empty")

        if not parameters:
            raise ValueError("Parameters must be provided")

        # Parse parameters
        try:
            params_dict = json.loads(parameters)
            gen_params = GenerationParams(**params_dict)
        except json.JSONDecodeError as e:
            logger.warning(f"[{generation_id}] Invalid JSON parameters: {str(e)}")
            raise ValueError(f"Invalid JSON in parameters: {str(e)}") from e
        except ValueError as e:
            logger.warning(f"[{generation_id}] Invalid parameters: {str(e)}")
            raise

        if not gen_params.selected_outputs:
            raise ValueError("At least one output format must be selected")

        logger.info(
            f"[{generation_id}] Starting generation for {len(gen_params.selected_outputs)} formats"
        )

        # Generate deliverables asynchronously
        result = await generate_with_retry(extracted_text, gen_params)

        # Log success
        successful_count = len(result.get("deliverables", {}))
        logger.info(
            f"[{generation_id}] Generation complete: {successful_count} deliverables "
            f"in {result.get('execution_time_seconds', 0)}s"
        )

        return {
            "status": result.get("status"),
            "generation_id": result.get("generation_id"),
            "deliverables": result.get("deliverables"),
            "errors": result.get("errors"),
            "execution_time_seconds": result.get("execution_time_seconds"),
        }

    except ValueError as e:
        logger.warning(f"[{generation_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(
            f"[{generation_id}] Generation error: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An error occurred during content generation.",
        )


# ==================== Application Entry Point ====================


if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting NTRO Platform - Phase 1 on port {PORT}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=True,  # Development mode
        log_level="info",
    )
