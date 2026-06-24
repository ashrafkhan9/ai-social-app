import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { pusher } from "@/lib/pusher"

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { conversationId, isTyping } = await request.json()

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 })
  }

  await pusher.trigger(`private-conversation-${conversationId}`, "user-typing", {
    userId: session.user.id,
    isTyping,
  })

  return NextResponse.json({ success: true })
}
