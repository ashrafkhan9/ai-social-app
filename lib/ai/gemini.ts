/**
 * Google Gemini AI Integration
 * Free tier available at: https://makersuite.google.com/app/apikey
 * 
 * Get your free API key:
 * 1. Go to https://makersuite.google.com/app/apikey
 * 2. Sign in with your Google account
 * 3. Click "Create API Key"
 * 4. Copy the key and add GEMINI_API_KEY to your .env file
 * 
 * Free tier includes:
 * - 60 requests per minute
 * - Generous monthly quota
 */

export function getGeminiApiKey(): string | null {
  return process.env.GEMINI_API_KEY || null
}

/**
 * Generate text using Google Gemini
 */
export async function generatePostGemini(
  prompt: string,
  tone: string = "casual"
): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error("Gemini API key not configured")
  }

  const systemPrompt = `You are a social media content creator. Generate engaging posts based on user prompts. 
Tone: ${tone}
Keep posts concise, engaging, and appropriate for social media.`

  const fullPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`

  try {
    // Use the latest Gemini 1.5 Flash model (faster and free tier)
    // Fallback to gemini-pro if 1.5-flash is not available
    const models = ["gemini-1.5-flash", "gemini-pro"]
    let lastError: any = null
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: fullPrompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
              },
            }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          // If it's a model not found error, try the next model
          if (response.status === 404 || errorData.error?.message?.includes("not found")) {
            console.log(`Model ${model} not available, trying next...`)
            lastError = new Error(`Model ${model} not available: ${errorText}`)
            continue
          }
          
          // For other errors, throw immediately
          throw new Error(
            `Gemini API error (${model}): ${response.status} - ${JSON.stringify(errorData)}`
          )
        }

        const data = await response.json()

        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0]
        ) {
          return data.candidates[0].content.parts[0].text.trim()
        }

        throw new Error(`Invalid response from Gemini API (${model})`)
      } catch (modelError: any) {
        // If this is the last model, throw the error
        if (model === models[models.length - 1]) {
          throw modelError
        }
        // Otherwise, try the next model
        lastError = modelError
        continue
      }
    }
    
    // If we get here, all models failed
    throw lastError || new Error("All Gemini models failed")
  } catch (error: any) {
    console.error("Gemini generation error:", error)
    // Provide more helpful error messages
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) {
      throw new Error("Gemini API key is invalid. Please check your GEMINI_API_KEY in .env file and get a new key from https://makersuite.google.com/app/apikey")
    }
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Gemini API quota exceeded. Please try again later or check your API usage at https://makersuite.google.com/app/apikey")
    }
    throw error
  }
}

/**
 * Generate image caption using Gemini Vision
 */
export async function generateImageCaptionGemini(
  imageUrl: string
): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error("Gemini API key not configured")
  }

  try {
    // Fetch the image as base64
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString("base64")
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

    // Use gemini-1.5-flash which supports vision, fallback to gemini-pro-vision
    const models = ["gemini-1.5-flash", "gemini-pro-vision"]
    let lastError: any = null
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Generate a concise, engaging caption for this image suitable for social media. Keep it under 200 characters. Format: Just the caption text, no labels or prefixes.",
                    },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: imageBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 300,
              },
            }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          if (response.status === 404 || errorData.error?.message?.includes("not found")) {
            console.log(`Vision model ${model} not available, trying next...`)
            lastError = new Error(`Model ${model} not available: ${errorText}`)
            continue
          }
          
          throw new Error(
            `Gemini Vision API error (${model}): ${response.status} - ${JSON.stringify(errorData)}`
          )
        }

        const data = await response.json()

        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0]
        ) {
          return data.candidates[0].content.parts[0].text.trim()
        }

        throw new Error(`Invalid response from Gemini Vision API (${model})`)
      } catch (modelError: any) {
        if (model === models[models.length - 1]) {
          throw modelError
        }
        lastError = modelError
        continue
      }
    }
    
    throw lastError || new Error("All Gemini vision models failed")
  } catch (error: any) {
    console.error("Gemini image caption error:", error)
    if (error.message?.includes("API_KEY_INVALID") || error.message?.includes("401")) {
      throw new Error("Gemini API key is invalid. Please check your GEMINI_API_KEY in .env file")
    }
    throw error
  }
}

/**
 * Generate comment reply using Gemini
 */
export async function generateCommentReplyGemini(
  postContent: string,
  commentContext: string,
  tone: string = "friendly"
): Promise<string> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error("Gemini API key not configured")
  }

  const prompt = `You are helping a user write a reply to a comment. 
Post content: ${postContent}
Comment: ${commentContext}
Tone: ${tone}
Generate a natural, appropriate reply.`

  try {
    // Use the latest Gemini 1.5 Flash model
    const models = ["gemini-1.5-flash", "gemini-pro"]
    let lastError: any = null
    
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
              },
            }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          let errorData: any = {}
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { error: errorText }
          }
          
          if (response.status === 404 || errorData.error?.message?.includes("not found")) {
            console.log(`Model ${model} not available, trying next...`)
            lastError = new Error(`Model ${model} not available: ${errorText}`)
            continue
          }
          
          throw new Error(
            `Gemini API error (${model}): ${response.status} - ${JSON.stringify(errorData)}`
          )
        }

        const data = await response.json()

        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0]
        ) {
          return data.candidates[0].content.parts[0].text.trim()
        }

        throw new Error(`Invalid response from Gemini API (${model})`)
      } catch (modelError: any) {
        if (model === models[models.length - 1]) {
          throw modelError
        }
        lastError = modelError
        continue
      }
    }
    
    throw lastError || new Error("All Gemini models failed")
  } catch (error: any) {
    console.error("Gemini comment reply error:", error)
    throw error
  }
}


