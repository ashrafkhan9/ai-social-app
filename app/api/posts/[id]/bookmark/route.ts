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

    const postId = params.id

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: postId,
        },
      },
    })

    if (existingBookmark) {
      return NextResponse.json({ message: "Already bookmarked" }, { status: 200 })
    }

    // Create bookmark
    await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        postId: postId,
      },
    })

    return NextResponse.json({ message: "Post bookmarked" }, { status: 200 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Already bookmarked" }, { status: 200 })
    }
    console.error("Bookmark post error:", error)
    return NextResponse.json(
      { error: "Failed to bookmark post" },
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

    await prisma.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        postId: postId,
      },
    })

    return NextResponse.json({ message: "Bookmark removed" }, { status: 200 })
  } catch (error) {
    console.error("Unbookmark post error:", error)
    return NextResponse.json(
      { error: "Failed to remove bookmark" },
      { status: 500 }
    )
  }
}

