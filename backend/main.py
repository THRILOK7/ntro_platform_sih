"""
Enterprise Gen AI Content Transformation Platform - Phases 1-5 Complete Platform
Production-ready FastAPI backend with defensive error handling, rate limiting, and async operations.
"""

import json
import logging
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

from parsers import extract_content
from generator import generate_with_retry
from analytics import batch_analytics
from export import PDFExporter, DOCXExporter, ContentRefiner
from tts import generate_speech, generate_video_script_audio
from prompts import IngestionParameters as GenerationParams

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PORT = int(os.getenv("PORT", 8000))

# Validate required environment variables
if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY environment variable is required but not set. "
        "Please configure it in .env file."
    )

# Initialize FastAPI app
app = FastAPI(
    title="NTRO Platform - Phases 1-5: Complete Platform",
    description="Production-ready content ingestion, transformation, refinement, export, analytics, and text-to-speech API",
    version="2.0.0",
)

# Initialize rate limiter (30 requests per minute)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

# Add rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit exceeded for {get_remote_address(request)}")
    return JSONResponse(
        status_code=429,
        content={
            "status": "error",
            "code": "RATE_LIMIT_EXCEEDED",
            "message": "Too many requests. Maximum 30 requests per minute allowed.",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Alternative Vite port
        "http://localhost:3000",  # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add request size limit middleware (25MB max)
@app.middleware("http")
async def add_request_size_limit(request: Request, call_next):
    """Limit maximum request payload size to 25MB."""
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 25 * 1024 * 1024:
            return JSONResponse(
                status_code=413,
                content={
                    "status": "error",
                    "code": "REQUEST_TOO_LARGE",
                    "message": "Request payload exceeds 25MB limit.",
                },
            )
    return await call_next(request)


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
    phase: str = Field(default="Phase 1-5: Complete Platform", description="Current phase")


# ==================== Request/Response Models for Phase 3-5 ====================


class RefineRequest(BaseModel):
    """Request model for content refinement."""

    original_content: str = Field(description="Original content to refine")
    instruction: str = Field(description="Refinement instruction")
    format_type: str = Field(description="Type of deliverable")
    parameters: dict = Field(description="Generation parameters")


class AnalyticsRequest(BaseModel):
    """Request model for analytics computation."""

    deliverables: dict[str, str] = Field(description="Format -> Content mapping")
    parameters: dict = Field(description="Generation parameters")


class TTSRequest(BaseModel):
    """Request model for text-to-speech generation."""

    content: str = Field(description="Text to convert to speech")
    language: str = Field(default="English", description="Language")
    tone: str = Field(default="Conversational", description="Tone")
    format_type: str = Field(default="General", description="Content format type")


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
@limiter.limit("30/minute")
async def health_check(request: Request) -> HealthResponse:
    """
    Health check endpoint for monitoring service status.

    Returns:
        HealthResponse: Current service operational status
    """
    return HealthResponse()


@app.post("/api/v1/ingest", response_model=IngestionResponse)
@limiter.limit("30/minute")
async def ingest_content(
    request: Request,
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
@limiter.limit("30/minute")
async def generate_content(
    request: Request,
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


# ==================== Phase 3: Export & Refinement Endpoints ====================


@app.post("/api/v1/refine")
@limiter.limit("30/minute")
async def refine_content(request: Request, refine_req: RefineRequest) -> dict:
    """
    Refine generated content based on user instruction.

    Args:
        refine_req: RefineRequest with original content, instruction, format, and parameters

    Returns:
        Dictionary with refined_content and change_summary

    Raises:
        HTTPException 400: If invalid request
        HTTPException 500: If refinement fails
    """
    refine_id = str(uuid4())

    try:
        if not refine_req.original_content.strip():
            raise ValueError("Original content cannot be empty")

        if not refine_req.instruction.strip():
            raise ValueError("Refinement instruction cannot be empty")

        logger.info(f"[{refine_id}] Refining {refine_req.format_type}: {refine_req.instruction}")

        result = await ContentRefiner.refine_content(
            refine_req.original_content,
            refine_req.instruction,
            refine_req.format_type,
            GenerationParams(**refine_req.parameters),
        )

        if result.get("status") == "error":
            raise ValueError(result.get("error", "Refinement failed"))

        logger.info(f"[{refine_id}] Refinement successful")
        return result

    except ValueError as e:
        logger.warning(f"[{refine_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[{refine_id}] Refinement error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Refinement failed")


@app.post("/api/v1/export/pdf")
@limiter.limit("30/minute")
async def export_pdf(
    request: Request,
    deliverables: str = Form(...),
    parameters: str = Form(...),
):
    """
    Export deliverables to PDF format.

    Args:
        deliverables: JSON-stringified dictionary of format -> content
        parameters: JSON-stringified IngestionParameters

    Returns:
        StreamingResponse with PDF binary data
    """
    export_id = str(uuid4())

    try:
        # Parse inputs
        deliverables_dict = json.loads(deliverables)
        params_dict = json.loads(parameters)
        params = GenerationParams(**params_dict)

        logger.info(f"[{export_id}] Generating PDF with {len(deliverables_dict)} deliverables")

        # Generate PDF
        pdf_bytes = PDFExporter.generate_pdf(deliverables_dict, params)

        logger.info(f"[{export_id}] PDF generated: {len(pdf_bytes)} bytes")

        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=ntro_deliverables_{export_id}.pdf"},
        )

    except json.JSONDecodeError as e:
        logger.warning(f"[{export_id}] Invalid JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        logger.error(f"[{export_id}] PDF export error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="PDF export failed")


@app.post("/api/v1/export/docx")
@limiter.limit("30/minute")
async def export_docx(
    request: Request,
    deliverables: str = Form(...),
    parameters: str = Form(...),
):
    """
    Export deliverables to DOCX (Word) format.

    Args:
        deliverables: JSON-stringified dictionary of format -> content
        parameters: JSON-stringified IngestionParameters

    Returns:
        StreamingResponse with DOCX binary data
    """
    export_id = str(uuid4())

    try:
        # Parse inputs
        deliverables_dict = json.loads(deliverables)
        params_dict = json.loads(parameters)
        params = GenerationParams(**params_dict)

        logger.info(f"[{export_id}] Generating DOCX with {len(deliverables_dict)} deliverables")

        # Generate DOCX
        docx_bytes = DOCXExporter.generate_docx(deliverables_dict, params)

        logger.info(f"[{export_id}] DOCX generated: {len(docx_bytes)} bytes")

        return StreamingResponse(
            iter([docx_bytes]),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename=ntro_deliverables_{export_id}.docx"},
        )

    except json.JSONDecodeError as e:
        logger.warning(f"[{export_id}] Invalid JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        logger.error(f"[{export_id}] DOCX export error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="DOCX export failed")


@app.post("/api/v1/export/json")
@limiter.limit("30/minute")
async def export_json(
    request: Request,
    deliverables: str = Form(...),
    parameters: str = Form(...),
):
    """
    Export deliverables as JSON.

    Args:
        deliverables: JSON-stringified dictionary of format -> content
        parameters: JSON-stringified IngestionParameters

    Returns:
        JSONResponse with all deliverables and metadata
    """
    try:
        deliverables_dict = json.loads(deliverables)
        params_dict = json.loads(parameters)

        export_data = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "deliverables": deliverables_dict,
            "parameters": params_dict,
            "export_format": "json",
        }

        return JSONResponse(content=export_data)

    except json.JSONDecodeError as e:
        logger.warning(f"JSON export error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")


# ==================== Phase 4: Analytics & TTS Endpoints ====================


@app.post("/api/v1/analytics")
@limiter.limit("30/minute")
async def compute_analytics(
    request: Request,
    deliverables: str = Form(...),
    parameters: str = Form(...),
) -> dict:
    """
    Compute analytics metrics for generated deliverables.

    Args:
        deliverables: JSON-stringified dictionary of format -> content
        parameters: JSON-stringified generation parameters

    Returns:
        Dictionary mapping format names to analytics results
    """
    try:
        # Parse JSON inputs
        deliverables_dict = json.loads(deliverables)
        params_dict = json.loads(parameters)
        
        logger.info(f"Computing analytics for {len(deliverables_dict)} deliverables")

        analytics = batch_analytics(deliverables_dict)

        return {
            "status": "success",
            "analytics": analytics,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except json.JSONDecodeError as e:
        logger.warning(f"Invalid JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    except Exception as e:
        logger.error(f"Analytics computation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Analytics computation failed")


@app.post("/api/v1/tts")
@limiter.limit("30/minute")
async def generate_tts(
    request: Request,
    tts_req: TTSRequest,
):
    """
    Generate text-to-speech audio from content.

    Args:
        tts_req: TTSRequest with content, language, and tone

    Returns:
        StreamingResponse with MP3 audio data

    Raises:
        HTTPException 400: If content is empty
        HTTPException 500: If TTS generation fails
    """
    tts_id = str(uuid4())

    try:
        if not tts_req.content.strip():
            raise ValueError("Content cannot be empty")

        logger.info(f"[{tts_id}] Generating TTS: language={tts_req.language}, tone={tts_req.tone}")

        # Special handling for video scripts
        if tts_req.format_type == "Video Package":
            audio_bytes = await generate_video_script_audio(tts_req.content, tts_req.language)
        else:
            audio_bytes = await generate_speech(
                tts_req.content,
                language=tts_req.language,
                tone=tts_req.tone,
            )

        if not audio_bytes:
            logger.warning(f"[{tts_id}] TTS generation returned no audio")
            raise ValueError("TTS generation failed - no audio produced")

        logger.info(f"[{tts_id}] TTS generated successfully: {len(audio_bytes)} bytes")

        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"attachment; filename=audio_{tts_id}.mp3"},
        )

    except ValueError as e:
        logger.warning(f"[{tts_id}] Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"[{tts_id}] TTS error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="TTS generation failed")


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
