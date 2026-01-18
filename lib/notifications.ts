import { prisma } from "@/lib/db"
import { emitNotification } from "@/lib/socket-server"
import { sendNotificationEmail } from "@/lib/email"

export async function createNotification(data: {
  userId: string
  type: "LIKE" | "COMMENT" | "REPLY" | "FOLLOW" | "MENTION" | "SHARE" | "MESSAGE" | "AI_WARNING" | "SYSTEM"
  title: string
  body: string
  link?: string
}) {
  try {
    const notification = await prisma.notification.create({
      data,
    })

    // Emit WebSocket event for real-time notification
    try {
      emitNotification(data.userId, notification)
    } catch (socketError) {
      // Continue even if Socket.io fails (fallback to polling)
      console.warn("Failed to emit notification via Socket.io:", socketError)
    }

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Helper functions for common notification types
export async function notifyLike(postId: string, likerId: string, postAuthorId: string) {
  if (likerId === postAuthorId) return // Don't notify for own likes

  const liker = await prisma.user.findUnique({
    where: { id: likerId },
    select: { name: true, username: true },
  })

  const postAuthor = await prisma.user.findUnique({
    where: { id: postAuthorId },
    select: { email: true, name: true },
  })

  const notification = await createNotification({
    userId: postAuthorId,
    type: "LIKE",
    title: "New Like",
    body: `${liker?.name || liker?.username || "Someone"} liked your post`,
    link: `/posts/${postId}`,
  })

  // Send email notification (optional, can be configured per user)
  if (postAuthor?.email) {
    sendNotificationEmail(
      postAuthor.email,
      "New Like on Your Post",
      `${liker?.name || liker?.username || "Someone"} liked your post`,
      `${process.env.NEXTAUTH_URL}/posts/${postId}`,
      "View Post"
    ).catch(console.error)
  }

  return notification
}

export async function notifyComment(postId: string, commenterId: string, postAuthorId: string) {
  if (commenterId === postAuthorId) return

  const commenter = await prisma.user.findUnique({
    where: { id: commenterId },
    select: { name: true, username: true },
  })

  const postAuthor = await prisma.user.findUnique({
    where: { id: postAuthorId },
    select: { email: true, name: true },
  })

  const notification = await createNotification({
    userId: postAuthorId,
    type: "COMMENT",
    title: "New Comment",
    body: `${commenter?.name || commenter?.username || "Someone"} commented on your post`,
    link: `/posts/${postId}`,
  })

  // Send email notification
  if (postAuthor?.email) {
    sendNotificationEmail(
      postAuthor.email,
      "New Comment on Your Post",
      `${commenter?.name || commenter?.username || "Someone"} commented on your post`,
      `${process.env.NEXTAUTH_URL}/posts/${postId}`,
      "View Comment"
    ).catch(console.error)
  }

  return notification
}

export async function notifyFollow(followerId: string, followingId: string) {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { name: true, username: true },
  })

  const following = await prisma.user.findUnique({
    where: { id: followingId },
    select: { email: true, name: true },
  })

  const notification = await createNotification({
    userId: followingId,
    type: "FOLLOW",
    title: "New Follower",
    body: `${follower?.name || follower?.username || "Someone"} started following you`,
    link: `/profile/${follower?.username}`,
  })

  // Send email notification for new followers
  if (following?.email) {
    sendNotificationEmail(
      following.email,
      "New Follower",
      `${follower?.name || follower?.username || "Someone"} started following you`,
      `${process.env.NEXTAUTH_URL}/profile/${follower?.username}`,
      "View Profile"
    ).catch(console.error)
  }

  return notification
}

export async function notifyShare(
  postId: string,
  sharerId: string,
  postAuthorId: string
) {
  const sharer = await prisma.user.findUnique({
    where: { id: sharerId },
    select: { name: true, username: true },
  })

  return createNotification({
    userId: postAuthorId,
    type: "SHARE",
    title: "Post Shared",
    body: `${sharer?.name || sharer?.username || "Someone"} shared your post`,
    link: `/posts/${postId}`,
  })
}

export async function notifyMention(
  postId: string | null,
  commentId: string | null,
  mentionerId: string,
  mentionedUserId: string
) {
  if (mentionerId === mentionedUserId) return // Don't notify for self-mentions

  const mentioner = await prisma.user.findUnique({
    where: { id: mentionerId },
    select: { name: true, username: true },
  })

  const link = postId ? `/posts/${postId}` : commentId ? `/posts/${postId}` : null

  return createNotification({
    userId: mentionedUserId,
    type: "MENTION",
    title: "You were mentioned",
    body: `${mentioner?.name || mentioner?.username || "Someone"} mentioned you`,
    link: link || undefined,
  })
}

export async function notifyMessage(
  conversationId: string,
  senderId: string,
  recipientId: string,
  messageContent: string
) {
  if (senderId === recipientId) return // Don't notify for own messages

  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true, username: true },
  })

  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { email: true, name: true },
  })

  // Truncate message content for notification
  const truncatedContent = messageContent.length > 50 
    ? messageContent.substring(0, 50) + "..." 
    : messageContent

  const notification = await createNotification({
    userId: recipientId,
    type: "MESSAGE",
    title: "New Message",
    body: `${sender?.name || sender?.username || "Someone"}: ${truncatedContent}`,
    link: `/messages?conversation=${conversationId}`,
  })

  // Send email notification
  if (recipient?.email) {
    sendNotificationEmail(
      recipient.email,
      `New message from ${sender?.name || sender?.username || "Someone"}`,
      truncatedContent,
      `${process.env.NEXTAUTH_URL}/messages?conversation=${conversationId}`,
      "View Message"
    ).catch(console.error)
  }

  return notification
}

