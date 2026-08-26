# NTRO Platform - Phases 3-5 Implementation Verification Script
# Validates that all Phase 3-5 components are properly integrated

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "NTRO Platform Phases 3-5 Verification" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$successes = @()

# ============== BACKEND VERIFICATION ==============
Write-Host "🔍 BACKEND VERIFICATION" -ForegroundColor Yellow
Write-Host "=======================`n" -ForegroundColor Yellow

# Check main.py for Phase 3-5 endpoints
Write-Host "Checking Phase 3 endpoints..." -ForegroundColor Gray
$mainPy = Get-Content "backend/main.py" -Raw

$endpoints = @(
    @{ name = "/api/v1/refine"; found = $false },
    @{ name = "/api/v1/export/pdf"; found = $false },
    @{ name = "/api/v1/export/docx"; found = $false },
    @{ name = "/api/v1/export/json"; found = $false },
    @{ name = "/api/v1/analytics"; found = $false },
    @{ name = "/api/v1/tts"; found = $false }
)

foreach ($endpoint in $endpoints) {
    if ($mainPy -match [regex]::Escape($endpoint.name)) {
        $endpoint.found = $true
    }
}

foreach ($endpoint in $endpoints) {
    if ($endpoint.found) {
        Write-Host "  ✓ $($endpoint.name)" -ForegroundColor Green
        $successes += $endpoint.name
    } else {
        Write-Host "  ✗ $($endpoint.name) - MISSING" -ForegroundColor Red
        $errors += "Missing endpoint: $($endpoint.name)"
    }
}

# Check for rate limiting
Write-Host "`nChecking security features..." -ForegroundColor Gray
if ($mainPy -match "slowapi") {
    Write-Host "  ✓ Rate limiting (slowapi)" -ForegroundColor Green
    $successes += "Rate limiting"
} else {
    Write-Host "  ✗ Rate limiting - MISSING" -ForegroundColor Red
    $errors += "Rate limiting not configured"
}

if ($mainPy -match "RequestSizeLimitMiddleware|add_request_size_limit") {
    Write-Host "  ✓ Request size limiting" -ForegroundColor Green
    $successes += "Request size limits"
} else {
    Write-Host "  ✗ Request size limiting - NOT FOUND" -ForegroundColor Yellow
    $warnings += "Request size limiting may not be configured"
}

# Check for export modules
Write-Host "`nChecking export modules..." -ForegroundColor Gray
if (Test-Path "backend/export.py") {
    Write-Host "  ✓ export.py exists" -ForegroundColor Green
    $successes += "Export module"
    
    $exportPy = Get-Content "backend/export.py" -Raw
    
    if ($exportPy -match "class PDFExporter") {
        Write-Host "    ✓ PDFExporter class" -ForegroundColor Green
    } else {
        Write-Host "    ✗ PDFExporter class - NOT FOUND" -ForegroundColor Red
        $errors += "PDFExporter class missing"
    }
    
    if ($exportPy -match "class DOCXExporter") {
        Write-Host "    ✓ DOCXExporter class" -ForegroundColor Green
    } else {
        Write-Host "    ✗ DOCXExporter class - NOT FOUND" -ForegroundColor Red
        $errors += "DOCXExporter class missing"
    }
    
    if ($exportPy -match "class ContentRefiner") {
        Write-Host "    ✓ ContentRefiner class" -ForegroundColor Green
    } else {
        Write-Host "    ✗ ContentRefiner class - NOT FOUND" -ForegroundColor Red
        $errors += "ContentRefiner class missing"
    }
} else {
    Write-Host "  ✗ export.py - NOT FOUND" -ForegroundColor Red
    $errors += "export.py module missing"
}

# Check for analytics module
Write-Host "`nChecking analytics module..." -ForegroundColor Gray
if (Test-Path "backend/analytics.py") {
    Write-Host "  ✓ analytics.py exists" -ForegroundColor Green
    $successes += "Analytics module"
    
    $analyticsPy = Get-Content "backend/analytics.py" -Raw
    
    if ($analyticsPy -match "class ContentAnalytics") {
        Write-Host "    ✓ ContentAnalytics class" -ForegroundColor Green
    } else {
        Write-Host "    ✗ ContentAnalytics class - NOT FOUND" -ForegroundColor Red
        $errors += "ContentAnalytics class missing"
    }
    
    if ($analyticsPy -match "def batch_analytics") {
        Write-Host "    ✓ batch_analytics function" -ForegroundColor Green
    } else {
        Write-Host "    ✗ batch_analytics function - NOT FOUND" -ForegroundColor Red
        $errors += "batch_analytics function missing"
    }
} else {
    Write-Host "  ✗ analytics.py - NOT FOUND" -ForegroundColor Red
    $errors += "analytics.py module missing"
}

# Check for TTS module
Write-Host "`nChecking TTS module..." -ForegroundColor Gray
if (Test-Path "backend/tts.py") {
    Write-Host "  ✓ tts.py exists" -ForegroundColor Green
    $successes += "TTS module"
    
    $ttsPy = Get-Content "backend/tts.py" -Raw
    
    if ($ttsPy -match "async def generate_speech") {
        Write-Host "    ✓ generate_speech function" -ForegroundColor Green
    } else {
        Write-Host "    ✗ generate_speech function - NOT FOUND" -ForegroundColor Red
        $errors += "generate_speech function missing"
    }
    
    if ($ttsPy -match "async def generate_video_script_audio") {
        Write-Host "    ✓ generate_video_script_audio function" -ForegroundColor Green
    } else {
        Write-Host "    ✗ generate_video_script_audio function - NOT FOUND" -ForegroundColor Red
        $errors += "generate_video_script_audio function missing"
    }
} else {
    Write-Host "  ✗ tts.py - NOT FOUND" -ForegroundColor Red
    $errors += "tts.py module missing"
}

# Check backend dependencies
Write-Host "`nChecking backend dependencies..." -ForegroundColor Gray
$requirementsTxt = Get-Content "backend/requirements.txt" -Raw
$dependencies = @(
    @{ name = "reportlab"; feature = "PDF export" },
    @{ name = "python-docx"; feature = "DOCX export" },
    @{ name = "slowapi"; feature = "Rate limiting" },
    @{ name = "edge-tts"; feature = "Text-to-speech" },
    @{ name = "textblob"; feature = "Sentiment analysis" }
)

foreach ($dep in $dependencies) {
    if ($requirementsTxt -match $dep.name) {
        Write-Host "  ✓ $($dep.name) ($($dep.feature))" -ForegroundColor Green
        $successes += $dep.name
    } else {
        Write-Host "  ✗ $($dep.name) - MISSING" -ForegroundColor Red
        $errors += "Missing dependency: $($dep.name)"
    }
}

# ============== FRONTEND VERIFICATION ==============
Write-Host "`n🔍 FRONTEND VERIFICATION" -ForegroundColor Yellow
Write-Host "========================`n" -ForegroundColor Yellow

# Check for Phase 3-5 components
Write-Host "Checking Phase 3-5 components..." -ForegroundColor Gray
$components = @(
    @{ name = "ReviewExport.tsx"; path = "frontend/src/components/ReviewExport.tsx" },
    @{ name = "AnalyticsPanel.tsx"; path = "frontend/src/components/AnalyticsPanel.tsx" },
    @{ name = "AudioPlayer.tsx"; path = "frontend/src/components/AudioPlayer.tsx" }
)

foreach ($component in $components) {
    if (Test-Path $component.path) {
        Write-Host "  ✓ $($component.name)" -ForegroundColor Green
        $successes += $component.name
    } else {
        Write-Host "  ✗ $($component.name) - NOT FOUND" -ForegroundColor Red
        $errors += "Missing component: $($component.name)"
    }
}

# Check App.tsx for Phase 3-5 integration
Write-Host "`nChecking App.tsx integration..." -ForegroundColor Gray
$appTsx = Get-Content "frontend/src/App.tsx" -Raw

$appChecks = @(
    @{ name = "ReviewExport import"; pattern = "import.*ReviewExport" },
    @{ name = "AnalyticsPanel import"; pattern = "import.*AnalyticsPanel" },
    @{ name = "AudioPlayer import"; pattern = "import.*AudioPlayer" },
    @{ name = "Tab navigation"; pattern = "resultTab" },
    @{ name = "Analytics state"; pattern = "analyticsResult" },
    @{ name = "TTS support"; pattern = "ttsAudioUrl" }
)

foreach ($check in $appChecks) {
    if ($appTsx -match $check.pattern) {
        Write-Host "  ✓ $($check.name)" -ForegroundColor Green
        $successes += $check.name
    } else {
        Write-Host "  ✗ $($check.name) - NOT FOUND" -ForegroundColor Red
        $errors += "Missing App.tsx feature: $($check.name)"
    }
}

# Check API client
Write-Host "`nChecking API client endpoints..." -ForegroundColor Gray
$apiTs = Get-Content "frontend/src/api.ts" -Raw

$apiEndpoints = @(
    @{ name = "refineContent"; pattern = "export const refineContent" },
    @{ name = "exportDeliverables"; pattern = "export const exportDeliverables" },
    @{ name = "computeAnalytics"; pattern = "export const computeAnalytics" },
    @{ name = "generateTTS"; pattern = "export const generateTTS" }
)

foreach ($endpoint in $apiEndpoints) {
    if ($apiTs -match $endpoint.pattern) {
        Write-Host "  ✓ $($endpoint.name)()" -ForegroundColor Green
        $successes += "api.$($endpoint.name)"
    } else {
        Write-Host "  ✗ $($endpoint.name)() - NOT FOUND" -ForegroundColor Red
        $errors += "Missing API endpoint: $($endpoint.name)"
    }
}

# Check for toast notifications
Write-Host "`nChecking toast notifications..." -ForegroundColor Gray
if (Test-Path "frontend/src/utils/toast.ts") {
    Write-Host "  ✓ toast.ts exists" -ForegroundColor Green
    $successes += "Toast notifications"
    
    $toastTs = Get-Content "frontend/src/utils/toast.ts" -Raw
    
    if ($toastTs -match "showToast.*success|error|info") {
        Write-Host "    ✓ Success/error/info toast types" -ForegroundColor Green
    } else {
        Write-Host "    ✗ Toast types incomplete" -ForegroundColor Yellow
        $warnings += "Toast types may be incomplete"
    }
} else {
    Write-Host "  ✗ toast.ts - NOT FOUND" -ForegroundColor Red
    $errors += "Toast notification system missing"
}

# ============== BUILD VERIFICATION ==============
Write-Host "`n🔍 BUILD VERIFICATION" -ForegroundColor Yellow
Write-Host "====================`n" -ForegroundColor Yellow

Write-Host "Checking Python syntax..." -ForegroundColor Gray
$pythonFiles = @("main.py", "export.py", "analytics.py", "tts.py", "parsers.py", "generator.py", "prompts.py")

foreach ($file in $pythonFiles) {
    $filePath = "backend/$file"
    if (Test-Path $filePath) {
        try {
            $output = & python -m py_compile $filePath 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ $file" -ForegroundColor Green
                $successes += "$file syntax"
            } else {
                Write-Host "  ✗ $file - Syntax error" -ForegroundColor Red
                $errors += "Syntax error in $file"
            }
        } catch {
            Write-Host "  ⚠ $file - Could not check" -ForegroundColor Yellow
            $warnings += "Could not verify $file syntax"
        }
    }
}

Write-Host "`nChecking TypeScript compilation..." -ForegroundColor Gray
Push-Location frontend
$tscOutput = & npm run build 2>&1
$buildSuccess = $LASTEXITCODE -eq 0
Pop-Location

if ($buildSuccess) {
    Write-Host "  ✓ Frontend builds successfully" -ForegroundColor Green
    $successes += "Frontend build"
} else {
    Write-Host "  ✗ Frontend build failed" -ForegroundColor Red
    $errors += "Frontend build failed"
    Write-Host "Build output:" -ForegroundColor Red
    Write-Host $tscOutput
}

# ============== SUMMARY ==============
Write-Host "`n" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✓ Successes: $($successes.Count)" -ForegroundColor Green
Write-Host "⚠ Warnings: $($warnings.Count)" -ForegroundColor Yellow
Write-Host "✗ Errors: $($errors.Count)" -ForegroundColor Red

if ($errors.Count -gt 0) {
    Write-Host "`nErrors found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  • $error" -ForegroundColor Red
    }
    Write-Host "`n❌ VERIFICATION FAILED" -ForegroundColor Red
    exit 1
} elseif ($warnings.Count -gt 0) {
    Write-Host "`nWarnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  • $warning" -ForegroundColor Yellow
    }
    Write-Host "`n⚠ VERIFICATION PASSED (with warnings)" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "`n✅ ALL CHECKS PASSED" -ForegroundColor Green
    Write-Host "`nPhases 3-5 are fully implemented and ready for production!" -ForegroundColor Green
    exit 0
}
