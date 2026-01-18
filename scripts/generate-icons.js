// Simple script to generate placeholder PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs')
const path = require('path')

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// SVG template for icon
const iconSvg = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">AI</text>
</svg>
`

// Sizes needed
const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]

console.log('Generating placeholder icons...')

sizes.forEach(size => {
  const svg = iconSvg(size)
  const filePath = path.join(iconsDir, `icon-${size}x${size}.svg`)
  fs.writeFileSync(filePath, svg)
  console.log(`Created: icon-${size}x${size}.svg`)
})

console.log('\nNote: These are SVG placeholders. For production, convert them to PNG using:')
console.log('1. Online: https://cloudconvert.com/svg-to-png')
console.log('2. Or use ImageMagick: convert icon-192x192.svg icon-192x192.png')
console.log('\nFor best results, create proper icons from a design tool.')

