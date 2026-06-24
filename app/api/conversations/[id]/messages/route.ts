import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { notifyMessage } from "@/lib/notifications"
import { emitToConversation } from "@/lib/socket-server"

const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId: conversationId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      )
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId,
        deletedAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            isVerified: true,
          },
        },
        media: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: session.user.id },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    // Update last read time
    await prisma.conversationParticipant.update({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId: conversationId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversationId = params.id

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        userId_conversationId: {
          userId: session.user.id,
          conversationId: conversationId,
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content } = createMessageSchema.parse(body)

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        conversationId: conversationId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            isVerified: true,
          },
        },
        media: true,
      },
    })

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Get other participants to notify
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: {
            userId: { not: session.user.id },
          },
        },
      },
    })

    // Push new message to conversation channel in real-time
    await emitToConversation(conversationId, "new-message", message).catch(console.error)

    // Send notifications to all other participants
    if (conversation) {
      for (const participant of conversation.participants) {
        await notifyMessage(
          conversationId,
          session.user.id,
          participant.userId,
          content
        ).catch(console.error)
      }
    }

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create message error:", error)
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    )
  }
}

