"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import Link from "next/link"
import { useWebSocketNotifications } from "@/lib/websocket"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: Date
}

export default function NotificationsPage() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications")
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchNotifications()
    }
  }, [session])

  // Real-time notifications (polling for now)
  useWebSocketNotifications((notification) => {
    setNotifications((prev) => [notification, ...prev])
    setUnreadCount((prev) => prev + 1)
    toast.info(notification.title, {
      description: notification.body,
    })
  })

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds, read: true }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            notificationIds.includes(n.id) ? { ...n, read: true } : n
          )
        )
        setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
      }
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds)
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Link
                key={notification.id}
                href={notification.link || "#"}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead([notification.id])
                  }
                }}
              >
                <Card
                  className={`hover:bg-accent transition-colors cursor-pointer ${
                    !notification.read ? "border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.body}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


