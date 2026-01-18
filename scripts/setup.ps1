# PowerShell setup script for Windows

Write-Host "🚀 Setting up AI Social Platform..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "📦 Starting Docker services (PostgreSQL & Redis)..." -ForegroundColor Yellow
docker-compose up -d

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please update .env with your configuration!" -ForegroundColor Yellow
    Write-Host "   Generate NEXTAUTH_SECRET: openssl rand -base64 32" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Yellow
npm run db:generate

# Push database schema
Write-Host "🗄️  Setting up database schema..." -ForegroundColor Yellow
npm run db:push

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env with your API keys (optional for MVP)"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "3. Open http://localhost:3000 in your browser"

