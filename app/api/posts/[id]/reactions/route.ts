import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const reactionSchema = z.object({
  type: z.enum(["HEART", "LAUGH", "WOW", "ANGRY"]),
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
    const { type } = reactionSchema.parse(body)

    // Check if reaction already exists
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_postId_type: {
          userId: session.user.id,
          postId: params.id,
          type: type as any,
        },
      },
    })

    if (existing) {
      // Remove reaction if same type
      await prisma.reaction.delete({
        where: { id: existing.id },
      })
      return NextResponse.json({ message: "Reaction removed" })
    }

    // Remove any existing reaction of different type
    await prisma.reaction.deleteMany({
      where: {
        userId: session.user.id,
        postId: params.id,
      },
    })

    // Create new reaction
    await prisma.reaction.create({
      data: {
        userId: session.user.id,
        postId: params.id,
        type: type as any,
      },
    })

    return NextResponse.json({ message: "Reaction added" })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === "P2002") {
      return NextResponse.json({ message: "Reaction already exists" }, { status: 200 })
    }

    console.error("Add reaction error:", error)
    return NextResponse.json(
      { error: "Failed to add reaction" },
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
    if (!session) {
      return NextResponse.json([])
    }

    const reactions = await prisma.reaction.findMany({
      where: {
        postId: params.id,
        userId: session.user.id,
      },
      select: {
        type: true,
      },
    })

    return NextResponse.json(reactions)
  } catch (error) {
    console.error("Get reactions error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
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

    await prisma.reaction.deleteMany({
      where: {
        userId: session.user.id,
        postId: params.id,
      },
    })

    return NextResponse.json({ message: "Reaction removed" })
  } catch (error) {
    console.error("Remove reaction error:", error)
    return NextResponse.json(
      { error: "Failed to remove reaction" },
      { status: 500 }
    )
  }
}
