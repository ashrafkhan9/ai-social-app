/**
 * Extract mentions from text content
 * Returns array of unique usernames (without @)
 */
export function extractMentions(text: string): string[] {
  if (!text) return []

  // Match mentions: @username (alphanumeric and underscores)
  const mentionRegex = /@(\w+)/g
  const matches = text.matchAll(mentionRegex)
  
  const mentions = Array.from(matches, (match) => match[1].toLowerCase())
  
  // Remove duplicates
  return [...new Set(mentions)]
}

