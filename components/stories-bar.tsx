"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StoryViewer } from "./story-viewer"
import { CreateStory } from "./create-story"
import { Plus } from "lucide-react"

interface StoryGroup {
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    isVerified: boolean
  }
  stories: Array<{
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
  }>
}

export function StoriesBar() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0)
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0)

  useEffect(() => {
    fetchStories()
    // Refresh stories every 30 seconds to get new ones
    const interval = setInterval(fetchStories, 30000)
    
    // Listen for custom event to refresh stories
    const handleStoryCreated = () => {
      fetchStories()
    }
    window.addEventListener("story-created", handleStoryCreated)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener("story-created", handleStoryCreated)
    }
  }, [])

  const fetchStories = async () => {
    try {
      const response = await fetch("/api/stories")
      if (response.ok) {
        const data = await response.json()
        setStoryGroups(data)
      } else {
        console.error("Failed to fetch stories:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching stories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoryClick = (groupIndex: number, storyIndex: number) => {
    setSelectedGroupIndex(groupIndex)
    setSelectedStoryIndex(storyIndex)
    setViewerOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-16 h-16 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (storyGroups.length === 0) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        <CreateStory />
        <div className="text-sm text-muted-foreground flex items-center">
          No stories available
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto scrollbar-hide">
        <CreateStory />

        {storyGroups.map((group, groupIndex) => {
          const hasUnviewed = group.stories.some((s) => !s.viewed)
          const firstStory = group.stories[0]

          return (
            <button
              key={group.author.id}
              onClick={() => handleStoryClick(groupIndex, 0)}
              className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div
                className={`relative w-16 h-16 rounded-full p-0.5 ${
                  hasUnviewed
                    ? "bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500"
                    : "bg-muted"
                }`}
              >
                <div className="w-full h-full rounded-full bg-background p-0.5">
                  <Avatar className="w-full h-full">
                    <AvatarImage
                      src={group.author.image || undefined}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {group.author.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <p className="text-xs text-center max-w-[64px] truncate">
                {group.author.name || group.author.username}
              </p>
            </button>
          )
        })}
      </div>

      {viewerOpen && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={selectedGroupIndex}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => {
            setViewerOpen(false)
            fetchStories() // Refresh to update viewed status
          }}
        />
      )}
    </>
  )
}
