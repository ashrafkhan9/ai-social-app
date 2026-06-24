"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useState } from "react"

interface MessageButtonProps {
  userId: string
}

export function MessageButton({ userId }: MessageButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMessage = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        const conv = await response.json()
        router.push(`/messages?conversation=${conv.id}`)
        toast.success("Conversation started!")
      } else {
        throw new Error("Failed to create conversation")
      }
    } catch (error) {
      console.error("Failed to start conversation:", error)
      toast.error("Failed to start conversation")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleMessage}
      disabled={isLoading}
    >
      {isLoading ? "..." : "Message"}
    </Button>
  )
}

