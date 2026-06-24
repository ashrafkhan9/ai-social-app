import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

/**
 * Generate a thumbnail from a video file using ffmpeg
 * Falls back to a placeholder if ffmpeg is not available
 */
export async function generateVideoThumbnail(
  videoPath: string,
  outputPath: string,
  timeOffset: number = 1 // Extract frame at 1 second
): Promise<{ path: string; size: number } | null> {
  try {
    // Ensure output directory exists
    const outputDir = join(outputPath, "..")
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }

    // Try to use ffmpeg to extract a frame
    // This requires ffmpeg to be installed on the system
    try {
      await execAsync(
        `ffmpeg -i "${videoPath}" -ss ${timeOffset} -vframes 1 -vf "scale=640:-1" "${outputPath}" -y`
      )

      // Optimize the thumbnail with sharp
      const thumbnailBuffer = await sharp(outputPath)
        .resize(640, 360, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer()

      await writeFile(outputPath, thumbnailBuffer)

      return {
        path: outputPath,
        size: thumbnailBuffer.length,
      }
    } catch (ffmpegError) {
      console.warn("FFmpeg not available, using fallback method:", ffmpegError)
      // Fallback: Create a placeholder thumbnail
      return await createPlaceholderThumbnail(outputPath)
    }
  } catch (error) {
    console.error("Video thumbnail generation error:", error)
    return await createPlaceholderThumbnail(outputPath)
  }
}

/**
 * Create a placeholder thumbnail when video processing is not available
 */
async function createPlaceholderThumbnail(
  outputPath: string
): Promise<{ path: string; size: number }> {
  // Create a simple placeholder image
  const placeholder = await sharp({
    create: {
      width: 640,
      height: 360,
      channels: 3,
      background: { r: 20, g: 20, b: 20 },
    },
  })
    .webp({ quality: 80 })
    .toBuffer()

  await writeFile(outputPath, placeholder)

  return {
    path: outputPath,
    size: placeholder.length,
  }
}

/**
 * Check if ffmpeg is available on the system
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync("ffmpeg -version")
    return true
  } catch {
    return false
  }
}

