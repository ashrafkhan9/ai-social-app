// Socket.io client for real-time notifications
"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export function useWebSocketNotifications(
  onNotification: (notification: any) => void
) {
  const { data: session } = useSession()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Initialize Socket.io connection
    const initializeSocket = () => {
      if (socketRef.current?.connected) return

      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      newSocket.on("connect", () => {
        console.log("Socket.io connected")
        // Authenticate with user ID
        newSocket.emit("authenticate", {
          userId: session.user.id,
          token: session.accessToken, // If you have tokens
        })
      })

      newSocket.on("authenticated", (data: { success: boolean }) => {
        if (data.success) {
          console.log("Socket.io authenticated")
        }
      })

      newSocket.on("notification", (notification: any) => {
        onNotification(notification)
      })

      newSocket.on("disconnect", () => {
        console.log("Socket.io disconnected")
      })

      newSocket.on("connect_error", (error) => {
        console.error("Socket.io connection error:", error)
        // Fallback to polling if WebSocket fails
        fallbackToPolling(onNotification, session.user.id)
      })

      socketRef.current = newSocket
      socket = newSocket
    }

    initializeSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        socket = null
      }
    }
  }, [session, onNotification])

  return socketRef.current
}

// Fallback to polling if WebSocket fails
function fallbackToPolling(
  onNotification: (notification: any) => void,
  userId: string
) {
  const pollNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?limit=1")
      if (response.ok) {
        const notifications = await response.json()
        if (notifications.length > 0) {
          const latest = notifications[0]
          onNotification(latest)
        }
      }
    } catch (error) {
      console.error("Error polling notifications:", error)
    }
  }

  // Poll every 5 seconds as fallback
  const interval = setInterval(pollNotifications, 5000)

  // Clean up after 30 seconds (give WebSocket time to reconnect)
  setTimeout(() => {
    clearInterval(interval)
  }, 30000)
}

// Export socket for use in other components
export function getSocket() {
  return socket
}

