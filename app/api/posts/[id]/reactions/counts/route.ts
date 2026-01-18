import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reactions = await prisma.reaction.findMany({
      where: { postId: params.id },
      select: { type: true },
    })

    const counts = {
      HEART: 0,
      LAUGH: 0,
      WOW: 0,
      ANGRY: 0,
    }

    reactions.forEach((reaction) => {
      counts[reaction.type as keyof typeof counts]++
    })

    return NextResponse.json(counts)
  } catch (error) {
    console.error("Get reaction counts error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reaction counts" },
      { status: 500 }
    )
  }
}

