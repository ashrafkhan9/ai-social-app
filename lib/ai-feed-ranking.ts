import { prisma } from "@/lib/db"

interface PostScore {
  postId: string
  score: number
}

/**
 * Calculate personalized feed score for a post
 * Based on user interests, engagement patterns, and recency
 */
export async function calculatePostScore(
  postId: string,
  userId: string
): Promise<number> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      likes: true,
      comments: true,
      shares: true,
      reactions: true,
      hashtags: {
        include: { hashtag: true },
      },
    },
  })

  if (!post) return 0

  let score = 0

  // 1. Recency score (newer posts get higher score)
  const hoursSincePost = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60)
  const recencyScore = Math.max(0, 100 - hoursSincePost * 2) // Decay by 2 points per hour
  score += recencyScore * 0.3 // 30% weight

  // 2. Engagement score (likes, comments, shares, reactions)
  const engagementScore =
    post.likes.length * 2 +
    post.comments.length * 3 +
    post.shares.length * 5 +
    post.reactions.length * 2
  score += Math.min(engagementScore, 100) * 0.25 // 25% weight, capped at 100

  // 3. Author relationship score
  const isFollowing = await prisma.follow.findFirst({
    where: {
      followerId: userId,
      followingId: post.authorId,
    },
  })
  if (isFollowing) {
    score += 50 * 0.2 // 20% weight for followed users
  }

  // 4. User interaction history (has user interacted with this author before?)
  const userInteractions = await prisma.like.count({
    where: {
      userId,
      post: {
        authorId: post.authorId,
      },
    },
  })
  const interactionScore = Math.min(userInteractions * 5, 50)
  score += interactionScore * 0.15 // 15% weight

  // 5. Hashtag interest (does user engage with these hashtags?)
  if (post.hashtags.length > 0) {
    const hashtagIds = post.hashtags.map((ph) => ph.hashtagId)
    const userHashtagEngagements = await prisma.postHashtag.count({
      where: {
        hashtagId: { in: hashtagIds },
        post: {
          likes: {
            some: { userId },
          },
        },
      },
    })
    score += Math.min(userHashtagEngagements * 10, 30) * 0.1 // 10% weight
  }

  return score
}

/**
 * Rank posts for a user's personalized feed
 */
export async function rankPostsForUser(
  userId: string,
  posts: Array<{ id: string }>,
  limit: number = 20
): Promise<string[]> {
  // Calculate scores for all posts
  const postScores: PostScore[] = await Promise.all(
    posts.map(async (post) => ({
      postId: post.id,
      score: await calculatePostScore(post.id, userId),
    }))
  )

  // Sort by score (descending) and return top posts
  return postScores
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((p) => p.postId)
}

/**
 * Get personalized "For You" feed
 */
export async function getForYouFeed(
  userId: string,
  limit: number = 20
): Promise<string[]> {
  // Get blocked and muted user IDs
  const blocks = await prisma.block.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  })
  const mutes = await prisma.mute.findMany({
    where: { muterId: userId },
    select: { mutedId: true },
  })
  const blockedIds = blocks.map((b) => b.blockedId)
  const mutedIds = mutes.map((m) => m.mutedId)

  // Get recent posts (last 7 days) from non-blocked/muted users
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const posts = await prisma.post.findMany({
    where: {
      isDraft: false,
      deletedAt: null,
      scheduledFor: null,
      createdAt: { gte: sevenDaysAgo },
      authorId: {
        notIn: [...blockedIds, ...mutedIds, userId], // Exclude own posts for variety
      },
    },
    select: { id: true },
    take: 100, // Get more posts to rank from
  })

  // Rank and return top posts
  return rankPostsForUser(userId, posts, limit)
}

