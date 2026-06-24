import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { extractHashtags } from "@/lib/hashtags"

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updatePostSchema.parse(body)

    // Check if post exists and user owns it
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to edit this post" },
        { status: 403 }
      )
    }

    // Extract hashtags from new content
    const hashtagNames = data.content ? extractHashtags(data.content) : []

    // Remove old hashtag connections
    await prisma.postHashtag.deleteMany({
      where: { postId: params.id },
    })

    // Decrement old hashtag counts
    const oldHashtags = await prisma.postHashtag.findMany({
      where: { postId: params.id },
      include: { hashtag: true },
    })

    for (const ph of oldHashtags) {
      await prisma.hashtag.update({
        where: { id: ph.hashtagId },
        data: {
          postCount: {
            decrement: 1,
          },
        },
      })
    }

    // Create or find new hashtags
    const hashtagConnections = await Promise.all(
      hashtagNames.map(async (name) => {
        const hashtag = await prisma.hashtag.upsert({
          where: { name },
          update: {
            postCount: {
              increment: 1,
            },
          },
          create: {
            name,
            postCount: 1,
          },
        })
        return { hashtagId: hashtag.id }
      })
    )

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: {
        content: data.content,
        updatedAt: new Date(),
        hashtags: hashtagConnections.length > 0 ? {
          create: hashtagConnections,
        } : undefined,
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

    return NextResponse.json(updatedPost)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Update post error:", error)
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if post exists and user owns it
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this post" },
        { status: 403 }
      )
    }

    // Soft delete post
    await prisma.post.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Post deleted" })
  } catch (error) {
    console.error("Delete post error:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}

