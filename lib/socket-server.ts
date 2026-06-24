import { pusher } from "./pusher"

export async function emitNotification(userId: string, notification: any) {
  await pusher.trigger(`private-user-${userId}`, "notification", notification)
}

export async function emitToConversation(conversationId: string, event: string, data: any) {
  await pusher.trigger(`private-conversation-${conversationId}`, event, data)
}

export async function emitToUser(userId: string, event: string, data: any) {
  await pusher.trigger(`private-user-${userId}`, event, data)
}
