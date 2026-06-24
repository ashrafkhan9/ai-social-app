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

    const commentId = params.id

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json({ message: "Already liked" }, { status: 200 })
    }

    await prisma.like.create({
      data: {
        userId: session.user.id,
        commentId,
      },
    })

    return NextResponse.json({ message: "Comment liked" }, { status: 200 })
  } catch (error) {
    console.error("Like comment error:", error)
    return NextResponse.json(
      { error: "Failed to like comment" },
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

    const commentId = params.id

    await prisma.like.deleteMany({
      where: {
        userId: session.user.id,
        commentId,
      },
    })

    return NextResponse.json({ message: "Comment unliked" }, { status: 200 })
  } catch (error) {
    console.error("Unlike comment error:", error)
    return NextResponse.json(
      { error: "Failed to unlike comment" },
      { status: 500 }
    )
  }
}

