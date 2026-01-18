# 🚀 Quick Setup Guide

## Prerequisites
- ✅ Node.js 18+ installed
- ✅ Docker Desktop installed and running
- ✅ Git (optional)

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Docker Services
```bash
# Start PostgreSQL and Redis
npm run docker:up

# Or manually:
docker-compose up -d
```

Wait a few seconds for services to start. Verify with:
```bash
docker ps
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database (already configured for Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_social?schema=public"

# NextAuth (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Redis (already configured for Docker)
REDIS_URL="redis://localhost:6379"
```

**Generate NEXTAUTH_SECRET:**
```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 4. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎉 You're Ready!

### Test the Platform:
1. **Sign Up**: Go to `/auth/signup` and create an account
2. **Create Posts**: Use the home feed to create your first post
3. **Like Posts**: Click the heart icon to like posts
4. **View Profiles**: Click on usernames to view profiles
5. **Add Comments**: Click on a post to view and add comments

## 🔧 Optional: Enable OAuth

To enable Google/GitHub login, add to `.env`:

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## 📸 Optional: Setup Cloudinary (Recommended)

For cloud storage of images and videos, add to `.env`:

**Option 1: Using Cloudinary URL (Easiest)**
```env
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
```

**Option 2: Using Individual Variables**
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Get your credentials:**
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier available)
2. Go to Dashboard to find your credentials or connection URL
3. See `CLOUDINARY_SETUP.md` for detailed instructions

**Benefits:**
- Automatic image optimization
- Automatic thumbnail generation
- Global CDN delivery
- Video thumbnail generation
- No local storage needed

## 🤖 Optional: Enable AI Features

To enable AI features, add to `.env`:

```env
OPENAI_API_KEY="your-openai-api-key"
```

Then you can:
- Generate posts with AI
- Moderate content automatically
- Use semantic search

## 🐛 Troubleshooting

### Database Connection Error
- Ensure Docker is running: `docker ps`
- Check if PostgreSQL container is up: `docker ps | grep postgres`
- Verify DATABASE_URL in `.env`

### Port Already in Use
- Change port: `npm run dev -- -p 3001`
- Or stop other services using port 3000

### Prisma Errors
- Run `npm run db:generate` again
- Check database connection
- Verify schema in `prisma/schema.prisma`

### Redis Connection Error
- Ensure Redis container is running: `docker ps | grep redis`
- Check REDIS_URL in `.env`

## 📚 Next Steps

- Read `README.md` for full documentation
- Check `PROJECT_STATUS.md` for feature roadmap
- Explore the codebase structure

## 🆘 Need Help?

- Check the README.md for detailed documentation
- Review PROJECT_STATUS.md for current features
- Check Docker logs: `docker-compose logs`

Happy coding! 🎊

