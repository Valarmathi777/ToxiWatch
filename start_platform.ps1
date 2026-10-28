# ==============================================================
# HATE & TOXICITY SENTINEL PLATFORM - WINDOWS LAUNCH SCRIPT
# ==============================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Hate & Toxicity Sentinel Platform             " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Dataset
$DatasetPath = "Context_Aware_Hate_Toxicity_Dataset_10000plus.xlsx"
if (-Not (Test-Path $DatasetPath)) {
    Write-Host "[!] Warning: Dataset $DatasetPath not found in folder." -ForegroundColor Yellow
} else {
    Write-Host "[+] Found dataset: $DatasetPath" -ForegroundColor Green
}

# 2. Check Models
$ModelPath = "backend\models\model_context_aware.joblib"
if (-Not (Test-Path $ModelPath)) {
    Write-Host "[*] Training initial models (A, B, C, D)..." -ForegroundColor Cyan
    python -m backend.app.ml.trainer
} else {
    Write-Host "[+] ML Model artifacts verified in backend\models" -ForegroundColor Green
}

# 3. Run Backend Server in Background Job / New Window
Write-Host "[*] Launching Backend FastAPI Service on http://localhost:8000..." -ForegroundColor Cyan
$BackendProcess = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000" -PassThru

# 4. Launch Frontend Dev Server
Write-Host "[*] Launching Frontend React App on http://localhost:5173..." -ForegroundColor Cyan
Set-Location frontend
npm run dev -- --host

# Cleanup on exit
Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
