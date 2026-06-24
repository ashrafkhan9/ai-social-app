"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton } from "@/components/follow-button"
import { formatNumber } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { BadgeCheck, UserPlus } from "lucide-react"
import Link from "next/link"

interface SuggestedUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  bio: string | null
  isVerified: boolean
  _count: { followers: number; posts: number }
}

export function SuggestedUsers() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session) fetchSuggestedUsers()
  }, [session])

  const fetchSuggestedUsers = async () => {
    try {
      const res = await fetch("/api/users/suggested")
      if (res.ok) setUsers(await res.json())
    } catch {}
    finally { setIsLoading(false) }
  }

  if (!session || isLoading || users.length === 0) return null

  return (
    <div className="fancy-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-violet-100/60 dark:border-border/40 flex items-center gap-2">
        <div className="p-1.5 rounded-lg gradient-primary">
          <UserPlus className="h-3.5 w-3.5 text-white" />
        </div>
        <h3 className="font-semibold text-sm">Who to follow</h3>
      </div>

      {/* Users */}
      <div className="divide-y divide-violet-100/50 dark:divide-border/40">
        {users.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50/50 dark:hover:bg-muted/30 transition-colors">
            <Link href={`/profile/${user.username}`}>
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-violet-100 dark:ring-border">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="gradient-primary text-white text-xs font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Link href={`/profile/${user.username}`} className="font-semibold text-sm hover:text-primary transition-colors truncate">
                  {user.name || "Unknown"}
                </Link>
                {user.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-primary fill-primary/20 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                @{user.username} · {formatNumber(user._count.followers)} followers
              </p>
            </div>
            <FollowButton userId={user.id} isFollowing={false} currentUserId={session.user.id} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-violet-100/60 dark:border-border/40 bg-violet-50/30 dark:bg-transparent">
        <Link href="/users" className="text-xs text-primary hover:underline font-medium">
          Show more →
        </Link>
      </div>
    </div>
  )
}
