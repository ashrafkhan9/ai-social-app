"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, UserX, VolumeX, Volume2, UserCheck } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface UserActionsMenuProps {
  userId: string
  isBlocked: boolean
  isMuted: boolean
  isFollowing: boolean
  onFollowChange?: () => void
}

export function UserActionsMenu({
  userId,
  isBlocked,
  isMuted,
  isFollowing,
  onFollowChange,
}: UserActionsMenuProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleBlock = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: isBlocked ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to update block status")

      toast.success(isBlocked ? "User unblocked" : "User blocked")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update block status")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMute = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/mute`, {
        method: isMuted ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to update mute status")

      toast.success(isMuted ? "User unmuted" : "User muted")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update mute status")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleBlock}
          className={isBlocked ? "" : "text-red-600"}
          disabled={isLoading}
        >
          <UserX className="h-4 w-4 mr-2" />
          {isBlocked ? "Unblock" : "Block"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleMute}
          className={isMuted ? "" : "text-orange-600"}
          disabled={isLoading}
        >
          {isMuted ? (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Unmute
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4 mr-2" />
              Mute
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

