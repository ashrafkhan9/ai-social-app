/**
 * HuggingFace AI Integration
 * Free tier available at: https://huggingface.co/settings/tokens
 * 
 * Get your free API token:
 * 1. Sign up at https://huggingface.co
 * 2. Go to Settings > Access Tokens
 * 3. Create a new token (read permission is enough)
 * 4. Add HUGGINGFACE_API_KEY to your .env file
 */

interface HuggingFaceResponse {
  generated_text: string
}

export function getHuggingFaceToken(): string | null {
  return process.env.HUGGINGFACE_API_KEY || null
}

/**
 * Generate text using HuggingFace's free models
 * Uses meta-llama/Llama-2-7b-chat-hf or other free models
 */
export async function generatePostHuggingFace(
  prompt: string,
  tone: string = "casual"
): Promise<string> {
  const token = getHuggingFaceToken()
  if (!token) {
    throw new Error("HuggingFace API key not configured")
  }

  const systemPrompt = `You are a social media content creator. Generate engaging posts based on user prompts. 
Tone: ${tone}
Keep posts concise, engaging, and appropriate for social media.`

  const fullPrompt = `${systemPrompt}\n\nUser prompt: ${prompt}\n\nPost:`

  try {
    // Try using free text generation models that are known to work
    // Use models that are publicly available and don't require special access
    const models = [
      "gpt2",
      "distilgpt2", 
      "EleutherAI/gpt-neo-125M",
    ]
    
    let lastError: any = null
    
    for (let i = 0; i < models.length; i++) {
      const model = models[i]
      try {
        // Use the new HuggingFace Router API endpoint (api-inference is deprecated)
        const baseUrl = "https://router.huggingface.co/models"
        
        // Construct the full URL
        const url = `${baseUrl}/${model}`
        console.log(`Trying HuggingFace model: ${model} at ${url}`)
        
        const response = await fetch(
          url,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: fullPrompt,
              parameters: {
                max_new_tokens: 200,
                temperature: 0.7,
                return_full_text: false,
              },
            }),
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          
          // If we get a 410 error saying to use router, switch to router endpoint
          if (response.status === 410 && errorText.includes("router.huggingface.co")) {
            console.log(`Received 410 error, switching to router endpoint for model ${model}`)
            // Try with router endpoint
            const routerUrl = `https://router.huggingface.co/models/${model}`
            const routerResponse = await fetch(
              routerUrl,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  inputs: fullPrompt,
                  parameters: {
                    max_new_tokens: 200,
                    temperature: 0.7,
                    return_full_text: false,
                  },
                }),
              }
            )
            
            if (!routerResponse.ok) {
              const routerErrorText = await routerResponse.text()
              lastError = new Error(`HuggingFace Router API error (${model}): ${routerResponse.status} - ${routerErrorText}`)
              continue
            }
            
            const routerData: any = await routerResponse.json()
            if (Array.isArray(routerData) && routerData.length > 0) {
              if (routerData[0].generated_text) {
                return routerData[0].generated_text.trim()
              }
              if (typeof routerData[0] === 'string') {
                return routerData[0].trim()
              }
            }
            if (typeof routerData === 'object' && routerData.generated_text) {
              return routerData.generated_text.trim()
            }
          }
          
          // If model is loading, wait a bit and retry
          if (response.status === 503 && errorText.includes("loading")) {
            console.log(`Model ${model} is loading, waiting 5 seconds...`)
            await new Promise(resolve => setTimeout(resolve, 5000))
            // Retry once
            const retryResponse = await fetch(
              `${baseUrl}/${model}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                  inputs: fullPrompt,
                  parameters: {
                    max_new_tokens: 200,
                    temperature: 0.7,
                    return_full_text: false,
                  },
                }),
              }
            )
            
            if (!retryResponse.ok) {
              const retryErrorText = await retryResponse.text()
              lastError = new Error(`HuggingFace API error (${model}): ${retryResponse.status} - ${retryErrorText}`)
              continue
            }
            
            const retryData: HuggingFaceResponse[] = await retryResponse.json()
            if (Array.isArray(retryData) && retryData.length > 0 && retryData[0].generated_text) {
              return retryData[0].generated_text.trim()
            }
          }
          
          // For other errors, try next model
          lastError = new Error(`HuggingFace API error (${model}): ${response.status} - ${errorText}`)
          continue
        }

        const data: any = await response.json()
        
        // HuggingFace can return either an array or a single object
        if (Array.isArray(data) && data.length > 0) {
          // Check for generated_text in the first element
          if (data[0].generated_text) {
            return data[0].generated_text.trim()
          }
          // Some models return the text directly in the array
          if (typeof data[0] === 'string') {
            return data[0].trim()
          }
        }
        
        // If response format is a single object
        if (typeof data === 'object' && data !== null) {
          if (data.generated_text) {
            return data.generated_text.trim()
          }
          // Some models return text directly
          if (typeof data.text === 'string') {
            return data.text.trim()
          }
        }

        // Try next model
        lastError = new Error(`Invalid response format from HuggingFace (${model})`)
        continue
      } catch (modelError: any) {
        // If this is the last model, throw the error
        if (i === models.length - 1) {
          throw modelError
        }
        lastError = modelError
        continue
      }
    }
    
    // If all models failed, throw the last error
    throw lastError || new Error("All HuggingFace models failed")
  } catch (error: any) {
    console.error("HuggingFace generation error:", error)
    // Provide more helpful error messages
    if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
      throw new Error("HuggingFace API key is invalid. Please check your HUGGINGFACE_API_KEY in .env file and get a new token from https://huggingface.co/settings/tokens")
    }
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      throw new Error("HuggingFace API rate limit exceeded. Please try again later.")
    }
    throw error
  }
}


/**
 * Generate comment reply using HuggingFace
 */
export async function generateCommentReplyHuggingFace(
  postContent: string,
  commentContext: string,
  tone: string = "friendly"
): Promise<string> {
  const token = getHuggingFaceToken()
  if (!token) {
    throw new Error("HuggingFace API key not configured")
  }

  const prompt = `Post: ${postContent}\nComment: ${commentContext}\nReply (${tone} tone):`

  return generatePostHuggingFace(prompt, tone)
}


