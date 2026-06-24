#!/bin/bash

echo "🚀 Setting up AI Social Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Docker services
echo "📦 Starting Docker services (PostgreSQL & Redis)..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your configuration!"
    echo "   Generate NEXTAUTH_SECRET: openssl rand -base64 32"
fi

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

# Push database schema
echo "🗄️  Setting up database schema..."
npm run db:push

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys (optional for MVP)"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"

