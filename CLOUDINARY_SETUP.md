# Cloudinary Setup Guide

This guide will help you set up Cloudinary for storing images and videos in the cloud.

## 📋 Prerequisites

1. A Cloudinary account (sign up at [cloudinary.com](https://cloudinary.com) - free tier available)
2. Your Cloudinary credentials (Cloud Name, API Key, API Secret)

## 🔑 Getting Your Cloudinary Credentials

1. Sign in to your [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Go to the Dashboard section
3. You'll find your credentials:
   - **Cloud Name**: Your cloud name (e.g., `my-cloud-name`)
   - **API Key**: Your API key
   - **API Secret**: Your API secret (keep this secure!)

## ⚙️ Environment Variables

You can configure Cloudinary in two ways:

### Option 1: Using Cloudinary URL (Recommended)
Add this to your `.env` file:

```env
# Cloudinary Configuration (URL format)
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
```

**Example:**
```env
CLOUDINARY_URL=cloudinary://271571744697796:1ALEw2Ess2_nt92mianI79DAW-k@dnnesad9z
```

### Option 2: Using Individual Variables
Alternatively, you can use separate environment variables:

```env
# Cloudinary Configuration (Individual variables)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Note:** If you provide `CLOUDINARY_URL`, it will be used. Otherwise, the individual variables will be used.

## 📁 Folder Structure

Cloudinary will organize your files in the following folders:

- **Images**: `social-platform/images/`
- **Image Thumbnails**: `social-platform/images/thumbnails/`
- **Videos**: `social-platform/videos/`

## ✨ Features

### Image Upload
- Automatic optimization (max 1920x1920px)
- WebP format conversion for better compression
- Automatic thumbnail generation (300x300px)
- Quality optimization (85% default)

### Video Upload
- Automatic video optimization
- Automatic thumbnail generation (640x360px)
- Format optimization
- Max file size: 100MB

## 🔄 Migration from Local Storage

If you were previously using local file storage, you'll need to:

1. Upload existing files to Cloudinary
2. Update database URLs to point to Cloudinary URLs
3. Remove local upload files (optional)

## 🧪 Testing

After setting up Cloudinary:

1. Try uploading an image - it should appear in your Cloudinary dashboard
2. Check that thumbnails are generated automatically
3. Verify videos upload and generate thumbnails

## 💡 Tips

- **Free Tier**: Cloudinary offers a generous free tier (25GB storage, 25GB bandwidth/month)
- **Transformations**: Cloudinary automatically optimizes images and videos
- **CDN**: All assets are served via Cloudinary's global CDN for fast delivery
- **Security**: Never commit your API secret to version control

## 🐛 Troubleshooting

### Upload Fails
- Check that all environment variables are set correctly
- Verify your API key and secret are correct
- Check Cloudinary dashboard for any account limits

### Images Not Displaying
- Verify the URLs are correct (should start with `https://res.cloudinary.com/`)
- Check browser console for CORS errors
- Ensure your Cloudinary account is active

### Thumbnails Not Generating
- For videos, thumbnails are generated automatically by Cloudinary
- For images, thumbnails are created during upload
- Check Cloudinary dashboard to see if files were uploaded successfully

## 📚 Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Image Transformations](https://cloudinary.com/documentation/image_transformations)

