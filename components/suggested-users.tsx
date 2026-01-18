"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { FollowButton } from "@/components/follow-button"
import { formatNumber } from "@/lib/utils"
import { useSession } from "next-auth/react"
import { Users } from "lucide-react"

interface SuggestedUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  bio: string | null
  isVerified: boolean
  _count: {
    followers: number
    posts: number
  }
}

export function SuggestedUsers() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<SuggestedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchSuggestedUsers()
    }
  }, [session])

  const fetchSuggestedUsers = async () => {
    try {
      const response = await fetch("/api/users/suggested")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching suggested users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session || isLoading) return null

  if (users.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Suggested Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar>
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={`/profile/${user.username}`}
                    className="font-semibold hover:underline truncate"
                  >
                    {user.name || "Unknown"}
                  </a>
                  {user.isVerified && <span className="text-blue-500">✓</span>}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username} · {formatNumber(user._count.followers)} followers
                </p>
              </div>
            </div>
            <FollowButton
              userId={user.id}
              isFollowing={false}
              currentUserId={session.user.id}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

