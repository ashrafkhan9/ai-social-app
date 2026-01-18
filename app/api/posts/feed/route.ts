import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const feedType = searchParams.get("type") || "all"
    const cursor = searchParams.get("cursor")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Get blocked and muted user IDs
    const blocks = await prisma.block.findMany({
      where: { blockerId: session.user.id },
      select: { blockedId: true },
    })
    const mutes = await prisma.mute.findMany({
      where: { muterId: session.user.id },
      select: { mutedId: true },
    })
    const blockedIds = blocks.map((b) => b.blockedId)
    const mutedIds = mutes.map((m) => m.mutedId)

    let whereClause: any = {
      isDraft: false,
      deletedAt: null,
      scheduledFor: null, // Only show published posts (not scheduled)
      authorId: {
        notIn: [...blockedIds, ...mutedIds],
      },
    }

    // Add cursor for pagination
    if (cursor) {
      whereClause.id = {
        lt: cursor, // Less than cursor (for descending order)
      }
    }

    if (feedType === "following") {
      const following = await prisma.follow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      })
      const followingIds = following.map((f) => f.followingId)
      whereClause.authorId = {
        ...whereClause.authorId,
        in: followingIds.length > 0 ? followingIds : [session.user.id],
      }
    } else if (feedType === "trending") {
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      whereClause.createdAt = { gte: oneDayAgo }
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
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
      orderBy:
        feedType === "trending"
          ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
          : { createdAt: "desc" },
      take: limit + 1, // Fetch one extra to check if there's more
    })

    const hasMore = posts.length > limit
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts
    const nextCursor = hasMore ? postsToReturn[postsToReturn.length - 1].id : null

    return NextResponse.json({
      posts: postsToReturn,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error("Feed error:", error)
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    )
  }
}
