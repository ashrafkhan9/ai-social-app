import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = params.id

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot mute yourself" },
        { status: 400 }
      )
    }

    // Check if already muted
    const existing = await prisma.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: session.user.id,
          mutedId: userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Already muted" }, { status: 200 })
    }

    // Create mute
    await prisma.mute.create({
      data: {
        muterId: session.user.id,
        mutedId: userId,
      },
    })

    return NextResponse.json({ message: "User muted" }, { status: 200 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ message: "Already muted" }, { status: 200 })
    }
    console.error("Mute user error:", error)
    return NextResponse.json(
      { error: "Failed to mute user" },
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

    const userId = params.id

    await prisma.mute.deleteMany({
      where: {
        muterId: session.user.id,
        mutedId: userId,
      },
    })

    return NextResponse.json({ message: "User unmuted" }, { status: 200 })
  } catch (error) {
    console.error("Unmute user error:", error)
    return NextResponse.json(
      { error: "Failed to unmute user" },
      { status: 500 }
    )
  }
}

