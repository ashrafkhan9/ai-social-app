"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { getPusherClient } from "./pusher-client"
import type { Channel } from "pusher-js"

export function useWebSocketNotifications(
  onNotification: (notification: any) => void
) {
  const { data: session } = useSession()
  const channelRef = useRef<Channel | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    const pusher = getPusherClient()
    const channelName = `private-user-${session.user.id}`
    const channel = pusher.subscribe(channelName)
    channelRef.current = channel

    channel.bind("notification", (notification: any) => {
      onNotification(notification)
    })

    return () => {
      channel.unbind("notification")
      pusher.unsubscribe(channelName)
      channelRef.current = null
    }
  }, [session?.user?.id, onNotification])
}

export function getConversationChannel(conversationId: string) {
  const pusher = getPusherClient()
  return pusher.subscribe(`private-conversation-${conversationId}`)
}

export function leaveConversationChannel(conversationId: string) {
  const pusher = getPusherClient()
  pusher.unsubscribe(`private-conversation-${conversationId}`)
}
