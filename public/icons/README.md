# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-180x180.png (for iOS)
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Generating Icons

You can generate these icons from a single source image (recommended: 512x512px) using:

1. **Online tools:**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://favicon.io/

2. **Command line (using ImageMagick):**
   ```bash
   convert source-icon.png -resize 72x72 icon-72x72.png
   convert source-icon.png -resize 96x96 icon-96x96.png
   # ... repeat for all sizes
   ```

3. **Create a simple placeholder:**
   For now, you can create a simple colored square with text as a placeholder icon.

## Icon Design Tips

- Use a simple, recognizable design
- Ensure good contrast
- Test on different backgrounds
- Make sure it looks good at small sizes
- Use maskable icons for better Android support

