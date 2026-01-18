"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  currentUserId: string
}

export function FollowButton({ userId, isFollowing, currentUserId }: FollowButtonProps) {
  const router = useRouter()
  const [following, setFollowing] = useState(isFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const handleFollow = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: following ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to update follow status")

      setFollowing(!following)
      toast.success(following ? "Unfollowed" : "Following")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update follow status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      className="mt-4"
      variant={following ? "outline" : "default"}
      onClick={handleFollow}
      disabled={isLoading}
    >
      {isLoading ? "..." : following ? "Following" : "Follow"}
    </Button>
  )
}

