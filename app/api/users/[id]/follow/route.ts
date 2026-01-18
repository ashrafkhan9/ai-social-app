import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { notifyFollow } from "@/lib/notifications"

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
        { error: "Cannot follow yourself" },
        { status: 400 }
      )
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json({ message: "Already following" }, { status: 200 })
    }

    await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId: userId,
      },
    })

    // Create notification
    await notifyFollow(session.user.id, userId).catch(console.error)

    return NextResponse.json({ message: "User followed" }, { status: 200 })
  } catch (error) {
    console.error("Follow user error:", error)
    return NextResponse.json(
      { error: "Failed to follow user" },
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

    await prisma.follow.deleteMany({
      where: {
        followerId: session.user.id,
        followingId: userId,
      },
    })

    return NextResponse.json({ message: "User unfollowed" }, { status: 200 })
  } catch (error) {
    console.error("Unfollow user error:", error)
    return NextResponse.json(
      { error: "Failed to unfollow user" },
      { status: 500 }
    )
  }
}

