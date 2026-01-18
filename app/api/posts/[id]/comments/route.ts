import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { notifyComment, notifyMention } from "@/lib/notifications"
import { extractMentions } from "@/lib/mentions"

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, parentId } = createCommentSchema.parse(body)

    // Get post to find author
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { authorId: true },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Extract mentions from comment
    const mentionUsernames = extractMentions(content)
    const mentionedUsers = await Promise.all(
      mentionUsernames.map(async (username) => {
        const user = await prisma.user.findUnique({
          where: { username },
          select: { id: true },
        })
        return user
      })
    )

    const validMentions = mentionedUsers.filter((u): u is { id: string } => u !== null)

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: session.user.id,
        postId: params.id,
        parentId: parentId || null,
        mentions: validMentions.length > 0 ? {
          create: validMentions.map((user) => ({
            userId: user.id,
          })),
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
        likes: {
          where: {
            userId: session.user.id,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })

    // Create notifications
    await notifyComment(params.id, session.user.id, post.authorId).catch(console.error)
    
    // Notify mentioned users
    for (const user of validMentions) {
      await notifyMention(params.id, comment.id, session.user.id, user.id).catch(
        console.error
      )
    }

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    const comments = await prisma.comment.findMany({
      where: {
        postId: params.id,
        parentId: null, // Top-level comments only
        deletedAt: null,
      },
      include: {
        replies: {
          where: { deletedAt: null },
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
            likes: session ? {
              where: { userId: session.user.id },
            } : false,
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
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
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
        likes: session ? {
          where: {
            userId: session.user.id,
          },
        } : false,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

