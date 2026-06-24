import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const highlight = await prisma.storyHighlight.findUnique({
      where: { id: params.id },
    })

    if (!highlight) {
      return NextResponse.json({ error: "Highlight not found" }, { status: 404 })
    }

    if (highlight.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this highlight" },
        { status: 403 }
      )
    }

    await prisma.storyHighlight.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete highlight error:", error)
    return NextResponse.json(
      { error: "Failed to delete highlight" },
      { status: 500 }
    )
  }
}

