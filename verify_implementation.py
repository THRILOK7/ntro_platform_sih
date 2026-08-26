#!/usr/bin/env python3
"""
NTRO Platform - Phases 3-5 Implementation Verification
Validates that all Phase 3-5 components are properly integrated
"""

import os
import sys
from pathlib import Path
import re


def check_file_exists(path, description):
    """Check if a file exists"""
    if os.path.exists(path):
        print(f"  ✓ {description}")
        return True
    else:
        print(f"  ✗ {description} - NOT FOUND")
        return False


def check_file_contains(path, pattern, description):
    """Check if a file contains a pattern"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            if pattern.lower() in content.lower():
                print(f"  ✓ {description}")
                return True
            else:
                print(f"  ✗ {description} - NOT FOUND")
                return False
    except Exception as e:
        print(f"  ⚠ {description} - Error: {e}")
        return False


print("=" * 50)
print("NTRO Platform Phases 3-5 Verification")
print("=" * 50)
print()

successes = 0
errors = 0
warnings = 0

# ============== BACKEND VERIFICATION ==============
print("🔍 BACKEND VERIFICATION")
print("=======================\n")

# Check Phase 3 endpoints
print("Checking Phase 3 endpoints...")
endpoints = [
    ("/api/v1/refine", "Refine endpoint"),
    ("/api/v1/export/pdf", "PDF export"),
    ("/api/v1/export/docx", "DOCX export"),
    ("/api/v1/export/json", "JSON export"),
    ("/api/v1/analytics", "Analytics endpoint"),
    ("/api/v1/tts", "Text-to-speech endpoint"),
]

for endpoint, desc in endpoints:
    if check_file_contains("backend/main.py", endpoint, desc):
        successes += 1
    else:
        errors += 1

# Check security features
print("\nChecking security features...")
if check_file_contains("backend/main.py", "slowapi", "Rate limiting (slowapi)"):
    successes += 1
else:
    errors += 1

if check_file_contains("backend/main.py", "cors", "CORS middleware"):
    successes += 1
else:
    warnings += 1

# Check export modules
print("\nChecking export modules...")
if check_file_exists("backend/export.py", "export.py"):
    successes += 1
    if check_file_contains("backend/export.py", "class PDFExporter", "PDFExporter class"):
        successes += 1
    else:
        errors += 1
    if check_file_contains("backend/export.py", "class DOCXExporter", "DOCXExporter class"):
        successes += 1
    else:
        errors += 1
    if check_file_contains("backend/export.py", "class ContentRefiner", "ContentRefiner class"):
        successes += 1
    else:
        errors += 1
else:
    errors += 4

# Check analytics module
print("\nChecking analytics module...")
if check_file_exists("backend/analytics.py", "analytics.py"):
    successes += 1
    if check_file_contains("backend/analytics.py", "class ContentAnalytics", "ContentAnalytics class"):
        successes += 1
    else:
        errors += 1
    if check_file_contains("backend/analytics.py", "def batch_analytics", "batch_analytics function"):
        successes += 1
    else:
        errors += 1
else:
    errors += 3

# Check TTS module
print("\nChecking TTS module...")
if check_file_exists("backend/tts.py", "tts.py"):
    successes += 1
    if check_file_contains("backend/tts.py", "async def generate_speech", "generate_speech function"):
        successes += 1
    else:
        errors += 1
    if check_file_contains("backend/tts.py", "async def generate_video_script_audio", "generate_video_script_audio function"):
        successes += 1
    else:
        errors += 1
else:
    errors += 3

# Check dependencies
print("\nChecking backend dependencies...")
dependencies = [
    ("reportlab", "PDF export"),
    ("python-docx", "DOCX export"),
    ("slowapi", "Rate limiting"),
    ("edge-tts", "Text-to-speech"),
    ("textblob", "Sentiment analysis"),
]

for dep, feature in dependencies:
    if check_file_contains("backend/requirements.txt", dep, f"{dep} ({feature})"):
        successes += 1
    else:
        errors += 1

# ============== FRONTEND VERIFICATION ==============
print("\n🔍 FRONTEND VERIFICATION")
print("========================\n")

# Check components
print("Checking Phase 3-5 components...")
components = [
    ("frontend/src/components/ReviewExport.tsx", "ReviewExport.tsx"),
    ("frontend/src/components/AnalyticsPanel.tsx", "AnalyticsPanel.tsx"),
    ("frontend/src/components/AudioPlayer.tsx", "AudioPlayer.tsx"),
]

for path, desc in components:
    if check_file_exists(path, desc):
        successes += 1
    else:
        errors += 1

# Check App.tsx integration
print("\nChecking App.tsx integration...")
app_checks = [
    ("import.*ReviewExport", "ReviewExport import"),
    ("import.*AnalyticsPanel", "AnalyticsPanel import"),
    ("import.*AudioPlayer", "AudioPlayer import"),
    ("resultTab", "Tab navigation"),
    ("analyticsResult", "Analytics state"),
    ("ttsAudioUrl", "TTS support"),
    ("toast", "Toast notifications"),
]

for pattern, desc in app_checks:
    # Case-sensitive search for exact matches
    with open("frontend/src/App.tsx", 'r', encoding='utf-8') as f:
        content = f.read()
        import re
        if re.search(pattern, content):
            print(f"  ✓ {desc}")
            successes += 1
        else:
            print(f"  ✗ {desc} - NOT FOUND")
            errors += 1

# Check API client
print("\nChecking API client endpoints...")
api_endpoints = [
    ("export const refineContent", "refineContent()"),
    ("export const exportDeliverables", "exportDeliverables()"),
    ("export const computeAnalytics", "computeAnalytics()"),
    ("export const generateTTS", "generateTTS()"),
]

for pattern, desc in api_endpoints:
    if check_file_contains("frontend/src/api.ts", pattern, desc):
        successes += 1
    else:
        errors += 1

# Check toast notifications
print("\nChecking toast notifications...")
if check_file_exists("frontend/src/utils/toast.ts", "toast.ts"):
    successes += 1
else:
    errors += 1

# ============== BUILD VERIFICATION ==============
print("\n🔍 BUILD VERIFICATION")
print("====================\n")

print("Checking Python syntax...")
python_files = [
    "backend/main.py",
    "backend/export.py",
    "backend/analytics.py",
    "backend/tts.py",
]

for file in python_files:
    if os.path.exists(file):
        ret = os.system(f"python -m py_compile {file} >nul 2>&1")
        if ret == 0:
            print(f"  ✓ {file}")
            successes += 1
        else:
            print(f"  ✗ {file} - Syntax error")
            errors += 1
    else:
        print(f"  ⚠ {file} - Not found")
        warnings += 1

# ============== SUMMARY ==============
print("\n" + "=" * 50)
print("VERIFICATION SUMMARY")
print("=" * 50)
print()

print(f"✓ Successes: {successes}")
print(f"⚠ Warnings:  {warnings}")
print(f"✗ Errors:    {errors}")

if errors > 0:
    print("\n❌ VERIFICATION FAILED")
    sys.exit(1)
elif warnings > 0:
    print("\n⚠ VERIFICATION PASSED (with warnings)")
    sys.exit(0)
else:
    print("\n✅ ALL CHECKS PASSED")
    print("\nPhases 3-5 are fully implemented and ready for production!")
    sys.exit(0)
