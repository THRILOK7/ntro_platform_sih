# NTRO Platform API Examples

Quick reference for testing the ingestion API with various tools.

---

## cURL Examples

### Health Check

```bash
curl -X GET http://localhost:8000/health
```

Response:
```json
{
  "status": "operational",
  "phase": "Phase 1: Ingestion Engine"
}
```

### Ingest Raw Text Only

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=This is a test document with some sample content." \
  -F "parameters={
    \"target_audience\": \"General Public\",
    \"tone\": \"Formal\",
    \"language\": \"English\",
    \"detail_level\": \"Standard\",
    \"selected_outputs\": [\"Executive Summary\"]
  }"
```

### Ingest File Only

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@/path/to/document.pdf" \
  -F "parameters={
    \"target_audience\": \"Executives\",
    \"tone\": \"Formal\",
    \"language\": \"English\",
    \"detail_level\": \"Comprehensive\",
    \"selected_outputs\": [\"Executive Summary\", \"LinkedIn Post\"]
  }"
```

### Ingest File + Raw Text

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@/path/to/document.docx" \
  -F "raw_text=Additional notes from the meeting." \
  -F "parameters={
    \"target_audience\": \"Technical Experts\",
    \"tone\": \"Conversational\",
    \"language\": \"English\",
    \"detail_level\": \"Standard\",
    \"selected_outputs\": [\"Presentation\", \"Advisory\"]
  }"
```

### All Output Formats

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=Sample content" \
  -F "parameters={
    \"target_audience\": \"Media\",
    \"tone\": \"Urgent\",
    \"language\": \"English\",
    \"detail_level\": \"Brief\",
    \"selected_outputs\": [
      \"Video Package\",
      \"LinkedIn Post\",
      \"Twitter/X Post\",
      \"Advisory\",
      \"Infographic\",
      \"Executive Summary\",
      \"Presentation\"
    ]
  }"
```

### Test Image OCR

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@/path/to/image.png" \
  -F "parameters={
    \"target_audience\": \"General Public\",
    \"tone\": \"Conversational\",
    \"language\": \"English\",
    \"detail_level\": \"Brief\",
    \"selected_outputs\": [\"Executive Summary\"]
  }"
```

### Test Audio Transcription

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@/path/to/audio.mp3" \
  -F "parameters={
    \"target_audience\": \"General Public\",
    \"tone\": \"Formal\",
    \"language\": \"English\",
    \"detail_level\": \"Standard\",
    \"selected_outputs\": [\"Executive Summary\"]
  }"
```

---

## PowerShell Examples

### Health Check

```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET | ConvertTo-Json
```

### Ingest with PowerShell

```powershell
$params = @{
    target_audience = "Executives"
    tone = "Formal"
    language = "English"
    detail_level = "Comprehensive"
    selected_outputs = @("Executive Summary", "LinkedIn Post")
} | ConvertTo-Json

$body = @{
    raw_text = "Test document content"
    parameters = $params
}

Invoke-WebRequest -Uri "http://localhost:8000/api/v1/ingest" `
  -Method POST `
  -ContentType "application/json" `
  -Body ($body | ConvertTo-Json)
```

---

## Python Examples

### Simple Health Check

```python
import requests

response = requests.get("http://localhost:8000/health")
print(response.json())
```

### Ingest Raw Text

```python
import requests
import json

url = "http://localhost:8000/api/v1/ingest"

parameters = {
    "target_audience": "General Public",
    "tone": "Conversational",
    "language": "English",
    "detail_level": "Standard",
    "selected_outputs": ["Executive Summary"]
}

files = {
    "raw_text": (None, "This is test content for ingestion."),
    "parameters": (None, json.dumps(parameters))
}

response = requests.post(url, files=files)
result = response.json()

print(f"Ingestion ID: {result['ingestion_id']}")
print(f"Extracted chars: {result['char_count']}")
print(f"Extracted words: {result['word_count']}")
```

### Ingest File

```python
import requests
import json

url = "http://localhost:8000/api/v1/ingest"

parameters = {
    "target_audience": "Executives",
    "tone": "Formal",
    "language": "English",
    "detail_level": "Comprehensive",
    "selected_outputs": ["Executive Summary", "LinkedIn Post", "Presentation"]
}

with open("document.pdf", "rb") as f:
    files = {
        "file": f,
        "parameters": (None, json.dumps(parameters))
    }
    
    response = requests.post(url, files=files)
    result = response.json()
    
    print(f"Ingestion ID: {result['ingestion_id']}")
    print(f"File: {result['file_info']['filename']}")
    print(f"Extracted text preview: {result['extracted_text'][:200]}...")
```

### Ingest with Error Handling

```python
import requests
import json

url = "http://localhost:8000/api/v1/ingest"

def ingest_document(file_path=None, raw_text=None, parameters=None):
    if not file_path and not raw_text:
        raise ValueError("Either file_path or raw_text must be provided")
    
    if parameters is None:
        parameters = {
            "target_audience": "General Public",
            "tone": "Formal",
            "language": "English",
            "detail_level": "Standard",
            "selected_outputs": ["Executive Summary"]
        }
    
    files = {
        "parameters": (None, json.dumps(parameters))
    }
    
    if raw_text:
        files["raw_text"] = (None, raw_text)
    
    if file_path:
        files["file"] = open(file_path, "rb")
    
    try:
        response = requests.post(url, files=files, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if response.status_code == 400:
            print(f"Validation Error: {response.json()}")
        raise
    finally:
        if file_path and "file" in files:
            files["file"].close()

# Usage
result = ingest_document(
    file_path="document.pdf",
    raw_text="Additional context",
    parameters={
        "target_audience": "Executives",
        "tone": "Urgent",
        "language": "English",
        "detail_level": "Brief",
        "selected_outputs": ["LinkedIn Post", "Twitter/X Post"]
    }
)

print(f"Success! ID: {result['ingestion_id']}")
```

---

## JavaScript/Node.js Examples

### Fetch API

```javascript
// Health check
fetch('http://localhost:8000/health')
  .then(res => res.json())
  .then(data => console.log(data))

// Ingest with raw text
const parameters = {
  target_audience: "General Public",
  tone: "Conversational",
  language: "English",
  detail_level: "Standard",
  selected_outputs: ["Executive Summary"]
}

const formData = new FormData()
formData.append('raw_text', 'Test content here')
formData.append('parameters', JSON.stringify(parameters))

fetch('http://localhost:8000/api/v1/ingest', {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(result => {
    console.log(`Ingestion ID: ${result.ingestion_id}`)
    console.log(`Extracted: ${result.char_count} chars`)
  })
```

### Axios

```javascript
import axios from 'axios'

const client = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 60000
})

// Health check
client.get('/health')
  .then(res => console.log(res.data))

// Ingest file
const ingestFile = async (file, parameters) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('parameters', JSON.stringify(parameters))
  
  try {
    const response = await client.post('/api/v1/ingest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  } catch (error) {
    console.error('Ingestion failed:', error.response?.data || error.message)
    throw error
  }
}

// Usage
const file = document.getElementById('fileInput').files[0]
const parameters = {
  target_audience: "Executives",
  tone: "Formal",
  language: "English",
  detail_level: "Comprehensive",
  selected_outputs: ["Executive Summary", "Presentation"]
}

ingestFile(file, parameters)
  .then(result => console.log('Success:', result))
```

---

## Test Scenarios

### Scenario 1: Simple Text Ingestion

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=The quick brown fox jumps over the lazy dog." \
  -F "parameters={
    \"target_audience\": \"General Public\",
    \"tone\": \"Formal\",
    \"language\": \"English\",
    \"detail_level\": \"Brief\",
    \"selected_outputs\": [\"Executive Summary\"]
  }"
```

Expected: 
- Status 200
- Contains extracted_text = "The quick brown fox jumps over the lazy dog."
- char_count = 44
- word_count = 8

### Scenario 2: Missing Parameters

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=Sample text"
```

Expected:
- Status 422 or 400
- Error message about missing parameters

### Scenario 3: No Input

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "parameters={\"target_audience\": \"General Public\", \"tone\": \"Formal\", \"language\": \"English\", \"detail_level\": \"Standard\", \"selected_outputs\": [\"Executive Summary\"]}"
```

Expected:
- Status 400
- Error: "At least one of 'file' or 'raw_text' must be provided."

### Scenario 4: File Too Large

```bash
# Create a 600MB file
dd if=/dev/zero of=largefile.bin bs=1M count=600

curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@largefile.bin" \
  -F "parameters={\"target_audience\": \"General Public\", \"tone\": \"Formal\", \"language\": \"English\", \"detail_level\": \"Standard\", \"selected_outputs\": [\"Executive Summary\"]}"
```

Expected:
- Status 400
- Error: "File size exceeds 500 MB limit."

### Scenario 5: Invalid JSON Parameters

```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=Sample" \
  -F "parameters={invalid json}"
```

Expected:
- Status 400
- Error: "Invalid JSON in parameters"

---

## Response Inspection

### Success Response Structure

```json
{
  "status": "success",
  "ingestion_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_info": {
    "filename": "document.pdf",
    "size_bytes": 1048576
  },
  "extracted_text": "Full extracted text...",
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

### Error Response Structure

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Error description",
  "error_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-08-25T10:30:45.123456"
}
```

---

## Performance Benchmarks

Typical response times:

| Scenario | Time |
|----------|------|
| Health check | < 10ms |
| Plain text ingestion (1KB) | 50-100ms |
| DOCX file (1MB) | 200-500ms |
| PDF extraction (2MB) | 500-1000ms |
| Image OCR (2MB) | 2-5s |
| Audio transcription (30s) | 30-60s |

---

## Troubleshooting API Calls

### Check Backend is Running

```bash
curl http://localhost:8000/health
```

### Check API Response Format

```bash
curl -i -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=test" \
  -F "parameters={\"target_audience\": \"General Public\", \"tone\": \"Formal\", \"language\": \"English\", \"detail_level\": \"Standard\", \"selected_outputs\": [\"Executive Summary\"]}"
```

Look for:
- Status code 200
- Content-Type: application/json
- Valid JSON body

### Enable Verbose Logging (cURL)

```bash
curl -v -X POST http://localhost:8000/api/v1/ingest \
  -F "raw_text=test" \
  -F "parameters={...}"
```

Shows full HTTP headers and request/response details.

---

**Ready to test the API?** 🚀
