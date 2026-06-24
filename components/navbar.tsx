"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import {
  Home, Search, Bell, MessageCircle, User, Settings,
  LogOut, Users, Bookmark, FileText, Sparkles,
} from "lucide-react"
import { useWebSocketNotifications } from "@/lib/websocket"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/users", label: "Discover", icon: Users },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/drafts", label: "Drafts", icon: FileText },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session) {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((notifications) => {
          if (Array.isArray(notifications)) {
            setUnreadCount(notifications.filter((n: any) => !n.read).length)
          }
        })
        .catch(console.error)
    }
  }, [session])

  useWebSocketNotifications(() => {
    setUnreadCount((prev) => prev + 1)
  })

  if (!session) return null

  return (
    <header className="sticky top-0 z-50 w-full glass border-b">
      <div className="max-w-6xl mx-auto flex h-14 items-center px-4">

        {/* Logo */}
        <div className="flex w-44 shrink-0 items-center gap-2">
          <Link href="/home" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:opacity-90 transition-opacity">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base">AI Social</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="hidden flex-1 md:flex items-center justify-center gap-0.5">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const isActive = pathname === href || (href !== "/home" && pathname.startsWith(href))
            return (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "relative h-9 px-3 gap-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                  {badge && unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 gradient-primary text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <div className="flex w-44 shrink-0 items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/30 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user?.image || undefined} />
                  <AvatarFallback className="gradient-primary text-white text-xs font-bold">
                    {session.user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold text-sm">{session.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                </div>
              </DropdownMenuLabel>
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
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  )
}
