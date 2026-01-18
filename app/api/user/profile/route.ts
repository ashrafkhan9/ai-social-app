import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { z } from "zod"

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  isPrivate: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // Check if username is taken (if changing)
    if (data.username && data.username !== session.user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: data.username },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...data,
        username: data.username || undefined,
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        coverImage: true,
        isPrivate: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 400 }
      )
    }

    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

