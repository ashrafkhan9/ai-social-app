"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Image as ImageIcon, Video, X, Loader2, Calendar as CalendarIcon, Save, Sparkles, Wand2 } from "lucide-react"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MediaFile {
  url: string
  type: "IMAGE" | "VIDEO"
  file?: File
}

export function CreatePost() {
  const { data: session } = useSession()
  const router = useRouter()
  const [content, setContent] = useState("")
  const [media, setMedia] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [scheduledTime, setScheduledTime] = useState("")
  const [isDraft, setIsDraft] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiTone, setAiTone] = useState<"professional" | "casual" | "funny">("casual")
  const [isGeneratingPost, setIsGeneratingPost] = useState(false)
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Failed to upload file")

        const data = await response.json()
        const mediaItem = { url: data.url, type: data.type, file }
        setMedia((prev) => [...prev, mediaItem])
        
        // Auto-generate caption for images
        if (data.type === "IMAGE") {
          generateAutoCaption(data.url)
        }
      }
      toast.success("Media uploaded!")
    } catch (error) {
      toast.error("Failed to upload media")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const generateAutoCaption = async (imageUrl: string) => {
    setIsGeneratingCaption(true)
    try {
      const response = await fetch("/api/ai/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `Failed to generate caption (${response.status})`
        
        // Check if no services are configured
        if (errorData.requiresConfiguration || response.status === 503) {
          throw new Error("NO_SERVICE_CONFIGURED: " + errorMsg)
        }
        
        // Show specific message for free tier users
        if (errorData.requiresUpgrade) {
          throw new Error("Image captioning requires a paid OpenAI account. Free tier doesn't support vision models.")
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()
      if (data.caption) {
        // Append caption to content if empty, or add it
        if (!content.trim()) {
          setContent(data.caption)
        } else {
          setContent((prev) => `${prev}\n\n${data.caption}`)
        }
        toast.success("Caption generated!")
      }
    } catch (error: any) {
      console.error("Caption generation error:", error)
      const errorMessage = error.message || "Failed to generate caption"
      
      if (errorMessage.includes("NO_SERVICE_CONFIGURED")) {
        const cleanMsg = errorMessage.replace("NO_SERVICE_CONFIGURED: ", "")
        toast.error(cleanMsg, { duration: 8000 })
      } else if (errorMessage.includes("not configured") || errorMessage.includes("API key")) {
        toast.error("No AI service configured. Please add GEMINI_API_KEY (free!) or OPENAI_API_KEY to your .env file.")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsGeneratingCaption(false)
    }
  }

  const generateAIPost = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    setIsGeneratingPost(true)
    try {
      const response = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: aiTone,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `Failed to generate post (${response.status})`
        
        // Check if no services are configured
        if (errorData.requiresConfiguration || response.status === 503) {
          throw new Error("NO_SERVICE_CONFIGURED: " + errorMsg)
        }
        
        // Check for quota/rate limit errors
        if (errorData.quotaExceeded || errorData.rateLimited || response.status === 429) {
          throw new Error("QUOTA_EXCEEDED: " + errorMsg)
        }
        
        throw new Error(errorMsg)
      }

      const data = await response.json()
      if (data.content) {
        setContent(data.content)
        setShowAISuggestions(false)
        setAiPrompt("")
        toast.success("Post generated!")
      }
    } catch (error: any) {
      console.error("AI post generation error:", error)
      const errorMessage = error.message || "Failed to generate post"
      
      // Show specific messages for different error types
      if (errorMessage.includes("NO_SERVICE_CONFIGURED")) {
        const cleanMsg = errorMessage.replace("NO_SERVICE_CONFIGURED: ", "")
        toast.error(
          `No AI service configured. Get a free Gemini API key at: https://makersuite.google.com/app/apikey\n\n${cleanMsg}`,
          { duration: 12000 }
        )
      } else if (errorMessage.includes("QUOTA_EXCEEDED") || errorMessage.includes("quota") || errorMessage.includes("exceeded")) {
        toast.error("AI service quota exceeded. Please check your API usage or try again later.")
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        toast.error("Rate limit exceeded. Please wait a moment and try again.")
      } else if (errorMessage.includes("not configured") || errorMessage.includes("API key")) {
        toast.error("No AI service configured. Please add at least one API key (Gemini is free!) to your .env file.")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsGeneratingPost(false)
    }
  }

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && media.length === 0) return

    setIsLoading(true)
    try {
      // Calculate scheduledFor datetime if scheduling
      let scheduledFor: string | null = null
      if (scheduledDate && scheduledTime && !isDraft) {
        const [hours, minutes] = scheduledTime.split(":")
        const scheduled = new Date(scheduledDate)
        scheduled.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        
        // Validate scheduled time is in the future
        if (scheduled <= new Date()) {
          toast.error("Scheduled time must be in the future")
          setIsLoading(false)
          return
        }
        
        scheduledFor = scheduled.toISOString()
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || null,
          media: media.map((m) => ({ url: m.url, type: m.type })),
          isDraft,
          scheduledFor,
        }),
      })

      if (!response.ok) throw new Error("Failed to create post")

      toast.success(isDraft ? "Draft saved!" : scheduledFor ? "Post scheduled!" : "Post created!")
      setContent("")
      setMedia([])
      setScheduledDate(undefined)
      setScheduledTime("")
      setIsDraft(false)
      router.refresh()
    } catch (error) {
      toast.error("Failed to create post")
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) return null

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={session.user?.image || undefined} />
              <AvatarFallback>
                {session.user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
                disabled={isLoading}
              />
              
              {media.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {media.map((item, index) => (
                    <div key={index} className="relative group">
                      {item.type === "IMAGE" ? (
                        <img
                          src={item.url}
                          alt="Upload preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {item.type === "IMAGE" && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => generateAutoCaption(item.url)}
                            disabled={isGeneratingCaption}
                            title="Generate AI caption"
                          >
                            {isGeneratingCaption ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeMedia(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Scheduling Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoading || isDraft}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Schedule"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                    {scheduledDate && (
                      <div className="p-3 border-t">
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          min={new Date().toTimeString().slice(0, 5)}
                        />
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
                
                <Button
                  type="button"
                  variant={isDraft ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsDraft(!isDraft)}
                  disabled={isLoading || !!scheduledDate}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isDraft ? "Draft" : "Save as Draft"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="media-upload"
                    disabled={uploading || isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || isLoading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? "Uploading..." : "Media"}
                  </Button>
                  
                  {/* AI Post Suggestions */}
                  <Dialog open={showAISuggestions} onOpenChange={setShowAISuggestions}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Suggestions
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>AI Post Suggestions</DialogTitle>
                        <DialogDescription>
                          Describe what you want to post about, and AI will generate content for you
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            What do you want to post about?
                          </label>
                          <Textarea
                            placeholder="e.g., A beautiful sunset I saw today, My thoughts on technology, A funny moment..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Tone
                          </label>
                          <Select value={aiTone} onValueChange={(value: any) => setAiTone(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                              <SelectItem value="funny">Funny</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowAISuggestions(false)
                              setAiPrompt("")
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={generateAIPost}
                            disabled={!aiPrompt.trim() || isGeneratingPost}
                          >
                            {isGeneratingPost ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Generate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex gap-2">
                  {scheduledDate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setScheduledDate(undefined)
                        setScheduledTime("")
                      }}
                    >
                      Clear Schedule
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isLoading || (!content.trim() && media.length === 0)}
                  >
                    {isLoading 
                      ? (isDraft ? "Saving..." : scheduledDate ? "Scheduling..." : "Posting...")
                      : isDraft 
                        ? "Save Draft"
                        : scheduledDate 
                          ? "Schedule Post"
                          : "Post"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

