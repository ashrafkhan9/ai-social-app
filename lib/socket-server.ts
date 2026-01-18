/**
 * Socket.io server utilities
 * Use this to emit events from API routes
 */

export function emitNotification(userId: string, notification: any) {
  if (typeof global !== "undefined" && typeof global.io !== "undefined") {
    // Emit to user's room (joined in server.js)
    global.io.to(userId).emit("notification", notification)
  }
}

export function emitToConversation(conversationId: string, event: string, data: any) {
  if (typeof global.io !== "undefined") {
    global.io.to(`conversation:${conversationId}`).emit(event, data)
  }
}

export function emitToUser(userId: string, event: string, data: any) {
  if (typeof global.io !== "undefined") {
    global.io.to(userId).emit(event, data)
  }
}

