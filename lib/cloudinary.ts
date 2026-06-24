import { v2 as cloudinary } from "cloudinary"
import { Readable } from "stream"

// Parse Cloudinary URL if provided, otherwise use individual env vars
function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL

  if (cloudinaryUrl) {
    // Parse cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/)
    if (match) {
      return {
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2],
      }
    }
  }

  // Fallback to individual environment variables
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  }
}

// Configure Cloudinary
const config = getCloudinaryConfig()
cloudinary.config(config)

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "social-platform",
  options: {
    resource_type?: "image" | "video" | "raw" | "auto"
    public_id?: string
    transformation?: any[]
  } = {}
): Promise<{
  secure_url: string
  public_id: string
  width?: number
  height?: number
  bytes: number
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: options.resource_type || "auto",
        public_id: options.public_id,
        transformation: options.transformation,
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          })
        } else {
          reject(new Error("Upload failed: No result"))
        }
      }
    )

    // Convert buffer to stream
    const bufferStream = new Readable()
    bufferStream.push(buffer)
    bufferStream.push(null)
    bufferStream.pipe(uploadStream)
  })
}

/**
 * Upload an image with optimization
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string = "social-platform/images",
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: "webp" | "jpg" | "png"
  } = {}
): Promise<{
  url: string
  thumbnailUrl: string
  width: number
  height: number
  size: number
}> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = "webp",
  } = options

  // Upload optimized image
  const imageResult = await uploadToCloudinary(buffer, folder, {
    resource_type: "image",
    transformation: [
      {
        width: maxWidth,
        height: maxHeight,
        crop: "limit",
        quality,
        format,
      },
    ],
  })

  // Generate thumbnail
  const thumbnailResult = await uploadToCloudinary(buffer, `${folder}/thumbnails`, {
    resource_type: "image",
    transformation: [
      {
        width: 300,
        height: 300,
        crop: "fill",
        quality: 80,
        format: "webp",
      },
    ],
  })

  return {
    url: imageResult.secure_url,
    thumbnailUrl: thumbnailResult.secure_url,
    width: imageResult.width || 0,
    height: imageResult.height || 0,
    size: imageResult.bytes,
  }
}

/**
 * Upload a video with thumbnail generation
 */
export async function uploadVideo(
  buffer: Buffer,
  folder: string = "social-platform/videos",
  options: {
    maxSize?: number
    maxDuration?: number
  } = {}
): Promise<{
  url: string
  thumbnailUrl: string
  size: number
}> {
  // Upload video
  const videoResult = await uploadToCloudinary(buffer, folder, {
    resource_type: "video",
    transformation: [
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  })

  // Generate video thumbnail (Cloudinary automatically generates thumbnails)
  // Extract public_id from the video URL to generate thumbnail URL
  const publicId = videoResult.public_id
  const thumbnailUrl = cloudinary.url(publicId, {
    resource_type: "video",
    transformation: [
      {
        width: 640,
        height: 360,
        crop: "fill",
        quality: "auto",
        fetch_format: "auto",
      },
      {
        video_codec: "none",
        format: "jpg",
      },
    ],
  })

  return {
    url: videoResult.secure_url,
    thumbnailUrl,
    size: videoResult.bytes,
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  })
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: "webp" | "jpg" | "png"
  } = {}
): string {
  const { width, height, quality = "auto", format = "auto" } = options

  return cloudinary.url(publicId, {
    transformation: [
      ...(width || height
        ? [
            {
              width,
              height,
              crop: width && height ? "fill" : "limit",
            },
          ]
        : []),
      {
        quality,
        fetch_format: format,
      },
    ],
  })
}

