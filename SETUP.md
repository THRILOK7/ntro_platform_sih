# NTRO Platform - Phase 1 Setup & Running Guide

## Step 1: Backend Setup

### 1.1 Install Python Dependencies

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 1.2 Configure Environment

Check that `.env` exists with:
```
OPENAI_API_KEY=your_openai_api_key_here
PORT=8000
```

### 1.3 Start Backend Server

```bash
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Test health endpoint:
```bash
curl http://localhost:8000/health
```

Response should be:
```json
{"status": "operational", "phase": "Phase 1: Ingestion Engine"}
```

---

## Step 2: Frontend Setup

### 2.1 Install Node Dependencies

```bash
cd frontend
npm install
```

### 2.2 Start Development Server

```bash
npm run dev
```

Expected output:
```
VITE v8.2.2  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 2.3 Open in Browser

Navigate to `http://localhost:5173/`

You should see:
- NTRO Platform header with "Operational" badge
- Drag-and-drop file zone
- Raw text input area
- Parameter controls (audience, tone, language, detail level, outputs)
- "Process & Ingest Pipeline" button

---

## Step 3: Test the System

### 3.1 Test with Raw Text

1. Click in the "Raw Text Input" area
2. Paste some sample text (minimum a few words)
3. Check at least one output format is selected
4. Click "Process & Ingest Pipeline"
5. Wait for result drawer to appear
6. View extracted content in the drawer

### 3.2 Test with File Upload

1. Prepare a test file (PDF, DOCX, or image)
2. Drag and drop into the file zone, or click to select
3. Verify file appears in the metadata card
4. Add optional raw text if desired
5. Configure parameters as desired
6. Click "Process & Ingest Pipeline"
7. Wait for result drawer to appear
8. Review extracted content and parameters

### 3.3 Test Error Handling

1. Click "Process & Ingest Pipeline" without providing any input
2. Should see error: "Please provide either a file or raw text content."
3. Try uploading a file larger than 500 MB
4. Should see error: "File size exceeds 500 MB limit."

---

## Step 4: Verify OCR Functionality (Optional)

### For PDF with Scanned Images:

1. Ensure Tesseract is installed
2. Upload a scanned PDF (text extraction < 50 chars triggers OCR)
3. Check backend logs for: "PDF text extraction yielded < 50 chars. Attempting OCR fallback."
4. Result should include OCR'd text

### For Image Files:

1. Upload a PNG/JPG with text
2. Check extracted text contains the visible text from image

---

## Step 5: Build for Production

### Backend:

```bash
# Install production server
pip install gunicorn

# Run with gunicorn (4 workers)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

### Frontend:

```bash
npm run build
# Output will be in frontend/dist/

# Serve locally for testing
npm run preview
```

---

## Troubleshooting

### Backend won't start

- Check Python version: `python --version` (should be 3.10+)
- Check virtual environment is activated: `.\venv\Scripts\activate`
- Check dependencies installed: `pip list | grep fastapi`
- Check port 8000 is available: `netstat -ano | findstr :8000`

### Frontend won't load

- Check Node version: `node --version` (should be 18+)
- Check npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -r node_modules && npm install`
- Clear browser cache (Ctrl+Shift+Delete)

### File upload fails

- Check file size (max 500 MB)
- Check OPENAI_API_KEY is valid in backend .env
- Check backend logs for specific error message
- For audio/video: verify ffmpeg is installed for Whisper

### Cannot access backend from frontend

- Check backend is running: `curl http://localhost:8000/health`
- Check CORS allowlist in `main.py` includes `http://localhost:5173`
- Check network connection: `ping localhost`

### OCR not working

- Verify Tesseract installation: `tesseract --version`
- Check path in `parsers.py`: `TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"`
- For non-Windows: update path accordingly

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│     Frontend (React 18 + Vite)      │
│  Command-center UI @ :5173          │
└──────────────┬──────────────────────┘
               │
               ↓ (Multipart FormData)
┌─────────────────────────────────────┐
│  Backend (FastAPI) @ :8000          │
├─────────────────────────────────────┤
│ Endpoint: POST /api/v1/ingest       │
│ ↓                                   │
│ ┌─────────────────────────────────┐ │
│ │ Document Parser Module          │ │
│ ├─────────────────────────────────┤ │
│ │ • parse_pdf()                   │ │
│ │ • parse_docx()                  │ │
│ │ • parse_image() [OCR]           │ │
│ │ • parse_audio_video() [Whisper] │ │
│ └─────────────────────────────────┘ │
│ ↓                                   │
│ Returns: IngestionResponse (JSON)   │
└─────────────────────────────────────┘
```

---

## API Endpoints Summary

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Service health check |
| POST | `/api/v1/ingest` | Main ingestion endpoint |

---

## Key Features Implemented

✅ **Backend:**
- FastAPI with async endpoints
- Pydantic v2 validation
- Multi-format document parsing
- OCR fallback for PDFs
- Tesseract + PyTesseract integration
- OpenAI Whisper transcription
- Auto-cleanup of temp files
- Comprehensive error handling
- CORS middleware configuration
- Structured JSON responses

✅ **Frontend:**
- React 18 with TypeScript
- Vite HMR development
- Tailwind CSS dark theme
- Drag-and-drop file upload
- Real-time health monitoring
- Parameter controls UI
- Result drawer with tabs
- Copy-to-clipboard functionality
- Responsive design
- Full type safety with Axios

---

## Next Steps

After Phase 1 verification, Phase 2 will implement:
- LLM-powered content transformation
- Multi-output format generation
- Advanced templating engine
- Job queue for background processing
- User authentication & authorization
- Database storage for ingestion history
- Webhook notifications

---

**Ready to ingest? Let's go!** 🚀
