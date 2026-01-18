"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Home, Search, Bell, MessageCircle, User, Settings, LogOut, Users, Bookmark, FileText } from "lucide-react"
import { useWebSocketNotifications } from "@/lib/websocket"

export function Navbar() {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread notification count
  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((notifications) => {
          setUnreadCount(notifications.filter((n: any) => !n.read).length)
        })
        .catch(console.error)
    }
  }, [session])

  // Real-time notifications
  useWebSocketNotifications(() => {
    setUnreadCount((prev) => prev + 1)
  })

  if (!session) return null

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/home" className="text-xl font-bold">
            AI Social
          </Link>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/home">
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </Link>
            <Link href="/users">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Discover
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/bookmarks">
              <Button variant="ghost" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Bookmarks
              </Button>
            </Link>
            <Link href="/drafts">
              <Button variant="ghost" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Drafts
              </Button>
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarImage src={session.user?.image || undefined} />
                  <AvatarFallback>
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${session.user?.email?.split("@")[0]}`}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}

