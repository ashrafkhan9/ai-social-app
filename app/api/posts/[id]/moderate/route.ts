import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { moderateContent } from "@/lib/ai/openai"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const postId = params.id

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { content: true },
    })

    if (!post || !post.content) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Moderate content
    const moderation = await moderateContent(post.content)

    if (moderation.flagged) {
      // Create AI flag
      await prisma.aIFlag.create({
        data: {
          postId,
          type: "TOXIC_CONTENT",
          severity: "HIGH",
          details: JSON.stringify(moderation.categories),
        },
      })

      return NextResponse.json({
        flagged: true,
        categories: moderation.categories,
        warning: "Content has been flagged for review",
      })
    }

    return NextResponse.json({ flagged: false })
  } catch (error) {
    console.error("Content moderation error:", error)
    return NextResponse.json(
      { error: "Failed to moderate content" },
      { status: 500 }
    )
  }
}

