import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { pusher } from "@/lib/pusher"

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.text()
  const params = new URLSearchParams(data)
  const socketId = params.get("socket_id")!
  const channelName = params.get("channel_name")!

  // Only allow users to subscribe to their own channel or conversation channels
  const isOwnChannel = channelName === `private-user-${session.user.id}`
  const isConversationChannel = channelName.startsWith("private-conversation-")

  if (!isOwnChannel && !isConversationChannel) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const authResponse = pusher.authorizeChannel(socketId, channelName)
  return NextResponse.json(authResponse)
}
