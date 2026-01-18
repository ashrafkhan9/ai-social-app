# 🚀 Quick AI Setup Guide

## The Problem
You're seeing: "No AI service is configured" because you need to add at least one AI API key to your `.env` file.

## ✅ Solution: Add Free Gemini API Key (2 minutes)

### Step 1: Get Your Free API Key
1. **Visit**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click** "Create API Key" button
4. **Copy** the API key (it will look like: `AIzaSy...`)

### Step 2: Add to Your .env File
1. **Open** your `.env` file in the project root (`C:\Users\hp\ai-social-platefrom\.env`)
2. **Add** this line (replace `your-api-key-here` with the key you copied):
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```
   
   **Important**: 
   - Keep the quotes around the key
   - Make sure there are no spaces around the `=`
   - The key should be on a single line

### Step 3: Restart Your Server
1. **Stop** your current dev server (press `Ctrl+C` in the terminal)
2. **Start** it again:
   ```bash
   npm run dev
   ```

### Step 4: Test It
1. Go to your app: http://localhost:3000
2. Try creating a post and click "AI Suggestions"
3. Enter a prompt and click "Generate"
4. It should work now! 🎉

## 🔍 Verify Your Setup

After adding the key, you can check if it's detected by looking at your server console. You should see:
```
AI Service Availability: {
  OpenAI: '✗ Not configured',
  Gemini: '✓ Configured',
  HuggingFace: '✗ Not configured'
}
```

Or visit: `http://localhost:3000/api/ai/check-config` (while logged in)

## ❓ Troubleshooting

### "Still getting the error after adding the key?"
1. **Check** the `.env` file is in the project root (same folder as `package.json`)
2. **Verify** the key format: `GEMINI_API_KEY="your-key-here"` (with quotes)
3. **Make sure** you restarted the server after adding the key
4. **Check** there are no extra spaces or typos

### "Where is my .env file?"
- It should be at: `C:\Users\hp\ai-social-platefrom\.env`
- If it doesn't exist, create it in the project root folder

### "I don't see the key in server logs?"
- Make sure the `.env` file is saved
- Restart the server completely (stop and start again)
- Check for typos in the variable name: `GEMINI_API_KEY` (not `GEMINI_KEY` or `GEMINI_API`)

## 📚 More Options

See `FREE_AI_KEYS_GUIDE.md` for:
- HuggingFace setup (also free)
- OpenAI setup (paid, but has free tier)
- Detailed explanations of each service

