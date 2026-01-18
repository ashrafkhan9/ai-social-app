import { NextResponse } from "next/server"

/**
 * Test endpoint to check if environment variables are accessible
 * Visit: http://localhost:3000/api/ai/test-env
 */
export async function GET() {
  // Try loading dotenv
  let dotenvLoaded = false
  try {
    require('dotenv').config()
    dotenvLoaded = true
  } catch (e) {
    console.error("Failed to load dotenv:", e)
  }

  const envVars = {
    // Check if keys exist (without showing full values)
    OPENAI_API_KEY: {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      preview: process.env.OPENAI_API_KEY?.substring(0, 10) + "..." || "N/A"
    },
    GEMINI_API_KEY: {
      exists: !!process.env.GEMINI_API_KEY,
      length: process.env.GEMINI_API_KEY?.length || 0,
      preview: process.env.GEMINI_API_KEY?.substring(0, 10) + "..." || "N/A"
    },
    HUGGINGFACE_API_KEY: {
      exists: !!process.env.HUGGINGFACE_API_KEY,
      length: process.env.HUGGINGFACE_API_KEY?.length || 0,
      preview: process.env.HUGGINGFACE_API_KEY?.substring(0, 10) + "..." || "N/A"
    }
  }

  return NextResponse.json({
    dotenvLoaded,
    nodeEnv: process.env.NODE_ENV,
    envVars,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('API_KEY') || k.includes('GEMINI') || k.includes('OPENAI') || k.includes('HUGGINGFACE')),
    message: "Check if your API keys are accessible. If 'exists' is false, the keys aren't being loaded."
  })
}




