import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
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

    // Don't count own views
    if (story.authorId === session.user.id) {
      return NextResponse.json({ success: true, viewed: true })
    }

    // Check if already viewed
    const existingView = await prisma.storyView.findUnique({
      where: {
        storyId_viewerId: {
          storyId: params.id,
          viewerId: session.user.id,
        },
      },
    })

    if (existingView) {
      return NextResponse.json({ success: true, viewed: true })
    }

    // Create view
    await prisma.storyView.create({
      data: {
        storyId: params.id,
        viewerId: session.user.id,
      },
    })

    return NextResponse.json({ success: true, viewed: true })
  } catch (error) {
    console.error("View story error:", error)
    return NextResponse.json(
      { error: "Failed to mark story as viewed" },
      { status: 500 }
    )
  }
}

