import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyLike } from "@/lib/notifications"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id

    // Get post to find author
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ message: "Already liked" }, { status: 200 })
    }

    await prisma.like.create({
      data: {
        userId: session.user.id,
        postId,
      },
    })

    // Create notification
    await notifyLike(postId, session.user.id, post.authorId).catch(console.error)

    return NextResponse.json({ message: "Post liked" }, { status: 200 })
  } catch (error) {
    console.error("Like post error:", error)
    return NextResponse.json(
      { error: "Failed to like post" },
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

    const postId = params.id

    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        postId,
      },
    })

    return NextResponse.json({ message: "Post unliked" }, { status: 200 })
  } catch (error) {
    console.error("Unlike post error:", error)
    return NextResponse.json(
      { error: "Failed to unlike post" },
      { status: 500 }
    )
  }
}

