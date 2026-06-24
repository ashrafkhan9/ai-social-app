import sharp from "sharp"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, "../public/icons")
const svgPath = join(iconsDir, "logo.svg")

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]

const svgBuffer = readFileSync(svgPath)

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, `icon-${size}x${size}.png`))
  console.log(`✅ icon-${size}x${size}.png`)
}

console.log("🎉 All icons generated!")
