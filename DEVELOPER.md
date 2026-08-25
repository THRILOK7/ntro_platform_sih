# NTRO Platform - Developer Guide

## Overview

This guide is for developers extending or maintaining the Phase 1 Ingestion Engine.

---

## Code Structure & Patterns

### Backend Architecture

#### FastAPI Patterns

**Async Endpoints:**
All endpoints are async for non-blocking I/O:
```python
@app.post("/api/v1/ingest", response_model=IngestionResponse)
async def ingest_content(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    parameters: str = Form(...),
) -> IngestionResponse:
    """Main endpoint handler"""
    pass
```

**Exception Handlers:**
Global exception handlers return sanitized JSON:
```python
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={
            "status": "error",
            "code": "VALIDATION_ERROR",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
```

#### Pydantic v2 Patterns

**Model with Validators:**
```python
class IngestionParameters(BaseModel):
    """Parameters with validation"""
    
    selected_outputs: list[str] = Field(
        default_factory=lambda: ["Executive Summary"],
        description="List of selected output deliverables",
    )

    @field_validator("selected_outputs")
    @classmethod
    def validate_outputs(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("At least one output format must be selected")
        return v
```

#### Document Parsing Patterns

**Modular Parsers with Error Handling:**
```python
def parse_pdf(file_bytes: bytes) -> str:
    """
    Parse PDF with OCR fallback.
    
    Args:
        file_bytes: Raw PDF bytes
    
    Returns:
        Extracted text string
    
    Raises:
        ValueError: If PDF cannot be parsed
    """
    try:
        # Implementation
        pass
    except Exception as e:
        raise ValueError(f"PDF parsing failed: {str(e)}") from e
```

**Auto-Cleanup Pattern:**
```python
def parse_audio_video(file_bytes: bytes, filename: str) -> str:
    temp_file_path = None
    
    try:
        # Create temp file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as f:
            temp_file_path = f.name
        
        # Process
        result = process_file(temp_file_path)
        return result
        
    except Exception as e:
        raise ValueError(f"Failed: {str(e)}") from e
    finally:
        # MANDATORY: Always cleanup
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.error(f"Cleanup failed: {e}")
```

---

### Frontend Architecture

#### React Patterns

**Functional Component with Hooks:**
```typescript
function App(): React.ReactElement {
  const [appState, setAppState] = useState<AppState>({
    selectedFile: null,
    rawText: "",
    isProcessing: false,
    result: null,
    error: null,
    healthStatus: { operational: false, lastChecked: new Date() },
    resultTabActive: "text",
    showResultDrawer: false,
  })

  useEffect(() => {
    checkServiceHealth()
    const healthInterval = setInterval(checkServiceHealth, 30000)
    return () => clearInterval(healthInterval)
  }, [])

  return (
    // JSX
  )
}
```

**Event Handler Pattern:**
```typescript
const handleFileSelect = (file: File): void => {
  // Validate
  if (file.size > 500 * 1024 * 1024) {
    setAppState((prev) => ({
      ...prev,
      error: `File size exceeds 500 MB limit.`,
    }))
    return
  }

  // Update state
  setAppState((prev) => ({
    ...prev,
    selectedFile: file,
    error: null,
  }))
}
```

#### Axios Patterns

**Interceptor Configuration:**
```typescript
const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
})

// Request interceptor
instance.interceptors.request.use(
  (config) => {
    console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const apiError = error.response?.data || {
      status: "error",
      code: "NETWORK_ERROR",
      message: error.message,
      timestamp: new Date().toISOString(),
    }
    return Promise.reject(apiError)
  }
)
```

**Strongly Typed Requests:**
```typescript
export const ingestContent = async (
  file: File | null,
  rawText: string,
  parameters: IngestionParams
): Promise<IngestionResponse> => {
  // Validation
  if (!file && !rawText.trim()) {
    throw {
      status: "error",
      code: "VALIDATION_ERROR",
      message: "At least one of file or raw text must be provided.",
      timestamp: new Date().toISOString(),
    } as ApiError
  }

  // Form construction
  const formData = new FormData()
  if (file) formData.append("file", file)
  if (rawText.trim()) formData.append("raw_text", rawText.trim())
  formData.append("parameters", JSON.stringify(parameters))

  // Request
  const response = await apiClient.post<IngestionResponse>(
    "/api/v1/ingest",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return response.data
}
```

#### CSS Organization

**Utility Classes:**
```css
.glass {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.card {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-secondary);
  transition: all 0.3s ease;
}

.gradient-button {
  background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%);
  transition: all 0.3s ease;
}

.gradient-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}
```

---

## Adding New Features

### Adding a New Document Parser

1. **Create parser function** in `backend/parsers.py`:

```python
def parse_doctype(file_bytes: bytes) -> str:
    """
    Parse DOCTYPE content.
    
    Args:
        file_bytes: Raw file bytes
    
    Returns:
        Extracted text
    
    Raises:
        ValueError: If parsing fails
    """
    try:
        # Parse logic
        extracted = do_parsing(file_bytes)
        return extracted.strip()
    except Exception as e:
        raise ValueError(f"DOCTYPE parsing failed: {str(e)}") from e
```

2. **Register in router** (`extract_content` function):

```python
def extract_content(filename: str, file_bytes: bytes) -> str:
    file_ext = Path(filename).suffix.lower()
    
    if file_ext == ".doctype":
        return parse_doctype(file_bytes)
    # ... existing cases
```

3. **Update supported types** in README and frontend

4. **Test with sample file**

---

### Adding a New Parameter

1. **Add to Pydantic model** (`backend/main.py`):

```python
class IngestionParameters(BaseModel):
    # Existing fields...
    new_param: str = Field(
        default="default_value",
        description="Description of new parameter"
    )
```

2. **Update frontend types** (`frontend/src/api.ts`):

```typescript
export interface IngestionParams {
  // Existing...
  new_param: string
}

export const DEFAULT_PARAMETERS: IngestionParams = {
  // Existing...
  new_param: "default_value",
}
```

3. **Add UI control** in `frontend/src/App.tsx`:

```typescript
<select
  value={parameters.new_param}
  onChange={(e) =>
    updateParameter("new_param", e.currentTarget.value)
  }
  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</select>
```

---

### Adding a New API Endpoint

1. **Define Pydantic models** for request/response

2. **Add route** in `backend/main.py`:

```python
@app.post("/api/v1/new-endpoint", response_model=ResponseModel)
async def new_endpoint(
    request_data: RequestModel
) -> ResponseModel:
    """
    Endpoint description.
    
    Args:
        request_data: Request payload
    
    Returns:
        ResponseModel: Response
    """
    try:
        result = process_data(request_data)
        return ResponseModel(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

3. **Add API function** in `frontend/src/api.ts`:

```typescript
export const newEndpoint = async (
  params: RequestParams
): Promise<ResponseModel> => {
  try {
    const response = await apiClient.post<ResponseModel>(
      "/api/v1/new-endpoint",
      params
    )
    return response.data
  } catch (error) {
    console.error("Request failed:", error)
    throw error
  }
}
```

4. **Update frontend component** to use new endpoint

---

## Testing Patterns

### Backend Testing (Future)

```python
# tests/test_parsers.py
import pytest
from parsers import parse_pdf

def test_parse_pdf_valid():
    """Test PDF parsing with valid input"""
    # Setup
    pdf_bytes = get_test_pdf()
    
    # Execute
    result = parse_pdf(pdf_bytes)
    
    # Assert
    assert isinstance(result, str)
    assert len(result) > 0

def test_parse_pdf_empty():
    """Test PDF parsing with empty input"""
    with pytest.raises(ValueError):
        parse_pdf(b"")
```

### Frontend Testing (Future)

```typescript
// src/__tests__/api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { ingestContent, apiClient } from '../api'

describe('API Client', () => {
  it('should construct FormData correctly', async () => {
    vi.spyOn(apiClient, 'post').mockResolvedValue({
      data: mockResponse
    })
    
    const result = await ingestContent(
      null,
      "test text",
      defaultParams
    )
    
    expect(result).toEqual(mockResponse)
  })
})
```

---

## Performance Optimization

### Backend

1. **Connection Pooling:**
   ```python
   # Already handled by FastAPI + Uvicorn
   # For databases, use async SQLAlchemy
   ```

2. **Caching:**
   ```python
   from functools import lru_cache
   
   @lru_cache(maxsize=128)
   def expensive_operation(param: str):
       return result
   ```

3. **Batch Processing:**
   - For Phase 2: Job queue with Celery

### Frontend

1. **Code Splitting:**
   ```typescript
   // vite.config.ts already configured:
   rollupOptions: {
     output: {
       manualChunks: {
         vendor: ['react', 'react-dom', 'axios'],
         ui: ['lucide-react'],
       },
     },
   }
   ```

2. **Image Optimization:**
   - Use WebP format where possible
   - Lazy load non-critical images

3. **Bundle Analysis:**
   ```bash
   npm run build -- --analyze
   ```

---

## Security Considerations

### Backend

1. **Input Validation:**
   - All inputs go through Pydantic validators
   - File size limits enforced (500 MB max)
   - File extension whitelist

2. **CORS Configuration:**
   - Only allow trusted origins
   - Update allowlist before production deployment

3. **Error Handling:**
   - Never expose internal stack traces
   - Sanitize error messages
   - Use error IDs for debugging

4. **Environment Variables:**
   - Never commit `.env` file
   - Use strong API keys
   - Rotate keys regularly

### Frontend

1. **XSS Protection:**
   - React auto-escapes by default
   - Use `dangerouslySetInnerHTML` only when necessary
   - Sanitize user input

2. **CSRF Protection:**
   - Implement CSRF tokens for state-changing operations
   - Use SameSite cookie policy

3. **Sensitive Data:**
   - Never store passwords or tokens in localStorage
   - Use HttpOnly cookies for auth tokens
   - Clear sensitive data on logout

---

## Debugging

### Backend Logging

```python
import logging

logger = logging.getLogger(__name__)

logger.info(f"Processing file: {filename}")
logger.warning("PDF OCR fallback triggered")
logger.error(f"Parse failed: {error}", exc_info=True)
```

**View logs:**
```bash
# Development console shows all logs
# Check backend terminal for detailed output
```

### Frontend Debugging

**React DevTools Browser Extension:**
- Install from Chrome Web Store
- Inspect component tree
- Track state changes
- Profile performance

**Console API:**
```typescript
console.debug("[Component] State updated:", state)
console.error("[API] Request failed:", error)
console.time("operation")
// ... code
console.timeEnd("operation")
```

### Network Debugging

**Network tab in DevTools:**
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action (file upload, etc.)
4. Click request to inspect
5. View headers, payload, response

---

## Deployment Checklist

### Before Deploying to Production

Backend:
- [ ] Remove debug logging
- [ ] Update CORS allowlist
- [ ] Set secure environment variables
- [ ] Test with production data
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Enable HTTPS

Frontend:
- [ ] Run `npm run build` and test
- [ ] Verify API URL points to production backend
- [ ] Remove development code
- [ ] Test on multiple browsers
- [ ] Optimize images and assets
- [ ] Set up CDN
- [ ] Enable caching headers

---

## Architecture Decisions

### Why FastAPI?
- Async/await support for high concurrency
- Automatic OpenAPI documentation
- Pydantic integration for validation
- Strong performance benchmarks

### Why React?
- Component reusability
- Excellent ecosystem
- Strong TypeScript support
- Large community

### Why Tailwind CSS?
- Utility-first approach (minimal CSS)
- Dark mode support built-in
- Responsive design utilities
- Performance optimized

---

## Roadmap

**Phase 2:**
- [ ] LLM-based content transformation
- [ ] Multi-format output generation
- [ ] Job queue for async processing
- [ ] Database persistence
- [ ] Authentication & authorization

**Phase 3:**
- [ ] Advanced analytics
- [ ] Audit logging
- [ ] Multi-user collaboration
- [ ] API rate limiting
- [ ] Webhooks & integrations

---

## Resources

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Docs](https://react.dev/)
- [Pydantic Docs](https://docs.pydantic.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Axios Docs](https://axios-http.com/)

---

**Happy coding!** 🚀
