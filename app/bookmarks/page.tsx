import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"
import { PostCard } from "@/components/post-card"
import { Bookmark } from "lucide-react"

export default async function BookmarksPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Get bookmarked posts
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      post: {
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
          _count: {
            select: {
              likes: true,
              comments: true,
              shares: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const posts = bookmarks.map((bookmark) => bookmark.post)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Bookmarks</h1>
        </div>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No bookmarked posts yet. Save posts to view them here!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={session.user.id} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

