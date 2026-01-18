import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all conversations for the user
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                isVerified: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Format conversations
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== session.user.id
      )
      const lastMessage = conv.messages[0]

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name || otherParticipant?.user.name || "Unknown",
        otherParticipant: otherParticipant?.user,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              read: lastMessage.read,
            }
          : null,
        unreadCount: 0, // Will calculate separately
        updatedAt: conv.updatedAt,
      }
    })

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error("Get conversations error:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, type = "DIRECT" } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    if (type === "DIRECT") {
      const existing = await prisma.conversation.findFirst({
        where: {
          type: "DIRECT",
          participants: {
            every: {
              userId: {
                in: [session.user.id, userId],
              },
            },
          },
        },
        include: {
          participants: true,
        },
      })

      if (existing && existing.participants.length === 2) {
        return NextResponse.json(existing)
      }
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        type: type as "DIRECT" | "GROUP",
        participants: {
          create: [
            { userId: session.user.id },
            { userId: userId },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                isVerified: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error("Create conversation error:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}

