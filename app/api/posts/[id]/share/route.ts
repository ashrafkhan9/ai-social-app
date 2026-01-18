import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyShare } from "@/lib/notifications"

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

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if already shared
    const existingShare = await prisma.share.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingShare) {
      return NextResponse.json({ message: "Already shared" }, { status: 200 })
    }

    // Create share
    await prisma.share.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    })

    // Create notification (don't notify if sharing own post)
    if (post.authorId !== session.user.id) {
      await notifyShare(postId, session.user.id, post.authorId).catch(
        console.error
      )
    }

    return NextResponse.json({ message: "Post shared" }, { status: 200 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Already shared" }, { status: 200 })
    }
    console.error("Share post error:", error)
    return NextResponse.json(
      { error: "Failed to share post" },
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

    await prisma.share.deleteMany({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    })

    return NextResponse.json({ message: "Share removed" }, { status: 200 })
  } catch (error) {
    console.error("Unshare post error:", error)
    return NextResponse.json(
      { error: "Failed to remove share" },
      { status: 500 }
    )
  }
}

