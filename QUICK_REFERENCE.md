# NTRO Platform - Quick Reference Guide

## 🚀 Getting Started

### Backend Setup (5 minutes)
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Unix/Mac
# or
venv\Scripts\activate              # Windows

pip install -r requirements.txt
export GROQ_API_KEY="your-api-key"
python main.py
```
✓ Runs on `http://localhost:8000`

### Frontend Setup (5 minutes)
```bash
cd frontend
npm install
npm run dev
```
✓ Runs on `http://localhost:5173`

---

## 📋 API Endpoints Reference

### Phase 1-2: Ingestion & Generation
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/ingest` | Extract content from files or text |
| POST | `/api/v1/generate` | Generate multi-format deliverables |

### Phase 3: Refinement & Export
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/refine` | Refine content (shorten, formalize, translate) |
| POST | `/api/v1/export/pdf` | Export to PDF |
| POST | `/api/v1/export/docx` | Export to Word document |
| POST | `/api/v1/export/json` | Export to JSON |

### Phase 4: Analytics & Audio
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/analytics` | Compute metrics (reading time, sentiment, etc.) |
| POST | `/api/v1/tts` | Generate text-to-speech audio |

### System
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check service status & latency |

---

## 🎯 Frontend Components

### Main App (`App.tsx`)
- Input panel (files, parameters, outputs)
- Phase indicator (shows current operation)
- Tabbed results interface
- Error alerts with dismiss

### Result Tabs
1. **Deliverables** - View generated content per format
2. **Refine** - Edit and apply refinements
3. **Export** - Download PDF, DOCX, JSON, TXT
4. **Analytics** - Metrics dashboard
5. **Audio** - TTS generation and player

### Components
- `DeliverablesWorkspace` - Tabbed content viewer
- `ReviewExport` - Refinement UI
- `AnalyticsPanel` - Metrics display
- `AudioPlayer` - Audio playback

---

## 📝 Request/Response Examples

### Refine Content
**Request:**
```json
{
  "original_content": "The quick brown fox jumps over the lazy dog.",
  "instruction": "Make this more concise",
  "format_type": "Executive Summary",
  "parameters": { "target_audience": "Executives", "tone": "Formal" }
}
```

**Response:**
```json
{
  "status": "success",
  "refined_content": "Fox jumps over dog.",
  "change_summary": "Applied: Make this more concise",
  "original_length": 43,
  "refined_length": 18
}
```

### Export Deliverables
**Request:**
```
POST /api/v1/export/pdf
Content-Type: multipart/form-data
- deliverables: {"Executive Summary": "...", "LinkedIn Post": "..."}
- parameters: {"target_audience": "General Public", ...}
```

**Response:** Binary PDF file stream

### Compute Analytics
**Request:**
```json
{
  "deliverables": {
    "Executive Summary": "Key findings...",
    "LinkedIn Post": "Check out this insight..."
  },
  "parameters": { "target_audience": "Executives", ... }
}
```

**Response:**
```json
{
  "status": "success",
  "analytics": {
    "Executive Summary": {
      "reading_time_minutes": 3,
      "word_count": 450,
      "sentiment": "neutral",
      "entities": ["finding1", "finding2", ...],
      "estimated_audience_match": 0.92
    },
    ...
  },
  "timestamp": "2026-08-26T12:00:00"
}
```

### Generate TTS
**Request:**
```json
{
  "content": "This is the text to speak",
  "language": "English",
  "tone": "Formal",
  "format_type": "Executive Summary"
}
```

**Response:** Binary MP3 audio stream

---

## 🎛️ Configuration Options

### Environment Variables
```bash
GROQ_API_KEY=gsk_...      # Required for LLM
PORT=8000                  # Server port (default)
```

### Rate Limiting
- **Default**: 30 requests/minute per IP
- **Response**: 429 Too Many Requests
- **Configure**: Edit `main.py` line ~53

### CORS Origins (Production)
```python
# main.py - Update allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ],
)
```

---

## 🧪 Verification & Testing

### Run Verification
```bash
python verify_implementation.py
```
Expected output: ✅ ALL CHECKS PASSED (42/42)

### Frontend Build
```bash
cd frontend
npm run build
```
Output: Optimized bundle in `dist/` folder

### Python Syntax Check
```bash
python -m py_compile backend/*.py
```

---

## 🔍 Monitoring & Debugging

### Check Service Health
```bash
curl http://localhost:8000/health
```

### Monitor Requests
```bash
# Terminal 1: Start backend with logging
python main.py

# Terminal 2: Check logs
tail -f backend.log
```

### Frontend Console
```javascript
// Open browser DevTools (F12)
// Watch network tab for API requests
// Check console for errors
```

### Error Tracing
```
Every error includes an error_id (UUID).
Example error response:
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "User-friendly message",
  "error_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
Use error_id to find full traceback in server logs.

---

## 📊 Feature Highlights

### Phase 3: Refinement & Export
- **Shorten**: Reduce content by ~30%
- **Formalize**: Professional tone conversion
- **Translate**: Hindi language support
- **Custom**: Any refinement instruction
- **Export**: PDF, DOCX, JSON, TXT formats

### Phase 4: Analytics & TTS
- **Analytics**:
  - Reading time (200 words/minute)
  - Sentiment (positive/negative/neutral)
  - Entity extraction (top keywords)
  - Audience alignment scoring
  
- **TTS**:
  - Multiple languages (English, Hindi)
  - Tone variants (Formal, Conversational, Urgent)
  - MP3 output
  - **Free** (zero API key required)

### Phase 5: Security & Polish
- **Rate Limiting**: 30 requests/minute
- **Payload Limits**: 25MB maximum
- **Error IDs**: Traceable errors
- **Toast Notifications**: Real-time feedback
- **System Monitoring**: Health + latency

---

## 🔐 Security Checklist

- [ ] Set `GROQ_API_KEY` environment variable
- [ ] Update CORS origins for production domain
- [ ] Enable HTTPS on production (TLS cert)
- [ ] Configure rate limit for your scale
- [ ] Set up error logging service
- [ ] Enable audit trail if needed
- [ ] Test payload size limits
- [ ] Monitor API latency

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Backend won't start | Check `GROQ_API_KEY` is set |
| Frontend can't connect | Check backend runs on :8000, CORS enabled |
| Rate limit errors | Wait 1 minute or adjust limit in main.py |
| TTS no audio | `pip install edge-tts` |
| PDF export fails | `pip install reportlab` |
| Analytics error | `pip install textblob` |
| Port 8000 in use | `lsof -i :8000` (Unix/Mac) or find alternative port |

---

## 📱 Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 💾 File Structure

```
ntro-platform/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── parsers.py           # Content extraction
│   ├── generator.py         # LLM generation
│   ├── export.py            # PDF/DOCX export (Phase 3)
│   ├── analytics.py         # Analytics engine (Phase 4)
│   ├── tts.py               # Text-to-speech (Phase 4)
│   ├── prompts.py           # Prompt templates
│   ├── requirements.txt     # Dependencies
│   └── .env                 # Environment config
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application shell
│   │   ├── api.ts           # API client
│   │   ├── components/
│   │   │   ├── DeliverablesWorkspace.tsx  # Phase 2
│   │   │   ├── ReviewExport.tsx            # Phase 3 ✨
│   │   │   ├── AnalyticsPanel.tsx          # Phase 4 ✨
│   │   │   └── AudioPlayer.tsx             # Phase 4 ✨
│   │   └── utils/
│   │       └── toast.ts     # Notifications (Phase 5)
│   ├── package.json         # Dependencies
│   ├── vite.config.ts       # Build config
│   └── tailwind.config.js   # Styling
└── Documentation files
```

---

## 🎓 Learning Path

### For Backend Developers
1. Read `PHASES_3_5_IMPLEMENTATION.md` - Architecture overview
2. Study `backend/main.py` - Endpoint implementations
3. Review `backend/export.py` - PDF/DOCX generation
4. Explore `backend/analytics.py` - Metrics computation
5. Test with `curl` or Postman

### For Frontend Developers
1. Read `IMPLEMENTATION_COMPLETE.md` - Feature overview
2. Study `App.tsx` - State management and flow
3. Review component implementations
4. Test API client in browser console
5. Check network tab for request/response

### For DevOps Engineers
1. Review deployment requirements
2. Configure environment variables
3. Set up CORS for your domain
4. Configure rate limiting if needed
5. Set up monitoring (latency, errors, uptime)

---

## 📞 Support Resources

- **Docs**: See `PHASES_3_5_IMPLEMENTATION.md` for detailed feature docs
- **Verification**: Run `verify_implementation.py` to confirm setup
- **Logs**: Check backend console for detailed error messages
- **Error IDs**: Use error_id to trace issues

---

## 🎯 Next Steps

1. ✅ Run `python verify_implementation.py` - Confirm all checks pass
2. ✅ Start backend: `python main.py`
3. ✅ Start frontend: `npm run dev`
4. ✅ Open `http://localhost:5173` in browser
5. ✅ Test Phase 1-5 features
6. 🚀 Deploy to staging environment
7. 📊 Monitor metrics and logs
8. 🎉 Deploy to production

---

**Version**: 2.0.0  
**Last Updated**: August 26, 2026  
**Status**: ✅ Production Ready
