# Tesseract OCR Setup Guide for Windows

Tesseract is required for OCR functionality (extracting text from images and scanned PDFs).

## Installation

### Option 1: Automatic Installer (Recommended)

1. Download the Windows installer from:
   https://github.com/UB-Mannheim/tesseract/wiki

2. Look for the latest release (e.g., `tesseract-ocr-w64-setup-v5.x.x.exe`)

3. Run the installer and follow the prompts:
   - Accept license
   - Choose installation path (default is fine: `C:\Program Files\Tesseract-OCR`)
   - Accept all components
   - Complete installation

4. Verify installation:
   ```bash
   tesseract --version
   ```

### Option 2: Chocolatey Package Manager

If you have Chocolatey installed:

```bash
choco install tesseract
```

### Option 3: Manual Download & Setup

1. Download from: https://github.com/UB-Mannheim/tesseract/releases
2. Extract to: `C:\Program Files\Tesseract-OCR\`
3. Add to PATH (optional, for command-line access):
   - Press `Win+X`, select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", click "New"
   - Variable name: `TESSERACT_PATH`
   - Variable value: `C:\Program Files\Tesseract-OCR\tesseract.exe`

---

## Verification

### Test 1: Command Line
```bash
tesseract --version
```

Expected output:
```
tesseract 5.x.x
```

### Test 2: Python Integration

```python
import pytesseract
from PIL import Image

# Should return version without error
print(pytesseract.get_tesseract_version())

# Test OCR
img = Image.open('test_image.png')
text = pytesseract.image_to_string(img)
print(text)
```

### Test 3: Through NTRO Platform

1. Upload an image with text to the frontend
2. Check extracted text in result drawer
3. Verify OCR'd text is returned

---

## Troubleshooting

### "TesseractNotFoundError"

The backend will auto-fallback to the Windows default path:
```
C:\Program Files\Tesseract-OCR\tesseract.exe
```

If Tesseract is installed elsewhere, update `TESSERACT_PATH` in `backend/parsers.py`:

```python
TESSERACT_PATH = r"C:\Your\Custom\Path\tesseract.exe"
```

### "Error on line 24 of config file"

This usually means a language data file is missing. Re-run the installer and ensure all components are selected.

### Slow OCR Performance

- Ensure Tesseract is installed locally (not network drive)
- Consider using language-specific training data instead of all languages
- For batch processing, consider async/parallel processing

### OCR Not Working for PDFs

The system includes auto-fallback:
1. PyMuPDF extracts text normally
2. If extraction yields < 50 characters, OCR is triggered
3. For scanned PDFs without text layer, OCR will extract the visible content

---

## Language Support

By default, Tesseract includes English (eng) language data. To add more languages:

1. Download language data files from:
   https://github.com/UltimateHackers/tessdata

2. Copy `.traineddata` files to:
   ```
   C:\Program Files\Tesseract-OCR\tessdata\
   ```

3. Use in Python:
   ```python
   pytesseract.image_to_string(img, lang='hin')  # Hindi
   pytesseract.image_to_string(img, lang='hin+eng')  # Hindi + English
   ```

---

## Performance Optimization

### Single Language Mode

Instead of OCR'ing with all languages, specify language:

```python
# Fast - English only
text = pytesseract.image_to_string(img, lang='eng')

# Slower - All languages
text = pytesseract.image_to_string(img)
```

### Image Preprocessing

For better results with poor quality images:

```python
from PIL import Image
import cv2
import numpy as np

img = cv2.imread('image.png')

# Grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Threshold
_, thresh = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

# Denoise
denoised = cv2.fastNlMeansDenoising(thresh)

# OCR
text = pytesseract.image_to_string(Image.fromarray(denoised))
```

---

## Advanced: Tesseract Configuration

Create config for better results:

```python
config = r'--oem 3 --psm 6'  # Page Segmentation Mode
text = pytesseract.image_to_string(img, config=config)
```

PSM modes:
- 0: Legacy mode
- 1: Page segmentation with OSD
- 3: Fully automatic segmentation (default)
- 6: Assume single column
- 7: Single line

---

## Support

If OCR is not critical for your use case, the backend will gracefully degrade:
- For images without OCR: Returns error message
- For PDFs: Returns text-based extraction (no OCR)
- For audio/video: Returns Whisper transcription (no Tesseract needed)

To skip OCR entirely, remove `pytesseract` and `Pillow` from `requirements.txt`.

---

**Status**: ✅ Tesseract auto-configured in backend code
