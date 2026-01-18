import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// This endpoint should be called by a cron job to publish scheduled posts
export async function POST(request: Request) {
  try {
    // Verify cron secret if needed
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()

    // Find all scheduled posts that should be published
    const scheduledPosts = await prisma.post.findMany({
      where: {
        scheduledFor: {
          lte: now, // Less than or equal to now
        },
        isDraft: false,
        deletedAt: null,
      },
    })

    // Update posts to remove scheduledFor (making them published)
    const published = await prisma.post.updateMany({
      where: {
        id: {
          in: scheduledPosts.map((p) => p.id),
        },
      },
      data: {
        scheduledFor: null,
        createdAt: {
          // Keep original scheduled time as createdAt
        },
      },
    })

    return NextResponse.json({
      published: published.count,
      posts: scheduledPosts.length,
    })
  } catch (error) {
    console.error("Publish scheduled posts error:", error)
    return NextResponse.json(
      { error: "Failed to publish scheduled posts" },
      { status: 500 }
    )
  }
}

// Also allow GET for manual triggering
export async function GET() {
  return POST(new Request("http://localhost", { method: "POST" }))
}

