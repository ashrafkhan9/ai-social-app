"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { ReactionPicker } from "@/components/reaction-picker"
import { formatDate, formatNumber } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

interface PostCardProps {
  post: {
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
  currentUserId: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.likes.length > 0)
  const [likeCount, setLikeCount] = useState(post._count.likes)
  const [shareCount, setShareCount] = useState(post._count.shares)
  const [isShared, setIsShared] = useState((post.shares?.length || 0) > 0)
  const [isBookmarked, setIsBookmarked] = useState((post.bookmarks?.length || 0) > 0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content || "")
  const [isDeleting, setIsDeleting] = useState(false)
  const [reactionCounts, setReactionCounts] = useState({
    HEART: 0,
    LAUGH: 0,
    WOW: 0,
    ANGRY: 0,
  })
  const [currentReaction, setCurrentReaction] = useState<string | null>(
    post.reactions?.[0]?.type || null
  )
  const isOwnPost = post.author.id === currentUserId

  // Fetch reaction counts
  useEffect(() => {
    fetchReactionCounts()
  }, [post.id])

  const fetchReactionCounts = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/reactions/counts`)
      if (response.ok) {
        const counts = await response.json()
        setReactionCounts(counts)
      }
    } catch (error) {
      console.error("Failed to fetch reaction counts:", error)
    }
  }

  const fetchCurrentReaction = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/reactions`)
      if (response.ok) {
        const reactions = await response.json()
        setCurrentReaction(reactions[0]?.type || null)
      }
    } catch (error) {
      console.error("Failed to fetch current reaction:", error)
    }
  }

  useEffect(() => {
    fetchCurrentReaction()
  }, [post.id])

  const handleLike = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to like post")

      setIsLiked(!isLiked)
      setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1))
    } catch (error) {
      toast.error("Failed to like post")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/share`, {
        method: isShared ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to share post")

      setIsShared(!isShared)
      setShareCount((prev) => (isShared ? prev - 1 : prev + 1))
      toast.success(isShared ? "Share removed" : "Post shared!")
    } catch (error) {
      toast.error("Failed to share post")
    } finally {
      setIsSharing(false)
    }
  }

  const handleBookmark = async () => {
    setIsBookmarking(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/bookmark`, {
        method: isBookmarked ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to bookmark post")

      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? "Bookmark removed" : "Post bookmarked!")
    } catch (error) {
      toast.error("Failed to bookmark post")
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleEdit = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) throw new Error("Failed to update post")

      const updatedPost = await response.json()
      setIsEditing(false)
      toast.success("Post updated!")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update post")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete post")

      toast.success("Post deleted")
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete post")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar>
                <AvatarImage src={post.author.image || undefined} />
                <AvatarFallback>
                  {post.author.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${post.author.username}`}>
                  <span className="font-semibold hover:underline">
                    {post.author.name || "Unknown"}
                  </span>
                </Link>
                {post.author.isVerified && (
                  <span className="text-blue-500">✓</span>
                )}
                <span className="text-muted-foreground text-sm">
                  @{post.author.username}
                </span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">
                  {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
            {isOwnPost && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-md resize-none min-h-[100px]"
                disabled={isLoading}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(post.content || "")
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={isLoading || !editContent.trim()}
                >
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            post.content && (
              <p className="whitespace-pre-wrap">
                {post.content.split(/(#\w+|@\w+)/g).map((part, i) => {
                  if (part.startsWith("#")) {
                    const hashtag = part.slice(1)
                    return (
                      <Link
                        key={i}
                        href={`/hashtag/${hashtag}`}
                        className="text-blue-500 hover:underline"
                      >
                        {part}
                      </Link>
                    )
                  }
                  if (part.startsWith("@")) {
                    const username = part.slice(1)
                    return (
                      <Link
                        key={i}
                        href={`/profile/${username}`}
                        className="text-blue-500 hover:underline"
                      >
                        {part}
                      </Link>
                    )
                  }
                  return <span key={i}>{part}</span>
                })}
              </p>
            )
          )}

          {post.media.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {post.media.map((media) => (
                <div key={media.id} className="relative rounded-lg overflow-hidden">
                  {media.type === "IMAGE" ? (
                    <img
                      src={media.url}
                      alt="Post media"
                      className="w-full h-auto object-cover"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="w-full h-auto"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-muted-foreground">
            <ReactionPicker
              postId={post.id}
              currentReaction={currentReaction}
              reactionCounts={reactionCounts}
              onReactionChange={() => {
                fetchReactionCounts()
                fetchCurrentReaction()
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLoading}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {formatNumber(likeCount)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link href={`/posts/${post.id}`}>
                <MessageCircle className="h-4 w-4 mr-1" />
                {formatNumber(post._count.comments)}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={isSharing}
              className={isShared ? "text-blue-500" : ""}
            >
              <Share2 className={`h-4 w-4 mr-1 ${isShared ? "fill-current" : ""}`} />
              {formatNumber(shareCount)}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              disabled={isBookmarking}
              className={isBookmarked ? "text-yellow-500" : ""}
            >
              <Bookmark className={`h-4 w-4 mr-1 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

