import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { uploadImage, uploadVideo } from "@/lib/cloudinary"

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const validImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    const validVideoTypes = ["video/mp4", "video/webm", "video/quicktime"]
    const isValidType = validImageTypes.includes(file.type) || validVideoTypes.includes(file.type)

    if (!isValidType) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and videos are allowed." },
        { status: 400 }
      )
    }

    // Validate file size (10MB max for images, 100MB for videos)
    const maxImageSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    const maxSize = validImageTypes.includes(file.type) ? maxImageSize : maxVideoSize
    
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let fileUrl: string
    let fileSize: number
    let thumbnailUrl: string | null = null

    try {
      if (validImageTypes.includes(file.type)) {
        // Upload and optimize image to Cloudinary
        const result = await uploadImage(buffer, "social-platform/images", {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 85,
          format: "webp",
        })

        fileUrl = result.url
        fileSize = result.size
        thumbnailUrl = result.thumbnailUrl
      } else {
        // Upload video to Cloudinary
        const result = await uploadVideo(buffer, "social-platform/videos", {
          maxSize: maxVideoSize,
        })

        fileUrl = result.url
        fileSize = result.size
        thumbnailUrl = result.thumbnailUrl
      }
    } catch (error: any) {
      console.error("Cloudinary upload error:", error)
      return NextResponse.json(
        { error: "Failed to upload file to cloud storage", details: error.message },
        { status: 500 }
      )
    }

    const mediaType = validImageTypes.includes(file.type) ? "IMAGE" : "VIDEO"

    return NextResponse.json({
      url: fileUrl,
      type: mediaType,
      size: fileSize,
      name: file.name,
      thumbnailUrl,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

