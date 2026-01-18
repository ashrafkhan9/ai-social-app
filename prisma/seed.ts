import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("🧹 Cleaning existing data...")
  await prisma.notification.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationParticipant.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.bookmark.deleteMany()
  await prisma.share.deleteMany()
  await prisma.reaction.deleteMany()
  await prisma.like.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.media.deleteMany()
  await prisma.postHashtag.deleteMany()
  await prisma.hashtag.deleteMany()
  await prisma.post.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.user.deleteMany()

  const hashedPassword = await bcrypt.hash("password123", 10)

  // Create sample users
  console.log("👥 Creating users...")
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice@example.com",
        username: "alice",
        name: "Alice Johnson",
        password: hashedPassword,
        bio: "Tech enthusiast and AI researcher 🚀",
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        username: "bob",
        name: "Bob Smith",
        password: hashedPassword,
        bio: "Photographer 📸 | Traveler 🌍",
        isVerified: false,
      },
    }),
    prisma.user.create({
      data: {
        email: "charlie@example.com",
        username: "charlie",
        name: "Charlie Brown",
        password: hashedPassword,
        bio: "Developer 💻 | Open source contributor",
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: "diana@example.com",
        username: "diana",
        name: "Diana Prince",
        password: hashedPassword,
        bio: "Content creator 🎨 | Designer",
        isVerified: false,
      },
    }),
    prisma.user.create({
      data: {
        email: "eve@example.com",
        username: "eve",
        name: "Eve Williams",
        password: hashedPassword,
        bio: "Entrepreneur 💼 | Startup founder",
        isVerified: true,
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create follows
  console.log("👫 Creating follows...")
  await Promise.all([
    prisma.follow.create({
      data: {
        followerId: users[0].id, // Alice follows Bob
        followingId: users[1].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: users[0].id, // Alice follows Charlie
        followingId: users[2].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: users[1].id, // Bob follows Alice
        followingId: users[0].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: users[2].id, // Charlie follows Alice
        followingId: users[0].id,
      },
    }),
    prisma.follow.create({
      data: {
        followerId: users[3].id, // Diana follows Eve
        followingId: users[4].id,
      },
    }),
  ])
  console.log("✅ Created follows")

  // Create hashtags
  console.log("🏷️  Creating hashtags...")
  const hashtags = await Promise.all([
    prisma.hashtag.create({ data: { name: "tech" } }),
    prisma.hashtag.create({ data: { name: "ai" } }),
    prisma.hashtag.create({ data: { name: "photography" } }),
    prisma.hashtag.create({ data: { name: "travel" } }),
    prisma.hashtag.create({ data: { name: "design" } }),
  ])
  console.log("✅ Created hashtags")

  // Create posts
  console.log("📝 Creating posts...")
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: "Just launched my new AI project! 🚀 Excited to share what I've been working on. #tech #ai",
        authorId: users[0].id,
        hashtags: {
          create: [
            { hashtagId: hashtags[0].id },
            { hashtagId: hashtags[1].id },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        content: "Beautiful sunset from my latest trip! 🌅 #photography #travel",
        authorId: users[1].id,
        hashtags: {
          create: [
            { hashtagId: hashtags[2].id },
            { hashtagId: hashtags[3].id },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        content: "Working on some exciting new features for the platform. Can't wait to show you all! 💻",
        authorId: users[2].id,
        hashtags: {
          create: [{ hashtagId: hashtags[0].id }],
        },
      },
    }),
    prisma.post.create({
      data: {
        content: "New design system is live! Check it out 🎨 #design",
        authorId: users[3].id,
        hashtags: {
          create: [{ hashtagId: hashtags[4].id }],
        },
      },
    }),
    prisma.post.create({
      data: {
        content: "Starting a new venture! Looking for co-founders and early adopters. DM me if interested! 💼",
        authorId: users[4].id,
      },
    }),
    prisma.post.create({
      data: {
        content: "AI is changing everything. What do you think the future holds? #ai #tech",
        authorId: users[0].id,
        hashtags: {
          create: [
            { hashtagId: hashtags[1].id },
            { hashtagId: hashtags[0].id },
          ],
        },
      },
    }),
  ])
  console.log(`✅ Created ${posts.length} posts`)

  // Create likes
  console.log("❤️  Creating likes...")
  await Promise.all([
    prisma.like.create({
      data: { userId: users[1].id, postId: posts[0].id },
    }),
    prisma.like.create({
      data: { userId: users[2].id, postId: posts[0].id },
    }),
    prisma.like.create({
      data: { userId: users[0].id, postId: posts[1].id },
    }),
    prisma.like.create({
      data: { userId: users[3].id, postId: posts[2].id },
    }),
    prisma.like.create({
      data: { userId: users[4].id, postId: posts[2].id },
    }),
  ])
  console.log("✅ Created likes")

  // Create comments
  console.log("💬 Creating comments...")
  await Promise.all([
    prisma.comment.create({
      data: {
        content: "This looks amazing! Can't wait to see more.",
        authorId: users[1].id,
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "Great work! 🎉",
        authorId: users[2].id,
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: "Stunning photo! 📸",
        authorId: users[0].id,
        postId: posts[1].id,
      },
    }),
  ])
  console.log("✅ Created comments")

  // Update hashtag post counts
  console.log("📊 Updating hashtag counts...")
  for (const hashtag of hashtags) {
    const count = await prisma.postHashtag.count({
      where: { hashtagId: hashtag.id },
    })
    await prisma.hashtag.update({
      where: { id: hashtag.id },
      data: { postCount: count },
    })
  }
  console.log("✅ Updated hashtag counts")

  console.log("🎉 Seed completed successfully!")
  console.log("\n📋 Test Accounts:")
  console.log("Email: alice@example.com | Password: password123")
  console.log("Email: bob@example.com | Password: password123")
  console.log("Email: charlie@example.com | Password: password123")
  console.log("Email: diana@example.com | Password: password123")
  console.log("Email: eve@example.com | Password: password123")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

