import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { extractHashtags } from "@/lib/hashtags"
import { extractMentions } from "@/lib/mentions"
import { notifyMention } from "@/lib/notifications"

const createPostSchema = z.object({
  content: z.string().max(5000).nullable().optional(),
  media: z.array(z.object({
    url: z.string(),
    type: z.enum(["IMAGE", "VIDEO"]),
  })).optional(),
  isDraft: z.boolean().optional().default(false),
  scheduledFor: z.string().datetime().nullable().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, media, isDraft, scheduledFor } = createPostSchema.parse(body)

    if (!content && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: "Post must have content or media" },
        { status: 400 }
      )
    }

    // Extract hashtags and mentions from content
    const hashtagNames = content ? extractHashtags(content) : []
    const mentionUsernames = content ? extractMentions(content) : []

    // Create or find hashtags
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

    // Find mentioned users and create mentions
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

    const post = await prisma.post.create({
      data: {
        content: content || null,
        authorId: session.user.id,
        isDraft: isDraft || false,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        media: media ? {
          create: media.map((m, index) => ({
            url: m.url,
            type: m.type,
            order: index,
          })),
        } : undefined,
        hashtags: hashtagConnections.length > 0 ? {
          create: hashtagConnections,
        } : undefined,
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
          },
        },
        media: true,
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    })

    // Create notifications for mentions
    for (const user of validMentions) {
      await notifyMention(post.id, null, session.user.id, user.id).catch(
        console.error
      )
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Create post error:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}

