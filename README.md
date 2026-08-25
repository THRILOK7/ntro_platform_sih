# NTRO Platform - Phase 1: Ingestion Engine & Operational Dashboard

Enterprise-grade Gen AI Content Transformation Platform with production-ready backend and modern frontend.

## 📋 Overview

**Phase 1** implements a robust content ingestion engine that:

- Ingests multiple file formats (PDF, DOCX, images, audio, video) with intelligent parsing
- Supports raw text input and manual transcripts
- Provides OCR fallback for scanned documents
- Returns structured, metadata-rich ingestion responses
- Delivers an intuitive command-center dashboard for content operators

## 🏗️ Architecture

### Backend Stack
- **Framework**: FastAPI with async/await for high concurrency
- **Validation**: Pydantic v2 with field validators
- **Document Parsing**: PyMuPDF (PDF), python-docx (DOCX), Pillow + Tesseract (OCR), OpenAI Whisper (Audio/Video)
- **API Format**: RESTful with structured JSON responses
- **Error Handling**: Defensive file validation, sanitized error responses, auto-cleanup

### Frontend Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite for lightning-fast HMR
- **Styling**: Tailwind CSS v4 + custom dark theme
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React

---

## 🚀 Quick Start

### Prerequisites

1. **Python 3.10+** - Backend runtime
2. **Node.js 18+** - Frontend build and dev server
3. **Tesseract OCR** (optional, for OCR functionality)
   - Windows: Download installer from https://github.com/UB-Mannheim/tesseract/wiki
   - Default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify OpenAI API key in .env
cat .env

# Start development server
python main.py
```

Backend will run on `http://localhost:8000`

Health check: `http://localhost:8000/health`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## 📚 API Documentation

### Authentication
No authentication required for Phase 1. For production, implement JWT-based auth.

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "operational",
  "phase": "Phase 1: Ingestion Engine"
}
```

### Ingest Content
```http
POST /api/v1/ingest
Content-Type: multipart/form-data

file: (Optional) File upload (PDF, DOCX, images, audio, video)
raw_text: (Optional) Raw text input
parameters: (Required) JSON-stringified IngestionParameters
```

**Request Example (cURL):**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@document.pdf" \
  -F "raw_text=Additional context here" \
  -F "parameters={
    \"target_audience\": \"Executives\",
    \"tone\": \"Formal\",
    \"language\": \"English\",
    \"detail_level\": \"Comprehensive\",
    \"selected_outputs\": [\"Executive Summary\", \"LinkedIn Post\"]
  }"
```

**Response:**
```json
{
  "status": "success",
  "ingestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_info": {
    "filename": "document.pdf",
    "size_bytes": 1048576
  },
  "extracted_text": "Full extracted content...",
  "char_count": 5234,
  "word_count": 847,
  "parameters": {
    "target_audience": "Executives",
    "tone": "Formal",
    "language": "English",
    "detail_level": "Comprehensive",
    "selected_outputs": ["Executive Summary", "LinkedIn Post"]
  },
  "timestamp": "2024-08-25T10:30:45.123456"
}
```

### Parameters

**IngestionParameters Schema:**

| Parameter | Type | Values | Default |
|-----------|------|--------|---------|
| `target_audience` | Enum | General Public, Executives, Technical Experts, Media | General Public |
| `tone` | Enum | Formal, Urgent, Conversational, Reassuring | Formal |
| `language` | Enum | English, Hindi | English |
| `detail_level` | Enum | Brief, Standard, Comprehensive | Standard |
| `selected_outputs` | Array[str] | Video Package, LinkedIn Post, Twitter/X Post, Advisory, Infographic, Executive Summary, Presentation | ["Executive Summary"] |

### Error Responses

**400 Bad Request:**
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "At least one of 'file' or 'raw_text' must be provided.",
  "timestamp": "2024-08-25T10:30:45.123456"
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred during processing.",
  "error_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-08-25T10:30:45.123456"
}
```

---

## 🎨 Frontend Features

### Navigation Bar
- Platform title with phase indicator
- Operational status badge (real-time health check pinging every 30s)

### Source Material Panel
- **Drag-and-Drop Zone**: Visual file selection with type indicators
- **File Card**: Shows filename, size, file type with auto-clear action
- **Raw Text Area**: Auto-expanding textarea for manual input, character counter

### Parameters Control Matrix
- **Output Deliverables**: Interactive checkbox grid (7 options)
- **Target Audience**: Dropdown selector (4 options)
- **Tone**: Dropdown selector (4 options)
- **Language**: Dual-button toggle (English / Hindi)
- **Detail Level**: Visual radio card selector (3 options)

### Control & Execution
- Primary "Process & Ingest Pipeline" button
- Loading spinner during processing
- Validation warnings on missing inputs
- Error alerts with dismissal

### Result Drawer
- Summary badges (ID, char count, word count, timestamp)
- **Text Tab**: Formatted extracted content with copy button (2000 char preview + indicator)
- **JSON Tab**: Syntax-highlighted parameters inspector with copy button
- "Start New Ingestion" action to reset UI

---

## 📝 Supported File Types

| Category | Extensions | Parser |
|----------|-----------|--------|
| **Documents** | .pdf | PyMuPDF + OCR fallback |
| **Documents** | .docx | python-docx |
| **Images** | .png, .jpg, .jpeg, .gif, .bmp, .webp, .tiff | Tesseract OCR |
| **Audio** | .mp3, .wav, .m4a, .flac, .ogg | OpenAI Whisper |
| **Video** | .mp4, .webm, .mov, .avi | OpenAI Whisper |

---

## 🛡️ Error Handling & Resilience

### Backend
- **Defensive Validation**: File size limits, content-type checking
- **Graceful Degradation**: PDF OCR fallback for scanned documents
- **Auto-Cleanup**: Temporary audio files auto-deleted via try/finally blocks
- **Structured Errors**: Sanitized JSON responses without stack traces
- **Request Logging**: Comprehensive logging with ingestion IDs for tracing

### Frontend
- **Client Validation**: File size check (500 MB limit) before upload
- **Network Error Handling**: Axios interceptors with fallback messages
- **State Management**: React hooks with error states and recovery
- **Accessibility**: Focus rings, proper ARIA labels, keyboard navigation

---

## 🔧 Development

### Code Style
- Backend: PEP 8 compliant, type hints, comprehensive docstrings
- Frontend: ESLint (oxlint), Prettier formatting, TypeScript strict mode

### Running Tests
```bash
# Backend (future phase)
# pytest

# Frontend (future phase)
# npm run test
```

### Building for Production

**Backend:**
```bash
cd backend
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

**Frontend:**
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

---

## 📋 File Structure

```
ntro-platform/
├── backend/
│   ├── main.py                 # FastAPI app + endpoints
│   ├── parsers.py              # Document parsing utilities
│   ├── requirements.txt         # Python dependencies
│   ├── .env                    # Environment variables
│   └── venv/                   # Virtual environment
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   ├── api.ts              # Axios client + types
│   │   ├── main.tsx            # Entry point
│   │   ├── App.css             # Component-specific styles
│   │   ├── index.css           # Global + Tailwind
│   │   └── assets/
│   ├── index.html              # HTML template
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts          # Vite configuration
│   ├── tsconfig.json           # TypeScript config
│   └── .env                    # Frontend env vars
└── README.md
```

---

## 🚨 Common Issues

### Tesseract Not Found
- Ensure Tesseract is installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`
- Or update `TESSERACT_PATH` in `backend/parsers.py`

### CORS Errors
- Frontend on non-localhost? Update CORS allowlist in `backend/main.py`
- Ensure backend is running on port 8000

### File Upload Fails
- Check backend logs for detailed error message
- Verify file size < 500 MB
- Ensure OPENAI_API_KEY is valid in `.env`

### Frontend Won't Load
- Clear browser cache (Cmd+Shift+Delete)
- Check that backend health check passes
- Verify frontend running on port 5173

---

## 📞 Support & Contribution

For issues, feature requests, or contributions, please open an issue or PR.

---

## 📄 License

Enterprise proprietary. All rights reserved.

---

**Phase 1 Status**: ✅ Complete and Production-Ready

**Phase 2** (Coming): Content Transformation Engine with LLM integration for generating tailored outputs.
