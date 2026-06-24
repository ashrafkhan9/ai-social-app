"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Edit, Trash2, BadgeCheck } from "lucide-react"
import { ReactionPicker } from "@/components/reaction-picker"
import { formatDate, formatNumber } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    media: Array<{ id: string; url: string; type: string }>
    likes: Array<{ id: string }>
    reactions?: Array<{ type: string }>
    shares?: Array<{ id: string }>
    bookmarks?: Array<{ id: string }>
    _count: { likes: number; comments: number; shares: number }
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
  const [likeAnim, setLikeAnim] = useState(false)
  const [reactionCounts, setReactionCounts] = useState({ HEART: 0, LAUGH: 0, WOW: 0, ANGRY: 0 })
  const [currentReaction, setCurrentReaction] = useState<string | null>(post.reactions?.[0]?.type || null)
  const isOwnPost = post.author.id === currentUserId

  useEffect(() => {
    fetchReactionCounts()
    fetchCurrentReaction()
  }, [post.id])

  const fetchReactionCounts = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/reactions/counts`)
      if (res.ok) setReactionCounts(await res.json())
    } catch {}
  }

  const fetchCurrentReaction = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/reactions`)
      if (res.ok) {
        const data = await res.json()
        setCurrentReaction(data[0]?.type || null)
      }
    } catch {}
  }

  const handleLike = async () => {
    setIsLoading(true)
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 300)
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: isLiked ? "DELETE" : "POST" })
      if (!res.ok) throw new Error()
      setIsLiked(!isLiked)
      setLikeCount((p) => (isLiked ? p - 1 : p + 1))
    } catch {
      toast.error("Failed to like post")
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/share`, { method: isShared ? "DELETE" : "POST" })
      if (!res.ok) throw new Error()
      setIsShared(!isShared)
      setShareCount((p) => (isShared ? p - 1 : p + 1))
      toast.success(isShared ? "Share removed" : "Post shared!")
    } catch {
      toast.error("Failed to share post")
    } finally {
      setIsSharing(false)
    }
  }

  const handleBookmark = async () => {
    setIsBookmarking(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/bookmark`, { method: isBookmarked ? "DELETE" : "POST" })
      if (!res.ok) throw new Error()
      setIsBookmarked(!isBookmarked)
      toast.success(isBookmarked ? "Removed from bookmarks" : "Saved to bookmarks")
    } catch {
      toast.error("Failed to bookmark post")
    } finally {
      setIsBookmarking(false)
    }
  }

  const handleEdit = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      })
      if (!res.ok) throw new Error()
      setIsEditing(false)
      toast.success("Post updated!")
      router.refresh()
    } catch {
      toast.error("Failed to update post")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Post deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete post")
    } finally {
      setIsDeleting(false)
    }
  }

  const renderContent = (text: string) =>
    text.split(/(#\w+|@\w+)/g).map((part, i) => {
      if (part.startsWith("#"))
        return <Link key={i} href={`/hashtag/${part.slice(1)}`} className="text-primary font-medium hover:underline">{part}</Link>
      if (part.startsWith("@"))
        return <Link key={i} href={`/profile/${part.slice(1)}`} className="text-primary font-medium hover:underline">{part}</Link>
      return <span key={i}>{part}</span>
    })

  return (
    <article className="fancy-card rounded-2xl p-5 transition-all duration-200 hover:shadow-lg hover:shadow-violet-100/60 dark:hover:shadow-violet-900/10 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author.username}`}>
            <Avatar className="h-10 w-10 ring-2 ring-violet-100 dark:ring-border hover:ring-violet-300 transition-all">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback className="gradient-primary text-white text-sm font-bold">
                {post.author.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={`/profile/${post.author.username}`} className="font-semibold text-sm hover:text-primary transition-colors">
                {post.author.name || "Unknown"}
              </Link>
              {post.author.isVerified && (
                <BadgeCheck className="h-4 w-4 text-primary fill-primary/20" />
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <span>@{post.author.username}</span>
              <span>·</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {isOwnPost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground rounded-full">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting…" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3 mb-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 bg-muted/50 border border-border rounded-xl resize-none min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditContent(post.content || "") }} disabled={isLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEdit} disabled={isLoading || !editContent.trim()}>
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      ) : post.content ? (
        <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap">
          {renderContent(post.content)}
        </p>
      ) : null}

      {/* Media */}
      {post.media.length > 0 && (
        <div className={cn("mb-4 rounded-xl overflow-hidden", post.media.length > 1 && "grid grid-cols-2 gap-1")}>
          {post.media.map((m) =>
            m.type === "IMAGE" ? (
              <img key={m.id} src={m.url} alt="Post media" className="w-full object-cover max-h-[500px]" />
            ) : (
              <video key={m.id} src={m.url} controls className="w-full" />
            )
          )}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 -mx-1 pt-3 border-t border-violet-100/60 dark:border-border/40">
        <Button
          variant="ghost" size="sm" onClick={handleLike} disabled={isLoading}
          className={cn("flex-1 gap-1.5 h-8 rounded-xl text-xs font-medium transition-all",
            isLiked ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20")}
        >
          <Heart className={cn("h-4 w-4 transition-transform", isLiked && "fill-current", likeAnim && "scale-125")} />
          <span>{formatNumber(likeCount)}</span>
        </Button>

        <Button variant="ghost" size="sm" asChild className="flex-1 gap-1.5 h-8 rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5">
          <Link href={`/posts/${post.id}`}>
            <MessageCircle className="h-4 w-4" />
            <span>{formatNumber(post._count.comments)}</span>
          </Link>
        </Button>

        <Button
          variant="ghost" size="sm" onClick={handleShare} disabled={isSharing}
          className={cn("flex-1 gap-1.5 h-8 rounded-xl text-xs font-medium transition-all",
            isShared ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" : "text-muted-foreground hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20")}
        >
          <Share2 className={cn("h-4 w-4", isShared && "fill-current")} />
          <span>{formatNumber(shareCount)}</span>
        </Button>

        <div className="flex-1 flex justify-center">
          <ReactionPicker
            postId={post.id}
            currentReaction={currentReaction}
            reactionCounts={reactionCounts}
            onReactionChange={() => { fetchReactionCounts(); fetchCurrentReaction() }}
          />
        </div>

        <Button
          variant="ghost" size="sm" onClick={handleBookmark} disabled={isBookmarking}
          className={cn("flex-1 gap-1.5 h-8 rounded-xl text-xs font-medium transition-all",
            isBookmarked ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20")}
        >
          <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
        </Button>
      </div>
    </article>
  )
}
