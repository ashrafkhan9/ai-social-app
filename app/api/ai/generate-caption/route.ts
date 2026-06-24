import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { generateImageCaption } from "@/lib/ai/openai"
import { generateImageCaptionGemini } from "@/lib/ai/gemini"
import { generatePostGroq } from "@/lib/ai/groq"
import { z } from "zod"

const generateCaptionSchema = z.object({
  imageUrl: z.string().url(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { imageUrl } = generateCaptionSchema.parse(body)

    let caption: string

    // Try OpenAI first (if configured)
    if (process.env.OPENAI_API_KEY) {
      try {
        caption = await generateImageCaption(imageUrl)
        // Parse the response to extract caption
        const lines = caption.split("\n").filter((line) => line.trim())
        let generatedCaption = caption
        let altText = ""

        // Try to extract structured response
        if (lines.length > 1) {
          const captionMatch = caption.match(/[Cc]aption:?\s*(.+)/i)
          const altMatch = caption.match(/[Aa]lt[-\s]?[Tt]ext:?\s*(.+)/i)
          
          if (captionMatch) {
            generatedCaption = captionMatch[1].trim()
          }
          if (altMatch) {
            altText = altMatch[1].trim()
          }
        }

        return NextResponse.json({ 
          caption: generatedCaption,
          altText: altText || generatedCaption.substring(0, 100)
        })
      } catch (openaiError: any) {
        console.log("OpenAI failed, trying Gemini Vision...", openaiError.message)
        // Fall through to try Gemini
      }
    }

    // Try Gemini Vision (free alternative)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log("Trying Gemini Vision as fallback...")
        caption = await generateImageCaptionGemini(imageUrl)
        return NextResponse.json({ 
          caption: caption,
          altText: caption.substring(0, 100)
        })
      } catch (geminiError: any) {
        console.log("Gemini Vision also failed", geminiError.message)
        // Fall through to GROQ
      }
    }

    // Try GROQ as text-only fallback (generates generic caption)
    if (process.env.GROQ_API_KEY) {
      try {
        console.log("Trying GROQ for generic caption...")
        const genericPrompt = "Generate an engaging social media caption for an image post. Make it creative and suitable for any type of image."
        caption = await generatePostGroq(genericPrompt, "engaging")
        return NextResponse.json({ 
          caption: caption,
          altText: "User uploaded image",
          note: "Generated using GROQ (generic caption - no image analysis)"
        })
      } catch (groqError: any) {
        console.log("GROQ also failed", groqError.message)
        // Fall through to error
      }
    }

    // If all services failed or are not configured
    return NextResponse.json(
      { 
        error: "Image caption generation requires a vision-capable AI service. Please add GEMINI_API_KEY (free) or OPENAI_API_KEY (paid) to your .env file. GROQ_API_KEY can be used for generic captions. See FREE_AI_KEYS_GUIDE.md for setup instructions.",
        requiresConfiguration: true
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

    console.error("AI caption generation error:", error)
    
    return NextResponse.json(
      { error: error.message || "Failed to generate caption" },
      { status: 500 }
    )
  }
}

