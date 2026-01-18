/**
 * Extract hashtags from text content
 * Returns array of unique hashtag names (without #)
 */
export function extractHashtags(text: string): string[] {
  if (!text) return []

  // Match hashtags: #word (alphanumeric and underscores)
  const hashtagRegex = /#(\w+)/g
  const matches = text.matchAll(hashtagRegex)
  
  const hashtags = Array.from(matches, (match) => match[1].toLowerCase())
  
  // Remove duplicates
  return [...new Set(hashtags)]
}

/**
 * Replace hashtags in text with clickable links
 */
export function linkHashtags(text: string): string {
  if (!text) return text

  // Replace #hashtag with clickable link
  return text.replace(
    /#(\w+)/g,
    '<a href="/hashtag/$1" class="text-blue-500 hover:underline">#$1</a>'
  )
}

