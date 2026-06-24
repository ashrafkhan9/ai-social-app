import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"

export { dynamic, runtime } from "@/lib/route-config"

/**
 * Debug endpoint to check which AI services are configured
 * This helps users understand what API keys they need to add
 */
export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = {
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        keyLength: process.env.OPENAI_API_KEY?.length || 0,
      },
      groq: {
        configured: !!process.env.GROQ_API_KEY,
        keyLength: process.env.GROQ_API_KEY?.length || 0,
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        keyLength: process.env.GEMINI_API_KEY?.length || 0,
      },
      huggingface: {
        configured: !!process.env.HUGGINGFACE_API_KEY,
        keyLength: process.env.HUGGINGFACE_API_KEY?.length || 0,
      },
    }

    const hasAnyService = config.openai.configured || config.groq.configured || config.gemini.configured || config.huggingface.configured

    return NextResponse.json({
      configured: hasAnyService,
      services: config,
      recommendations: !hasAnyService
        ? {
            message: "No AI services are configured. Add at least one free API key:",
            steps: [
              "1. Get a free Gemini API key: https://makersuite.google.com/app/apikey",
              "2. Add GEMINI_API_KEY to your .env file",
              "3. Restart your dev server: npm run dev",
              "See FREE_AI_KEYS_GUIDE.md for detailed instructions",
            ],
          }
        : null,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to check configuration" },
      { status: 500 }
    )
  }
}


