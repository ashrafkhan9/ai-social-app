import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createStorySchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(["image", "video"]),
  text: z.string().optional(),
  textColor: z.string().optional(),
  textPosition: z.enum(["top", "center", "bottom"]).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Get stories for a specific user or all followed users
    const where: any = {
      expiresAt: {
        gt: new Date(), // Only active stories
      },
    }

    if (userId) {
      where.authorId = userId
    } else {
      // Get stories from users the current user follows
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      })

      const followingIds = following.map((f) => f.followingId)
      followingIds.push(session.user.id) // Include own stories

      // Only add the filter if we have IDs
      if (followingIds.length > 0) {
        where.authorId = {
          in: followingIds,
        }
      } else {
        // If no following users, only show own stories
        where.authorId = session.user.id
      }
    }

    const stories = await prisma.story.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            isVerified: true,
          },
        },
        views: {
          where: {
            viewerId: session.user.id,
          },
        },
        _count: {
          select: {
            views: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Group stories by author
    const groupedStories = stories.reduce((acc, story) => {
      const authorId = story.authorId
      if (!acc[authorId]) {
        acc[authorId] = {
          author: story.author,
          stories: [],
        }
      }
      acc[authorId].stories.push({
        ...story,
        viewed: story.views.length > 0,
        viewCount: story._count.views,
      })
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(Object.values(groupedStories))
  } catch (error: any) {
    console.error("Get stories error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stories", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { mediaUrl, mediaType, text, textColor, textPosition } =
      createStorySchema.parse(body)

    // Create story with 24-hour expiration
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const story = await prisma.story.create({
      data: {
        authorId: session.user.id,
        mediaUrl,
        mediaType,
        text: text || null,
        textColor: textColor || null,
        textPosition: textPosition || null,
        expiresAt,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            isVerified: true,
          },
        },
      },
    })

    return NextResponse.json(story, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create story error:", error)
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    )
  }
}

