"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { Heart, MessageCircle } from "lucide-react"
import Link from "next/link"

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    isVerified: boolean
  }
  _count: {
    likes: number
    replies: number
  }
  likes?: Array<{ id: string }>
  replies?: Comment[]
}

interface CommentsSectionProps {
  postId: string
  currentUserId: string
}

export function CommentsSection({ postId, currentUserId }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !session) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) throw new Error("Failed to create comment")

      const newComment = await response.json()
      setComments([newComment, ...comments])
      setContent("")
      toast.success("Comment posted!")
    } catch (error) {
      toast.error("Failed to post comment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: isLiked ? "DELETE" : "POST",
      })

      if (!response.ok) throw new Error("Failed to like comment")

      fetchComments()
    } catch (error) {
      toast.error("Failed to like comment")
    }
  }

  const handleReply = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setIsReplying(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId }),
      })

      if (!response.ok) throw new Error("Failed to post reply")

      setReplyContent("")
      setReplyingTo(null)
      fetchComments()
      toast.success("Reply posted!")
    } catch (error) {
      toast.error("Failed to post reply")
    } finally {
      setIsReplying(false)
    }
  }

  if (!session) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={session.user?.image || undefined} />
              <AvatarFallback>
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || !content.trim()}>
                  {isSubmitting ? "Posting..." : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </form>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground">No comments yet. Be the first!</p>
          ) : (
            comments.map((comment) => {
              const isLiked = (comment.likes?.length || 0) > 0
              const showReplyForm = replyingTo === comment.id
              return (
                <div key={comment.id} className="space-y-3">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src={comment.author.image || undefined} />
                      <AvatarFallback>
                        {comment.author.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{comment.author.name || "Unknown"}</span>
                        {comment.author.isVerified && <span className="text-blue-500">✓</span>}
                        <span className="text-sm text-muted-foreground">
                          @{comment.author.username} · {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">
                      {comment.content.split(/(#\w+|@\w+)/g).map((part, i) => {
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
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button
                          onClick={() => handleLike(comment.id, isLiked)}
                          className={`flex items-center gap-1 hover:text-foreground ${
                            isLiked ? "text-red-500" : ""
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                          {comment._count.likes}
                        </button>
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Reply
                        </button>
                        {comment._count.replies > 0 && (
                          <span className="text-muted-foreground">
                            {comment._count.replies} {comment._count.replies === 1 ? "reply" : "replies"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply Form */}
                  {showReplyForm && (
                    <div className="ml-11 space-y-2">
                      <form onSubmit={(e) => handleReply(comment.id, e)} className="space-y-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          className="min-h-[60px] resize-none"
                          disabled={isReplying}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyContent("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" size="sm" disabled={isReplying || !replyContent.trim()}>
                            {isReplying ? "Posting..." : "Reply"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-11 space-y-3 border-l-2 pl-4">
                      {comment.replies.map((reply) => {
                        const isReplyLiked = (reply.likes?.length || 0) > 0
                        return (
                          <div key={reply.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reply.author.image || undefined} />
                              <AvatarFallback className="text-xs">
                                {reply.author.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{reply.author.name || "Unknown"}</span>
                                {reply.author.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                                <span className="text-xs text-muted-foreground">
                                  @{reply.author.username} · {formatDate(reply.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <button
                                  onClick={() => handleLike(reply.id, isReplyLiked)}
                                  className={`flex items-center gap-1 hover:text-foreground ${
                                    isReplyLiked ? "text-red-500" : ""
                                  }`}
                                >
                                  <Heart className={`h-3 w-3 ${isReplyLiked ? "fill-current" : ""}`} />
                                  {reply._count.likes}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}

