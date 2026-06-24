# PowerShell script to verify AI API key configuration

Write-Host "`n🔍 Checking AI Service Configuration...`n" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "   Please create a .env file in the project root." -ForegroundColor Yellow
    exit 1
}

# Read .env file
$envLines = Get-Content .env

# Check for API keys (simple pattern matching)
$hasOpenAI = $false
$hasGemini = $false
$hasHuggingFace = $false

foreach ($line in $envLines) {
    if ($line -match '^OPENAI_API_KEY\s*=') {
        $hasOpenAI = $true
    }
    if ($line -match '^GEMINI_API_KEY\s*=') {
        $hasGemini = $true
    }
    if ($line -match '^HUGGINGFACE_API_KEY\s*=') {
        $hasHuggingFace = $true
    }
}

Write-Host "AI Service Status:" -ForegroundColor Yellow
if ($hasOpenAI) {
    Write-Host "  OpenAI:     ✓ Configured" -ForegroundColor Green
} else {
    Write-Host "  OpenAI:     ✗ Not configured" -ForegroundColor Red
}
if ($hasGemini) {
    Write-Host "  Gemini:     ✓ Configured" -ForegroundColor Green
} else {
    Write-Host "  Gemini:     ✗ Not configured" -ForegroundColor Red
}
if ($hasHuggingFace) {
    Write-Host "  HuggingFace: ✓ Configured" -ForegroundColor Green
} else {
    Write-Host "  HuggingFace: ✗ Not configured" -ForegroundColor Red
}

if (-not ($hasOpenAI -or $hasGemini -or $hasHuggingFace)) {
    Write-Host "`n⚠️  No AI services are configured!" -ForegroundColor Yellow
    Write-Host "`n📝 Quick Setup (Free Gemini API Key):" -ForegroundColor Cyan
    Write-Host "   1. Visit: https://makersuite.google.com/app/apikey" -ForegroundColor White
    Write-Host "   2. Sign in with Google" -ForegroundColor White
    Write-Host "   3. Click 'Create API Key'" -ForegroundColor White
    Write-Host "   4. Copy the key" -ForegroundColor White
    Write-Host "   5. Add this line to your .env file:" -ForegroundColor White
    Write-Host "      GEMINI_API_KEY=`"your-api-key-here`"" -ForegroundColor Green
    Write-Host "   6. Restart your dev server: npm run dev" -ForegroundColor White
    Write-Host "`n   See FREE_AI_KEYS_GUIDE.md for detailed instructions.`n" -ForegroundColor Gray
} else {
    Write-Host "`n✅ At least one AI service is configured!" -ForegroundColor Green
    Write-Host "   Make sure to restart your dev server if you just added a key.`n" -ForegroundColor Yellow
}
