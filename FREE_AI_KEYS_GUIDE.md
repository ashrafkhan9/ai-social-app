# 🆓 Free AI API Keys Guide

This guide shows you how to get **free** API keys for AI features in your social media platform.

## 🎯 Available Free AI Services

### 1. **Google Gemini** (Recommended - Best Free Option)
- ✅ **Free tier**: 60 requests/minute, generous monthly quota
- ✅ **Supports**: Text generation, image captioning (vision)
- ✅ **Quality**: Excellent, comparable to GPT-3.5
- ✅ **Setup time**: 2 minutes

**Get your free API key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key
5. Add to your `.env` file:
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```

**Why Gemini?**
- Best free option for quality
- Supports both text and vision
- No credit card required
- Generous free limits

---

### 2. **HuggingFace** (Free, Open Source Models)
- ✅ **Free tier**: Unlimited requests (with rate limits)
- ✅ **Supports**: Text generation
- ⚠️ **Quality**: Good for basic tasks, may vary by model
- ✅ **Setup time**: 3 minutes

**Get your free API token:**
1. Sign up at https://huggingface.co
2. Go to **Settings** → **Access Tokens**
3. Click **"New token"**
4. Name it (e.g., "Social Platform")
5. Select **"Read"** permission (enough for inference)
6. Copy the token
7. Add to your `.env` file:
   ```env
   HUGGINGFACE_API_KEY="your-token-here"
   ```

**Why HuggingFace?**
- Completely free
- No credit card required
- Open source models
- Good fallback option

---

## 🔄 How It Works

The app automatically uses **free alternatives** when OpenAI quota is exceeded:

1. **Primary**: Tries OpenAI (if configured)
2. **Fallback 1**: Tries Gemini (if `GEMINI_API_KEY` is set)
3. **Fallback 2**: Tries HuggingFace (if `HUGGINGFACE_API_KEY` is set)

This means your app will **keep working** even if OpenAI quota is exceeded!

## 📝 Setup Instructions

### Quick Setup (Recommended)

1. **Get Gemini API Key** (best option):
   ```bash
   # Visit: https://makersuite.google.com/app/apikey
   # Copy your key and add to .env:
   GEMINI_API_KEY="your-gemini-key"
   ```

2. **Get HuggingFace Token** (optional backup):
   ```bash
   # Visit: https://huggingface.co/settings/tokens
   # Copy your token and add to .env:
   HUGGINGFACE_API_KEY="your-hf-token"
   ```

3. **Restart your server**:
   ```bash
   npm run dev
   ```

### Your `.env` file should look like:

```env
# AI Services (use free alternatives!)
OPENAI_API_KEY=""  # Optional - will use free alternatives if quota exceeded
GEMINI_API_KEY="your-gemini-key"  # Recommended - free tier
HUGGINGFACE_API_KEY="your-hf-token"  # Optional - free backup
```

## 🎨 Features Supported

### ✅ Text Generation (Post Suggestions)
- **Gemini**: ✅ Excellent quality
- **HuggingFace**: ✅ Good quality
- **OpenAI**: ✅ Best quality (if quota available)

### ✅ Image Captioning
- **Gemini Vision**: ✅ Free and excellent
- **OpenAI Vision**: ✅ Best quality (requires paid tier)

### ✅ Comment Replies
- **Gemini**: ✅ Excellent quality
- **HuggingFace**: ✅ Good quality
- **OpenAI**: ✅ Best quality (if quota available)

## 💡 Tips

1. **Start with Gemini** - It's the best free option
2. **Add HuggingFace as backup** - For redundancy
3. **Keep OpenAI key** - Will use it when quota resets
4. **Monitor usage** - Check your API dashboards occasionally

## 🚨 Troubleshooting

### "API key not configured" error
- Make sure you added the key to `.env`
- Restart your dev server after adding keys
- Check for typos in the key

### "Quota exceeded" still showing
- The app will automatically try free alternatives
- Make sure `GEMINI_API_KEY` or `HUGGINGFACE_API_KEY` is set
- Check server console for fallback attempts

### Gemini not working
- Verify your API key is correct
- Check https://makersuite.google.com/app/apikey for key status
- Make sure you're using the correct API endpoint

### HuggingFace not working
- Verify your token has "Read" permission
- Some models may be slow to load (first request)
- Try a different model if one fails

## 📊 Comparison

| Feature | OpenAI | Gemini (Free) | HuggingFace (Free) |
|---------|--------|--------------|-------------------|
| Text Generation | ✅ Excellent | ✅ Excellent | ✅ Good |
| Image Captioning | ✅ Excellent | ✅ Excellent | ❌ Limited |
| Free Tier | ⚠️ Limited | ✅ Generous | ✅ Unlimited |
| Setup Time | 2 min | 2 min | 3 min |
| Credit Card | ❌ Not needed | ❌ Not needed | ❌ Not needed |

## 🎉 You're All Set!

Once you add the free API keys, your app will:
- ✅ Work even when OpenAI quota is exceeded
- ✅ Automatically use the best available service
- ✅ Provide seamless AI features to users
- ✅ Cost you **$0** to run!

Happy coding! 🚀

