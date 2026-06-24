# 🧠 AI-Powered Social Media Platform

A next-generation social media platform powered by AI, built with Next.js 14, TypeScript, PostgreSQL, and modern web technologies.

## 🚀 Features

### Core Features
- ✅ Authentication (Email/Password, OAuth with Google & GitHub)
- ✅ User Profiles with Followers/Following
- ✅ Content Creation (Text, Images, Videos)
- ✅ Engagement System (Likes, Comments, Reactions, Shares, Bookmarks)
- ✅ Feed System (Following, For You, Trending) 
- ✅ Real-time Notifications
- ✅ Search & Discovery
- ✅ Messaging System
- ✅ AI Content Moderation
- ✅ AI Feed Ranking
- ✅ AI Content Generation

### AI Features
- 🤖 AI Post Generator
- 🖼️ AI Image Tools (Caption, Alt-text, Enhancement)
- 🎥 AI Video Intelligence
- 🧠 AI Semantic Search
- 🛡️ AI Content Moderation
- 💬 AI Comment Replies
- 🧑‍💼 AI Personal Assistant

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

## 🛠️ Setup Instructions

### 1. Clone and Install

```bash
# Install dependencies
npm install
```

### 2. Start Docker Services

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Or manually:
docker-compose up -d
```

### 3. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_social?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Redis
REDIS_URL="redis://localhost:6379"

# AI Services (Optional for MVP)
OPENAI_API_KEY=""
GEMINI_API_KEY=""
HUGGINGFACE_API_KEY=""

# File Upload (Required for image/video uploads)
# Get credentials from https://console.cloudinary.com/
# Option 1: Use Cloudinary URL (recommended)
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
# Option 2: Or use individual variables
# CLOUDINARY_CLOUD_NAME="your-cloud-name"
# CLOUDINARY_API_KEY="your-api-key"
# CLOUDINARY_API_SECRET="your-api-secret"

# Email (Optional)
RESEND_API_KEY=""
EMAIL_FROM="noreply@yourdomain.com"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or create migration
npm run db:migrate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── home/              # Home feed
│   └── ...
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   └── ...
├── lib/                   # Utilities & services
│   ├── ai/               # AI service integrations
│   ├── db.ts             # Prisma client
│   └── ...
├── prisma/               # Database schema
└── types/                # TypeScript types
```

## 🗄️ Database

The project uses PostgreSQL with pgvector extension for AI embeddings. All database models are defined in `prisma/schema.prisma`.

### Key Models:
- User, Account, Session
- Post, Comment, Like, Reaction, Share, Bookmark
- Follow, Block, Mute
- Message, Conversation
- Notification
- AIFlag, Embedding
- Subscription, Payment
- AnalyticsEvent

## 🔐 Authentication

The platform supports:
- Email/Password authentication
- OAuth (Google, GitHub)
- Session management
- Device tracking

## 🤖 AI Integration

AI features are modular and can be enabled by adding API keys:
- **OpenAI**: Text generation, embeddings, moderation
- **Gemini**: Multimodal AI
- **HuggingFace**: Free AI models

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:studio    # Open Prisma Studio
npm run docker:up    # Start Docker services
npm run docker:down  # Stop Docker services
```

## 🚧 Development Roadmap

### MVP ✅
- [x] Authentication
- [x] Posts
- [x] Feed
- [ ] AI Caption Generator
- [ ] AI Moderation

### V1
- [ ] Messaging
- [ ] AI Feed Ranking
- [ ] Smart Replies

### V2
- [ ] Monetization
- [ ] Analytics
- [ ] Admin Panel

## 🤝 Contributing

This is a full-featured platform. Feel free to extend and customize!

## 📄 License

MIT

## 🆘 Troubleshooting

### Database Connection Issues
- Ensure Docker containers are running: `docker ps`
- Check DATABASE_URL in `.env`
- Verify PostgreSQL is accessible: `docker exec -it ai-social-postgres psql -U postgres`

### Redis Connection Issues
- Check REDIS_URL in `.env`
- Verify Redis is running: `docker exec -it ai-social-redis redis-cli ping`

### Prisma Issues
- Run `npm run db:generate` after schema changes
- Use `npm run db:push` for development
- Use `npm run db:migrate` for production

