import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { generatePost } from "@/lib/ai/openai"
import { generatePostGemini } from "@/lib/ai/gemini"
import { generatePostHuggingFace } from "@/lib/ai/huggingface"
import { generatePostGroq } from "@/lib/ai/groq"
import { z } from "zod"

// Load environment variables - Next.js should auto-load .env, but we ensure it here
// This runs at module load time to ensure env vars are available
let envLoaded = false
try {
  const path = require('path')
  const fs = require('fs')
  const dotenv = require('dotenv')
  
  const envPath = path.join(process.cwd(), '.env')
  const envLocalPath = path.join(process.cwd(), '.env.local')
  
  // Load .env.local first (Next.js priority), then .env
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath, override: false })
    envLoaded = true
  }
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false })
    envLoaded = true
  }
  
  // Also try default dotenv behavior
  if (!envLoaded) {
    dotenv.config()
  }
} catch (e) {
  // Silently fail - env vars might already be loaded by Next.js or server.js
}

const generatePostSchema = z.object({
  prompt: z.string().min(1).max(500),
  tone: z.enum(["professional", "casual", "funny"]).optional(),
})

export async function POST(request: Request) {
  try {
    // CRITICAL: Force load environment variables at the start of each request
    // This ensures they're available even if Next.js didn't load them
    const path = require('path')
    const fs = require('fs')
    const dotenv = require('dotenv')
    
    const envPath = path.join(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true })
    }
    
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, tone } = generatePostSchema.parse(body)
    
    // Check environment variables - use direct process.env access
    // Also try reading directly from file as fallback
    let geminiKey = process.env.GEMINI_API_KEY?.trim()
    let openaiKey = process.env.OPENAI_API_KEY?.trim()
    let huggingfaceKey = process.env.HUGGINGFACE_API_KEY?.trim()
    let groqKey = process.env.GROQ_API_KEY?.trim()
    
    // If not found in process.env, try reading from .env file directly as fallback
    if (!geminiKey || !huggingfaceKey || !openaiKey || !groqKey) {
      try {
        console.log("Env vars not found in process.env, reading .env file directly...")
        const envContent = fs.readFileSync(envPath, 'utf8')
        const lines = envContent.split('\n')
        
        for (const line of lines) {
          const trimmed = line.trim()
          // Skip comments and empty lines
          if (!trimmed || trimmed.startsWith('#')) continue
          
          if (trimmed.startsWith('GEMINI_API_KEY=') && !geminiKey) {
            const value = trimmed.split('=').slice(1).join('=').trim()
            geminiKey = value.replace(/^["']|["']$/g, '')
            process.env.GEMINI_API_KEY = geminiKey
            console.log("Loaded GEMINI_API_KEY from file")
          }
          if (trimmed.startsWith('HUGGINGFACE_API_KEY=') && !huggingfaceKey) {
            const value = trimmed.split('=').slice(1).join('=').trim()
            huggingfaceKey = value.replace(/^["']|["']$/g, '')
            process.env.HUGGINGFACE_API_KEY = huggingfaceKey
            console.log("Loaded HUGGINGFACE_API_KEY from file")
          }
          if (trimmed.startsWith('OPENAI_API_KEY=') && !openaiKey) {
            const value = trimmed.split('=').slice(1).join('=').trim()
            openaiKey = value.replace(/^["']|["']$/g, '')
            process.env.OPENAI_API_KEY = openaiKey
            console.log("Loaded OPENAI_API_KEY from file")
          }
          if (trimmed.startsWith('GROQ_API_KEY=') && !groqKey) {
            const value = trimmed.split('=').slice(1).join('=').trim()
            groqKey = value.replace(/^["']|["']$/g, '')
            process.env.GROQ_API_KEY = groqKey
            console.log("Loaded GROQ_API_KEY from file")
          }
        }
      } catch (fileError) {
        console.error("Could not read .env file directly:", fileError)
      }
    }
    
    const hasOpenAI = !!openaiKey && openaiKey.length > 0
    const hasGroq = !!groqKey && groqKey.length > 0
    const hasGemini = !!geminiKey && geminiKey.length > 0
    const hasHuggingFace = !!huggingfaceKey && huggingfaceKey.length > 0
    
    // Detailed logging for debugging
    console.log("=== AI Service Configuration Check ===")
    console.log("Environment variables check:", {
      OPENAI_API_KEY: hasOpenAI ? `✓ Found (${openaiKey.substring(0, 10)}...)` : "✗ NOT FOUND",
      GROQ_API_KEY: hasGroq ? `✓ Found (${groqKey.substring(0, 10)}...)` : "✗ NOT FOUND",
      GEMINI_API_KEY: hasGemini ? `✓ Found (${geminiKey.substring(0, 10)}...)` : "✗ NOT FOUND",
      HUGGINGFACE_API_KEY: hasHuggingFace ? `✓ Found (${huggingfaceKey.substring(0, 10)}...)` : "✗ NOT FOUND"
    })
    console.log("Service availability:", {
      OpenAI: hasOpenAI ? "✓ Configured" : "✗ Not configured",
      Groq: hasGroq ? "✓ Configured" : "✗ Not configured",
      Gemini: hasGemini ? "✓ Configured" : "✗ Not configured",
      HuggingFace: hasHuggingFace ? "✓ Configured" : "✗ Not configured"
    })
    console.log("All process.env keys containing 'API':", Object.keys(process.env).filter(k => k.includes('API')).join(', '))
    console.log("=======================================")

    let generatedPost: string

    // Try OpenAI first (if configured) - highest quality
    if (hasOpenAI) {
      try {
        console.log("=== Trying OpenAI ===")
        generatedPost = await generatePost(prompt, tone || "casual")
        console.log("✓ OpenAI success! Generated post length:", generatedPost.length)
        return NextResponse.json({ content: generatedPost })
      } catch (openaiError: any) {
        console.log("✗ OpenAI failed, trying alternatives...", openaiError.message)
        // Fall through to try alternatives
      }
    }

    // Try Groq (paid, but very fast and high quality)
    if (hasGroq && groqKey) {
      try {
        console.log("=== Trying Groq ===")
        console.log("Groq key available:", groqKey ? `Yes (${groqKey.substring(0, 10)}...)` : "No")
        
        // Ensure the key is set in process.env for the Groq function
        if (!process.env.GROQ_API_KEY) {
          process.env.GROQ_API_KEY = groqKey
        }
        
        generatedPost = await generatePostGroq(prompt, tone || "casual")
        console.log("✓ Groq success! Generated post length:", generatedPost.length)
        return NextResponse.json({ content: generatedPost })
      } catch (groqError: any) {
        console.error("✗ Groq failed!")
        console.error("Groq error message:", groqError.message)
        // If it's an API key error, don't try other services
        if (groqError.message?.includes("API key is invalid") || groqError.message?.includes("401")) {
          console.error("Groq API key error - stopping fallback attempts")
          throw groqError
        }
        console.log("Groq failed, will try free alternatives...")
        // Fall through to try free alternatives
      }
    }

    // Try Gemini (free alternative)
    if (hasGemini && geminiKey) {
      try {
        console.log("=== Trying Gemini ===")
        console.log("Gemini key available:", geminiKey ? `Yes (${geminiKey.substring(0, 10)}...)` : "No")
        console.log("Gemini key length:", geminiKey?.length || 0)
        
        // Ensure the key is set in process.env for the Gemini function
        if (!process.env.GEMINI_API_KEY) {
          process.env.GEMINI_API_KEY = geminiKey
          console.log("Set GEMINI_API_KEY in process.env")
        }
        
        console.log("Calling generatePostGemini...")
        generatedPost = await generatePostGemini(prompt, tone || "casual")
        console.log("✓ Gemini success! Generated post length:", generatedPost.length)
        return NextResponse.json({ content: generatedPost })
      } catch (geminiError: any) {
        console.error("✗ Gemini failed!")
        console.error("Gemini error message:", geminiError.message)
        console.error("Gemini error stack:", geminiError.stack?.substring(0, 500))
        console.error("Full Gemini error:", JSON.stringify({
          message: geminiError.message,
          name: geminiError.name,
          cause: geminiError.cause
        }, null, 2))
        // If it's an API key error, don't try other services
        if (geminiError.message?.includes("API key is invalid") || geminiError.message?.includes("401")) {
          console.error("Gemini API key error - stopping fallback attempts")
          throw geminiError
        }
        console.log("Gemini failed, will try HuggingFace as fallback...")
        // Fall through to try HuggingFace
      }
    } else if (hasGemini && !geminiKey) {
      console.error("⚠ Gemini detected but key is empty or undefined!")
    } else {
      console.log("ℹ Gemini not configured (hasGemini:", hasGemini, ", geminiKey:", !!geminiKey, ")")
    }

    // Try HuggingFace (free alternative)
    if (hasHuggingFace && huggingfaceKey) {
      try {
        console.log("Trying HuggingFace as fallback...")
        
        // Ensure the key is set in process.env for the HuggingFace function
        if (!process.env.HUGGINGFACE_API_KEY) {
          process.env.HUGGINGFACE_API_KEY = huggingfaceKey
        }
        
        generatedPost = await generatePostHuggingFace(prompt, tone || "casual")
        return NextResponse.json({ content: generatedPost })
      } catch (hfError: any) {
        console.error("HuggingFace failed:", hfError.message)
        console.error("HuggingFace error details:", {
          message: hfError.message,
          stack: hfError.stack?.substring(0, 200),
          fullError: JSON.stringify(hfError, Object.getOwnPropertyNames(hfError))
        })
        // If it's an API key error, don't try other services
        if (hfError.message?.includes("API key is invalid") || hfError.message?.includes("401")) {
          throw hfError
        }
        // Fall through to error
      }
    }

    // If all services failed or are not configured
    // Provide a more helpful error message based on what was detected
    let errorMessage = ""
    let detailedErrors: string[] = []
    
    if (hasGemini || hasHuggingFace || hasOpenAI || hasGroq) {
      // Services are configured but all failed
      errorMessage = `AI services are configured but all failed. 

Detected services:
${hasOpenAI ? "✓ OpenAI (configured but failed)" : "✗ OpenAI (not configured)"}
${hasGroq ? "✓ Groq (configured but failed)" : "✗ Groq (not configured)"}
${hasGemini ? "✓ Gemini (configured but failed)" : "✗ Gemini (not configured)"}
${hasHuggingFace ? "✓ HuggingFace (configured but failed)" : "✗ HuggingFace (not configured)"}

Common issues:
1. API keys may be invalid or expired - get new keys from:
   - Groq: https://console.groq.com/keys
   - Gemini: https://makersuite.google.com/app/apikey
   - HuggingFace: https://huggingface.co/settings/tokens
2. Check your internet connectivity
3. Check server console for detailed error messages
4. Some API keys may have been blocked if publicly exposed

See FREE_AI_KEYS_GUIDE.md for setup instructions.`
    } else {
      // No services configured at all
      errorMessage = `No AI service is configured. 

Quick Setup (Free):
1. Get a free Gemini API key: https://makersuite.google.com/app/apikey
2. Add to your .env file: GEMINI_API_KEY="your-key-here"
3. Restart your dev server: npm run dev

See FREE_AI_KEYS_GUIDE.md for detailed instructions.`
    }

    console.error("AI Configuration Error:", {
      OpenAI: hasOpenAI ? "✓" : "✗",
      Groq: hasGroq ? "✓" : "✗",
      Gemini: hasGemini ? "✓" : "✗",
      HuggingFace: hasHuggingFace ? "✓" : "✗",
      groqKeyLength: groqKey?.length || 0,
      geminiKeyLength: geminiKey?.length || 0,
      huggingfaceKeyLength: huggingfaceKey?.length || 0,
      message: hasGemini || hasHuggingFace || hasOpenAI || hasGroq ? "Services configured but all failed" : "No services are configured"
    })

    return NextResponse.json(
      { 
        error: errorMessage,
        requiresConfiguration: true,
        quickSetup: {
          gemini: "https://makersuite.google.com/app/apikey",
          guide: "See FREE_AI_KEYS_GUIDE.md"
        }
      },
      { status: 503 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("AI post generation error:", error)
    
    return NextResponse.json(
      { error: error.message || "Failed to generate post" },
      { status: 500 }
    )
  }
}

