import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users that the current user is NOT following
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })

    const followingIds = following.map((f) => f.followingId)
    followingIds.push(session.user.id) // Exclude self

    // Get suggested users (users with most followers, excluding already followed)
    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: followingIds,
        },
      },
      include: {
        _count: {
          select: {
            followers: true,
            posts: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: "desc",
        },
      },
      take: 10,
    })

    return NextResponse.json(suggestedUsers)
  } catch (error) {
    console.error("Suggested users error:", error)
    return NextResponse.json(
      { error: "Failed to fetch suggested users" },
      { status: 500 }
    )
  }
}

