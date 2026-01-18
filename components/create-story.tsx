"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, X, Upload, Type } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function CreateStory() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null)
  const [text, setText] = useState("")
  const [textColor, setTextColor] = useState("#FFFFFF")
  const [textPosition, setTextPosition] = useState<"top" | "center" | "bottom">("center")
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")

    if (!isImage && !isVideo) {
      toast.error("Please select an image or video file")
      return
    }

    // Validate file size (15MB max for stories)
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File size must be less than 15MB")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setMediaUrl(data.url)
      setMediaType(isImage ? "image" : "video")
    } catch (error) {
      toast.error("Failed to upload file")
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateStory = async () => {
    if (!mediaUrl || !mediaType) {
      toast.error("Please upload a media file")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl,
          mediaType,
          text: text || undefined,
          textColor: textColor || undefined,
          textPosition: textPosition || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to create story")

      toast.success("Story created!")
      setOpen(false)
      resetForm()
      
      // Dispatch custom event to refresh stories bar
      window.dispatchEvent(new Event("story-created"))
    } catch (error) {
      toast.error("Failed to create story")
      console.error(error)
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setMediaUrl(null)
    setMediaType(null)
    setText("")
    setTextColor("#FFFFFF")
    setTextPosition("center")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Story
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Story</DialogTitle>
          <DialogDescription>
            Share a moment that disappears in 24 hours
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Upload */}
          {!mediaUrl ? (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="story-upload"
              />
              <div
                className="cursor-pointer flex flex-col items-center gap-4"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Upload Photo or Video</p>
                  <p className="text-sm text-muted-foreground">
                    Max 15MB • Image or Video
                  </p>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isUploading}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  {isUploading ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden bg-black">
              {mediaType === "image" ? (
                <img
                  src={mediaUrl}
                  alt="Story preview"
                  className="w-full h-[400px] object-contain"
                />
              ) : (
                <video
                  src={mediaUrl}
                  className="w-full h-[400px] object-contain"
                  controls
                  preload="metadata"
                />
              )}

              {/* Text Overlay */}
              {text && (
                <div
                  className="absolute left-0 right-0 px-4 py-2"
                  style={{
                    color: textColor,
                    top:
                      textPosition === "top"
                        ? "20px"
                        : textPosition === "bottom"
                        ? "auto"
                        : "50%",
                    bottom: textPosition === "bottom" ? "20px" : "auto",
                    transform:
                      textPosition === "center" ? "translateY(-50%)" : "none",
                  }}
                >
                  <p className="text-2xl font-bold text-center drop-shadow-lg">
                    {text}
                  </p>
                </div>
              )}

              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setMediaUrl(null)
                  setMediaType(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Text Overlay Controls */}
          {mediaUrl && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                <span className="font-semibold">Add Text Overlay</span>
              </div>

              <Input
                placeholder="Add text to your story..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {text && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Text Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="h-10 w-20 rounded border"
                      />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Position
                    </label>
                    <select
                      value={textPosition}
                      onChange={(e) =>
                        setTextPosition(
                          e.target.value as "top" | "center" | "bottom"
                        )
                      }
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateStory}
              disabled={!mediaUrl || isCreating}
            >
              {isCreating ? "Creating..." : "Share Story"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

