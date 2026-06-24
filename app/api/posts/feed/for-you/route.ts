import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getForYouFeed } from "@/lib/ai-feed-ranking"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Get ranked post IDs
    const rankedPostIds = await getForYouFeed(session.user.id, limit + 1)

    // Apply cursor pagination
    let postIds = rankedPostIds
    if (cursor) {
      const cursorIndex = rankedPostIds.indexOf(cursor)
      if (cursorIndex !== -1) {
        postIds = rankedPostIds.slice(cursorIndex + 1)
      }
    }

    const hasMore = postIds.length > limit
    const postsToFetch = hasMore ? postIds.slice(0, limit) : postIds

    if (postsToFetch.length === 0) {
      return NextResponse.json({
        posts: [],
        nextCursor: null,
        hasMore: false,
      })
    }

    // Fetch full post data
    const posts = await prisma.post.findMany({
      where: {
        id: { in: postsToFetch },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            isVerified: true,
          },
        },
        media: true,
        likes: {
          where: { userId: session.user.id },
        },
        reactions: {
          where: { userId: session.user.id },
        },
        shares: {
          where: { userId: session.user.id },
        },
        bookmarks: {
          where: { userId: session.user.id },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    })

    // Sort posts to match ranking order
    const sortedPosts = postsToFetch
      .map((id) => posts.find((p) => p.id === id))
      .filter((p): p is typeof posts[0] => p !== undefined)

    const nextCursor = hasMore ? sortedPosts[sortedPosts.length - 1].id : null

    return NextResponse.json({
      posts: sortedPosts,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error("For You feed error:", error)
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    )
  }
}

