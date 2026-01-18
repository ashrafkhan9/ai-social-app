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
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all" // all, users, posts, hashtags
    const sort = searchParams.get("sort") || "newest" // newest, oldest, mostLiked, mostCommented
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const mediaType = searchParams.get("mediaType") // image, video, text, all

    if (!query.trim()) {
      return NextResponse.json({ users: [], posts: [], hashtags: [] })
    }

    const results: any = {
      users: [],
      posts: [],
      hashtags: [],
    }

    // Search users
    if (type === "all" || type === "users") {
      results.users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          isVerified: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        take: 10,
      })
    }

    // Search posts
    if (type === "all" || type === "posts") {
      const postWhere: any = {
        content: { contains: query, mode: "insensitive" },
        isDraft: false,
        deletedAt: null,
        scheduledFor: null,
      }

      // Date range filter
      if (dateFrom || dateTo) {
        postWhere.createdAt = {}
        if (dateFrom) {
          postWhere.createdAt.gte = new Date(dateFrom)
        }
        if (dateTo) {
          postWhere.createdAt.lte = new Date(dateTo)
        }
      }

      // Media type filter
      if (mediaType && mediaType !== "all") {
        if (mediaType === "text") {
          postWhere.media = { none: {} }
        } else if (mediaType === "image") {
          postWhere.media = {
            some: { type: "IMAGE" },
          }
        } else if (mediaType === "video") {
          postWhere.media = {
            some: { type: "VIDEO" },
          }
        }
      }

      // Sort options
      let orderBy: any = { createdAt: "desc" }
      if (sort === "oldest") {
        orderBy = { createdAt: "asc" }
      } else if (sort === "mostLiked") {
        orderBy = { likes: { _count: "desc" } }
      } else if (sort === "mostCommented") {
        orderBy = { comments: { _count: "desc" } }
      }

      results.posts = await prisma.post.findMany({
        where: postWhere,
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
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        take: 20,
        orderBy,
      })
    }

    // Search hashtags
    if (type === "all" || type === "hashtags") {
      results.hashtags = await prisma.hashtag.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
        take: 10,
        orderBy: {
          postCount: "desc",
        },
      })
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    )
  }
}

