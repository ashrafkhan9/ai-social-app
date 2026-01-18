"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Heart, Laugh, AlertCircle, Angry } from "lucide-react"
import { formatNumber } from "@/lib/utils"

interface ReactionPickerProps {
  postId: string
  currentReaction?: string | null
  reactionCounts: {
    HEART: number
    LAUGH: number
    WOW: number
    ANGRY: number
  }
  onReactionChange: () => void
}

const reactions = [
  { type: "HEART", icon: Heart, label: "Love", color: "text-red-500" },
  { type: "LAUGH", icon: Laugh, label: "Haha", color: "text-yellow-500" },
  { type: "WOW", icon: AlertCircle, label: "Wow", color: "text-blue-500" },
  { type: "ANGRY", icon: Angry, label: "Angry", color: "text-orange-500" },
] as const

export function ReactionPicker({
  postId,
  currentReaction,
  reactionCounts,
  onReactionChange,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReaction = async (type: string) => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: currentReaction === type ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) throw new Error("Failed to update reaction")

      onReactionChange()
      setIsOpen(false)
    } catch (error) {
      console.error("Reaction error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const totalReactions =
    reactionCounts.HEART +
    reactionCounts.LAUGH +
    reactionCounts.WOW +
    reactionCounts.ANGRY

  const currentReactionData = reactions.find((r) => r.type === currentReaction)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={currentReaction ? currentReactionData?.color : ""}
        >
          {currentReactionData ? (
            <>
              <currentReactionData.icon
                className={`h-4 w-4 mr-1 ${
                  currentReaction ? "fill-current" : ""
                }`}
              />
              {formatNumber(totalReactions)}
            </>
          ) : (
            <>
              <Heart className="h-4 w-4 mr-1" />
              {formatNumber(totalReactions)}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-2">
          {reactions.map((reaction) => {
            const Icon = reaction.icon
            const count = reactionCounts[reaction.type as keyof typeof reactionCounts]
            const isActive = currentReaction === reaction.type

            return (
              <button
                key={reaction.type}
                onClick={() => handleReaction(reaction.type)}
                disabled={isLoading}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors ${
                  isActive ? "bg-accent" : ""
                }`}
                title={reaction.label}
              >
                <Icon
                  className={`h-6 w-6 ${reaction.color} ${
                    isActive ? "fill-current" : ""
                  }`}
                />
                {count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(count)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

