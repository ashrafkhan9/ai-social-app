import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const createHighlightSchema = z.object({
  storyId: z.string(),
  title: z.string().min(1).max(50),
  coverImage: z.string().url().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || session.user.id

    // Get highlights for a user
    const highlights = await prisma.storyHighlight.findMany({
      where: {
        userId,
      },
      include: {
        story: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Group highlights by title
    const grouped = highlights.reduce((acc, highlight) => {
      const title = highlight.title
      if (!acc[title]) {
        acc[title] = {
          id: highlight.id,
          title,
          coverImage: highlight.coverImage || highlight.story.mediaUrl,
          userId: highlight.userId,
          stories: [],
        }
      }
      acc[title].stories.push(highlight.story)
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(Object.values(grouped))
  } catch (error) {
    console.error("Get highlights error:", error)
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
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
    const { storyId, title, coverImage } = createHighlightSchema.parse(body)

    // Verify story belongs to user
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    if (story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to add this story to highlights" },
        { status: 403 }
      )
    }

    const highlight = await prisma.storyHighlight.create({
      data: {
        userId: session.user.id,
        storyId,
        title,
        coverImage: coverImage || story.mediaUrl,
      },
      include: {
        story: {
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
        },
      },
    })

    return NextResponse.json(highlight, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create highlight error:", error)
    return NextResponse.json(
      { error: "Failed to create highlight" },
      { status: 500 }
    )
  }
}

