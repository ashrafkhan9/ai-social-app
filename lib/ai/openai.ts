import OpenAI from "openai"
import { generatePostGemini, generateImageCaptionGemini, generateCommentReplyGemini } from "./gemini"
import { generatePostHuggingFace, generateCommentReplyHuggingFace } from "./huggingface"
import { generatePostGroq, generateCommentReplyGroq } from "./groq"

let openaiClient: OpenAI | null = null

export function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured")
    return null
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  return openaiClient
}

export async function generatePost(prompt: string, tone: string = "casual") {
  const client = getOpenAIClient()
  if (!client) {
    throw new Error("OpenAI client not configured")
  }

  const systemPrompt = `You are a social media content creator. Generate engaging posts based on user prompts. 
  Tone: ${tone}
  Keep posts concise, engaging, and appropriate for social media.`

  // Use gpt-3.5-turbo as default (available on free tier)
  // Try gpt-3.5-turbo first, then gpt-4o if available
  const models = ["gpt-3.5-turbo", "gpt-4o"]
  
  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      })

      return response.choices[0]?.message?.content || ""
    } catch (error: any) {
      // Log the full error for debugging
      console.error(`OpenAI API Error (model: ${model}):`, {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type
      })
      
      // If quota exceeded or rate limited, try alternatives
      if (error.message?.includes("quota") || error.message?.includes("429") || error.message?.includes("exceeded") || error.status === 429) {
        console.log("OpenAI quota exceeded, trying alternatives...")
        
        // Try Groq first (paid but very fast and high quality)
        try {
          if (process.env.GROQ_API_KEY) {
            console.log("Trying Groq as fallback...")
            return await generatePostGroq(prompt, tone)
          }
        } catch (groqError) {
          console.log("Groq failed, trying Gemini...")
        }
        
        // Try Gemini (free, good quality)
        try {
          if (process.env.GEMINI_API_KEY) {
            console.log("Trying Gemini as fallback...")
            return await generatePostGemini(prompt, tone)
          }
        } catch (geminiError) {
          console.log("Gemini failed, trying HuggingFace...")
        }
        
        // Try HuggingFace as fallback (free)
        try {
          if (process.env.HUGGINGFACE_API_KEY) {
            console.log("Trying HuggingFace as fallback...")
            return await generatePostHuggingFace(prompt, tone)
          }
        } catch (hfError) {
          console.log("HuggingFace also failed")
        }
        
        // If all fail, throw the original OpenAI error
        const detailedError = new Error(error.message || "Quota exceeded and no alternatives available")
        ;(detailedError as any).status = error.status
        ;(detailedError as any).code = error.code
        throw detailedError
      }
      // If this model doesn't exist or no access, try the next one
      if (error.message?.includes("does not exist") || error.message?.includes("access")) {
        console.log(`Model ${model} not available, trying next...`)
        continue
      }
      // For other errors (including rate limits), throw immediately
      throw error
    }
  }
  
  throw new Error("No available OpenAI models. Please check your API key and account access.")
}

export async function generateImageCaption(imageUrl: string) {
  const client = getOpenAIClient()
  if (!client) {
    throw new Error("OpenAI client not configured")
  }

  // Vision models (gpt-4o, gpt-4-turbo) are typically not available on free tier
  // Try available models, but gracefully handle if none are available
  const visionModels = ["gpt-4o", "gpt-4-turbo", "gpt-4-vision-preview"]
  
  for (const model of visionModels) {
    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate a concise, engaging caption for this image suitable for social media. Keep it under 200 characters. Format: Just the caption text, no labels or prefixes.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 300,
      })

      return response.choices[0]?.message?.content || ""
    } catch (error: any) {
      // If quota exceeded, try Gemini Vision (free alternative)
      if (error.message?.includes("quota") || error.message?.includes("429") || error.message?.includes("exceeded") || error.status === 429) {
        console.log("OpenAI quota exceeded, trying Gemini Vision as fallback...")
        try {
          if (process.env.GEMINI_API_KEY) {
            return await generateImageCaptionGemini(imageUrl)
          }
        } catch (geminiError) {
          console.log("Gemini Vision also failed")
        }
      }
      
      // If this model fails, try the next one
      if (error.message?.includes("does not exist") || error.message?.includes("access") || error.message?.includes("rate limit")) {
        console.log(`Vision model ${model} not available, trying next...`)
        continue
      }
      // For other errors, throw immediately
      throw error
    }
  }
  
  // If no vision models are available, try Gemini Vision as last resort
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("Trying Gemini Vision as fallback...")
      return await generateImageCaptionGemini(imageUrl)
    } catch (error) {
      console.log("Gemini Vision failed")
    }
  }
  
  // If all fail, throw a helpful error
  throw new Error("Image caption generation requires a vision-capable model. Please configure GEMINI_API_KEY (free) or upgrade your OpenAI account.")
}

export async function moderateContent(content: string) {
  const client = getOpenAIClient()
  if (!client) {
    return { flagged: false, categories: {} }
  }

  try {
    const response = await client.moderations.create({
      input: content,
    })

    return {
      flagged: response.results[0]?.flagged || false,
      categories: response.results[0]?.categories || {},
      scores: response.results[0]?.category_scores || {},
    }
  } catch (error) {
    console.error("Content moderation error:", error)
    return { flagged: false, categories: {} }
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient()
  if (!client) {
    throw new Error("OpenAI client not configured")
  }

  const response = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  })

  return response.data[0]?.embedding || []
}

export async function generateCommentReply(
  postContent: string,
  commentContext: string,
  tone: string = "friendly"
) {
  const client = getOpenAIClient()
  if (!client) {
    throw new Error("OpenAI client not configured")
  }

  const systemPrompt = `You are helping a user write a reply to a comment. 
  Post content: ${postContent}
  Comment: ${commentContext}
  Tone: ${tone}
  Generate a natural, appropriate reply.`

  // Use gpt-3.5-turbo as default (available on free tier)
  const models = ["gpt-3.5-turbo", "gpt-4o"]
  
  for (const model of models) {
    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate a reply" },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })

      return response.choices[0]?.message?.content || ""
    } catch (error: any) {
      // If quota exceeded, try alternatives
      if (error.message?.includes("quota") || error.message?.includes("429") || error.message?.includes("exceeded") || error.status === 429) {
        console.log("OpenAI quota exceeded, trying alternatives...")
        
        // Try Groq first (paid but very fast)
        try {
          if (process.env.GROQ_API_KEY) {
            console.log("Trying Groq as fallback...")
            return await generateCommentReplyGroq(postContent, commentContext, tone)
          }
        } catch (groqError) {
          console.log("Groq failed, trying Gemini...")
        }
        
        // Try Gemini (free)
        try {
          if (process.env.GEMINI_API_KEY) {
            return await generateCommentReplyGemini(postContent, commentContext, tone)
          }
        } catch (geminiError) {
          console.log("Gemini failed, trying HuggingFace...")
        }
        
        // Try HuggingFace (free)
        try {
          if (process.env.HUGGINGFACE_API_KEY) {
            return await generateCommentReplyHuggingFace(postContent, commentContext, tone)
          }
        } catch (hfError) {
          console.log("HuggingFace also failed")
        }
        
        throw error
      }
      
      // If this model fails, try the next one
      if (error.message?.includes("does not exist") || error.message?.includes("access") || error.message?.includes("rate limit")) {
        console.log(`Model ${model} not available, trying next...`)
        continue
      }
      // For other errors, throw immediately
      throw error
    }
  }
  
  throw new Error("No available OpenAI models. Please check your API key and account access.")
}

