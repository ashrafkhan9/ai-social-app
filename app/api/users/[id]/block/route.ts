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

    const userId = params.id

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      )
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: session.user.id,
          blockedId: userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Already blocked" }, { status: 200 })
    }

    // Remove follow relationships if any
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: session.user.id, followingId: userId },
          { followerId: userId, followingId: session.user.id },
        ],
      },
    })

    // Create block
    await prisma.block.create({
      data: {
        blockerId: session.user.id,
        blockedId: userId,
      },
    })

    return NextResponse.json({ message: "User blocked" }, { status: 200 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Already blocked" }, { status: 200 })
    }
    console.error("Block user error:", error)
    return NextResponse.json(
      { error: "Failed to block user" },
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

    const userId = params.id

    await prisma.block.deleteMany({
      where: {
        blockerId: session.user.id,
        blockedId: userId,
      },
    })

    return NextResponse.json({ message: "User unblocked" }, { status: 200 })
  } catch (error) {
    console.error("Unblock user error:", error)
    return NextResponse.json(
      { error: "Failed to unblock user" },
      { status: 500 }
    )
  }
}

