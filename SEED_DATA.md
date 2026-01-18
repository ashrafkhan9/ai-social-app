# 🌱 Seed Data Guide

## Overview

The seed script populates your database with sample data for testing and development. This includes:
- 5 sample users
- Sample posts with hashtags
- Follow relationships
- Likes and comments
- Hashtags

## 🚀 Running the Seed Script

### Prerequisites
1. Docker services must be running
2. Database must be set up (`npm run db:push`)

### Run Seed

```bash
npm run db:seed
```

Or manually:
```bash
npx tsx prisma/seed.ts
```

## 👥 Test Accounts Created

All accounts use the password: `password123`

| Email | Username | Name | Verified |
|-------|----------|------|----------|
| alice@example.com | alice | Alice Johnson | ✅ Yes |
| bob@example.com | bob | Bob Smith | ❌ No |
| charlie@example.com | charlie | Charlie Brown | ✅ Yes |
| diana@example.com | diana | Diana Prince | ❌ No |
| eve@example.com | eve | Eve Williams | ✅ Yes |

## 📊 What Gets Created

### Users (5)
- Alice, Bob, Charlie, Diana, Eve
- Different account types and verification statuses

### Follows (5)
- Alice follows Bob and Charlie
- Bob follows Alice
- Charlie follows Alice
- Diana follows Eve

### Posts (6)
- Posts with various content
- Some with hashtags
- Different authors

### Hashtags (5)
- #tech
- #ai
- #photography
- #travel
- #design

### Likes (5)
- Various users liking different posts

### Comments (3)
- Sample comments on posts

## 🔄 Resetting Seed Data

The seed script **clears all existing data** before seeding. This ensures a clean state.

To keep existing data, comment out the cleanup section in `prisma/seed.ts`:

```typescript
// Comment out these lines to keep existing data:
// await prisma.notification.deleteMany()
// await prisma.user.deleteMany()
// ... etc
```

## 🧪 Testing with Seed Data

1. **Run the seed:**
   ```bash
   npm run db:seed
   ```

2. **Sign in with any test account:**
   - Email: `alice@example.com`
   - Password: `password123`

3. **Test features:**
   - View posts in feed
   - Follow other users
   - Like and comment
   - Search for users/posts
   - Check notifications

## 📝 Customizing Seed Data

Edit `prisma/seed.ts` to:
- Add more users
- Create more posts
- Add different relationships
- Customize content

## ⚠️ Important Notes

- **Seed script clears all data** - Don't run in production!
- **Password is "password123"** for all test accounts
- **Seed data is for development only**
- Run `npm run db:seed` anytime to reset to clean state

## 🎯 Quick Start

```bash
# 1. Start Docker
npm run docker:up

# 2. Setup database
npm run db:push

# 3. Seed data
npm run db:seed

# 4. Start dev server
npm run dev

# 5. Sign in with:
# Email: alice@example.com
# Password: password123
```

Enjoy testing! 🎉

