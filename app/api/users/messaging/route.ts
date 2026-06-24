import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all users except the current user for messaging
    const users = await prisma.user.findMany({
      where: {
        id: {
          not: session.user.id,
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
        createdAt: "desc",
      },
      take: 50, // Limit to 50 users for performance
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Get users for messaging error:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

