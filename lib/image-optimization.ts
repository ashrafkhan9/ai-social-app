import sharp from "sharp"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

interface OptimizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "webp" | "jpeg" | "png"
}

export async function optimizeImage(
  buffer: Buffer,
  outputPath: string,
  options: OptimizeOptions = {}
): Promise<{ path: string; size: number; width: number; height: number }> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 85,
    format = "webp",
  } = options

  // Ensure output directory exists
  const outputDir = join(outputPath, "..")
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  // Get image metadata
  const metadata = await sharp(buffer).metadata()

  // Resize if needed
  let image = sharp(buffer)
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      })
    }
  }

  // Convert to desired format
  let processedImage: sharp.Sharp
  switch (format) {
    case "webp":
      processedImage = image.webp({ quality })
      break
    case "jpeg":
      processedImage = image.jpeg({ quality, mozjpeg: true })
      break
    case "png":
      processedImage = image.png({ quality: Math.min(quality, 100) })
      break
    default:
      processedImage = image.webp({ quality })
  }

  // Process and save
  const processedBuffer = await processedImage.toBuffer()
  await writeFile(outputPath, processedBuffer)

  // Get final dimensions
  const finalMetadata = await sharp(processedBuffer).metadata()

  return {
    path: outputPath,
    size: processedBuffer.length,
    width: finalMetadata.width || metadata.width || 0,
    height: finalMetadata.height || metadata.height || 0,
  }
}

export async function generateThumbnail(
  buffer: Buffer,
  outputPath: string,
  size: number = 300
): Promise<{ path: string; size: number }> {
  // Ensure output directory exists
  const outputDir = join(outputPath, "..")
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const thumbnailBuffer = await sharp(buffer)
    .resize(size, size, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: 80 })
    .toBuffer()

  await writeFile(outputPath, thumbnailBuffer)

  return {
    path: outputPath,
    size: thumbnailBuffer.length,
  }
}

