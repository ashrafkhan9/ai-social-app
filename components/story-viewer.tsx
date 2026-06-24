"use client"

import { useState, useEffect, useRef } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"

interface Story {
  id: string
  mediaUrl: string
  mediaType: "image" | "video"
  text?: string | null
  textColor?: string | null
  textPosition?: string | null
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    isVerified: boolean
  }
  viewed: boolean
  viewCount: number
}

interface StoryGroup {
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    isVerified: boolean
  }
  stories: Story[]
}

interface StoryViewerProps {
  storyGroups: StoryGroup[]
  initialGroupIndex?: number
  initialStoryIndex?: number
  onClose: () => void
}

export function StoryViewer({
  storyGroups,
  initialGroupIndex = 0,
  initialStoryIndex = 0,
  onClose,
}: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentGroup = storyGroups[currentGroupIndex]
  const currentStory = currentGroup?.stories[currentStoryIndex]

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.viewed) {
      fetch(`/api/stories/${currentStory.id}/view`, {
        method: "POST",
      }).catch(console.error)
    }
  }, [currentStory])

  // Auto-advance story
  useEffect(() => {
    if (!currentStory || isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      return
    }

    const duration = currentStory.mediaType === "video" ? 10000 : 5000 // 10s for video, 5s for image
    const interval = 50 // Update every 50ms

    setProgress(0)
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (interval / duration) * 100
        if (newProgress >= 100) {
          nextStory()
          return 0
        }
        return newProgress
      })
    }, interval)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentStory, isPaused])

  // Handle video ended
  const handleVideoEnd = () => {
    nextStory()
  }

  const nextStory = () => {
    if (!currentGroup) return

    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1)
      setCurrentStoryIndex(0)
    } else {
      onClose()
    }
  }

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1)
      const prevGroup = storyGroups[currentGroupIndex - 1]
      setCurrentStoryIndex(prevGroup.stories.length - 1)
    }
  }

  if (!currentStory) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {currentGroup.stories.map((story, index) => (
          <div
            key={story.id}
            className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-75"
              style={{
                width:
                  index < currentStoryIndex
                    ? "100%"
                    : index === currentStoryIndex
                    ? `${progress}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={currentStory.author.image || undefined} />
            <AvatarFallback>
              {currentStory.author.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {currentStory.author.name || currentStory.author.username}
              </span>
              {currentStory.author.isVerified && (
                <span className="text-blue-400">✓</span>
              )}
            </div>
            <p className="text-xs text-white/70">
              {formatDate(new Date(currentStory.createdAt))}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Story Content */}
      <div
        className="w-full h-full flex items-center justify-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {currentStory.mediaType === "image" ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.mediaUrl}
            className="max-w-full max-h-full"
            autoPlay
            playsInline
            onEnded={handleVideoEnd}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
          />
        )}

        {/* Text Overlay */}
        {currentStory.text && (
          <div
            className="absolute left-0 right-0 px-4 py-2 pointer-events-none"
            style={{
              color: currentStory.textColor || "#FFFFFF",
              top:
                currentStory.textPosition === "top"
                  ? "80px"
                  : currentStory.textPosition === "bottom"
                  ? "auto"
                  : "50%",
              bottom: currentStory.textPosition === "bottom" ? "80px" : "auto",
              transform:
                currentStory.textPosition === "center"
                  ? "translateY(-50%)"
                  : "none",
            }}
          >
            <p className="text-3xl font-bold text-center drop-shadow-2xl">
              {currentStory.text}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="absolute inset-0 flex items-center">
          <button
            onClick={prevStory}
            className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={nextStory}
            className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  )
}

