/**
 * Groq AI Integration
 * Fast inference API with Llama models
 * Get your API key: https://console.groq.com/keys
 * 
 * Groq offers:
 * - Very fast inference (up to 10x faster than traditional APIs)
 * - High-quality Llama models
 * - Competitive pricing
 */

export function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null
}

/**
 * Generate text using Groq API
 * Uses Llama models for fast, high-quality text generation
 */
export async function generatePostGroq(
  prompt: string,
  tone: string = "casual"
): Promise<string> {
  const apiKey = getGroqApiKey()
  if (!apiKey) {
    throw new Error("Groq API key not configured")
  }

  const systemPrompt = `You are a social media content creator. Generate engaging posts based on user prompts. 
Tone: ${tone}
Keep posts concise, engaging, and appropriate for social media.`

  const fullPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}`

  try {
    // Try multiple Groq models in order of preference
    // llama-3.1-70b-versatile is the latest and most capable
    // llama-3.1-8b-instant is faster but less capable
    const models = [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-3-70b-8192",
      "mixtral-8x7b-32768"
    ]
    
    let lastError: any = null
    
    for (const model of models) {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "system",
                  content: systemPrompt,
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 500,
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
          if (response.status === 404 || errorData.error?.message?.includes("not found") || errorData.error?.message?.includes("does not exist")) {
            console.log(`Groq model ${model} not available, trying next...`)
            lastError = new Error(`Model ${model} not available: ${errorText}`)
            continue
          }
          
          // For other errors, throw immediately
          throw new Error(
            `Groq API error (${model}): ${response.status} - ${JSON.stringify(errorData)}`
          )
        }

        const data = await response.json()

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          return data.choices[0].message.content.trim()
        }

        throw new Error(`Invalid response from Groq API (${model})`)
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
    throw lastError || new Error("All Groq models failed")
  } catch (error: any) {
    console.error("Groq generation error:", error)
    // Provide more helpful error messages
    if (error.message?.includes("401") || error.message?.includes("Unauthorized") || error.message?.includes("Invalid API key")) {
      throw new Error("Groq API key is invalid. Please check your GROQ_API_KEY in .env file and get a new key from https://console.groq.com/keys")
    }
    if (error.message?.includes("429") || error.message?.includes("rate limit") || error.message?.includes("quota")) {
      throw new Error("Groq API rate limit exceeded. Please try again later or check your API usage at https://console.groq.com")
    }
    throw error
  }
}

/**
 * Generate comment reply using Groq
 */
export async function generateCommentReplyGroq(
  postContent: string,
  commentContext: string,
  tone: string = "friendly"
): Promise<string> {
  const apiKey = getGroqApiKey()
  if (!apiKey) {
    throw new Error("Groq API key not configured")
  }

  const prompt = `You are helping a user write a reply to a comment. 
Post content: ${postContent}
Comment: ${commentContext}
Tone: ${tone}
Generate a natural, appropriate reply.`

  try {
    const models = [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-3-70b-8192"
    ]
    
    let lastError: any = null
    
    for (const model of models) {
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 200,
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
          
          if (response.status === 404 || errorData.error?.message?.includes("not found") || errorData.error?.message?.includes("does not exist")) {
            console.log(`Groq model ${model} not available, trying next...`)
            lastError = new Error(`Model ${model} not available: ${errorText}`)
            continue
          }
          
          throw new Error(
            `Groq API error (${model}): ${response.status} - ${JSON.stringify(errorData)}`
          )
        }

        const data = await response.json()

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
          return data.choices[0].message.content.trim()
        }

        throw new Error(`Invalid response from Groq API (${model})`)
      } catch (modelError: any) {
        if (model === models[models.length - 1]) {
          throw modelError
        }
        lastError = modelError
        continue
      }
    }
    
    throw lastError || new Error("All Groq models failed")
  } catch (error: any) {
    console.error("Groq comment reply error:", error)
    throw error
  }
}


