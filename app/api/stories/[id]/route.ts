import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const story = await prisma.story.findUnique({
      where: { id: params.id },
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
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    // Check if story has expired
    if (story.expiresAt < new Date()) {
      return NextResponse.json({ error: "Story has expired" }, { status: 410 })
    }

    // Mark as viewed if not already viewed
    if (story.views.length === 0 && story.authorId !== session.user.id) {
      await prisma.storyView.create({
        data: {
          storyId: story.id,
          viewerId: session.user.id,
        },
      })
    }

    return NextResponse.json({
      ...story,
      viewed: story.views.length > 0 || story.authorId === session.user.id,
      viewCount: story._count.views,
    })
  } catch (error) {
    console.error("Get story error:", error)
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const story = await prisma.story.findUnique({
      where: { id: params.id },
    })

    if (!story) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 })
    }

    if (story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this story" },
        { status: 403 }
      )
    }

    await prisma.story.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete story error:", error)
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    )
  }
}

