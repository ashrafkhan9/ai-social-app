"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { PostCard } from "@/components/post-card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Post {
  id: string
  content: string | null
  createdAt: Date
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    isVerified: boolean
  }
  media: Array<{
    id: string
    url: string
    type: string
  }>
  likes: Array<{ id: string }>
  reactions?: Array<{ type: string }>
  shares?: Array<{ id: string }>
  bookmarks?: Array<{ id: string }>
  _count: {
    likes: number
    comments: number
    shares: number
  }
}

interface InfinitePostsProps {
  initialPosts: Post[]
  feedType: string
  currentUserId: string
}

export function InfinitePosts({
  initialPosts,
  feedType,
  currentUserId,
}: InfinitePostsProps) {
  // Deduplicate initial posts
  const uniqueInitialPosts = initialPosts.filter(
    (post, index, self) => index === self.findIndex((p) => p.id === post.id)
  )
  const [posts, setPosts] = useState<Post[]>(uniqueInitialPosts)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const observerTarget = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      // Use different endpoint for "For You" feed
      const endpoint = feedType === "for-you" 
        ? "/api/posts/feed/for-you"
        : "/api/posts/feed"
      
      const url = new URL(endpoint, window.location.origin)
      if (feedType !== "for-you") {
        url.searchParams.set("type", feedType)
      }
      if (cursor) {
        url.searchParams.set("cursor", cursor)
      }

      const response = await fetch(url.toString())
      if (!response.ok) throw new Error("Failed to load posts")

      const data = await response.json()
      setPosts((prev) => {
        // Filter out duplicates based on post ID
        const existingIds = new Set(prev.map((p) => p.id))
        const newPosts = data.posts.filter((p: Post) => !existingIds.has(p.id))
        return [...prev, ...newPosts]
      })
      setCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error("Error loading more posts:", error)
    } finally {
      setIsLoading(false)
    }
  }, [cursor, feedType, hasMore, isLoading])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [loadMore, hasMore, isLoading])

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
      <div ref={observerTarget} className="flex justify-center py-4">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading more posts...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-muted-foreground">No more posts to load</p>
        )}
      </div>
    </div>
  )
}

