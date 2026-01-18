import { NextResponse } from "next/server"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

export async function GET() {
  try {
    const swPath = join(process.cwd(), "public", "sw.js")
    
    if (!existsSync(swPath)) {
      return new NextResponse("Service worker not found", { status: 404 })
    }
    
    const swContent = readFileSync(swPath, "utf-8")

    return new NextResponse(swContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Service-Worker-Allowed": "/",
      },
    })
  } catch (error) {
    console.error("Error serving service worker:", error)
    return new NextResponse("Service worker not found", { status: 404 })
  }
}

