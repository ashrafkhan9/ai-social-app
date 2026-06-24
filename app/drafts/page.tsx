import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"
import { PostCard } from "@/components/post-card"
import { format } from "date-fns"
import { Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DraftsPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Fetch drafts and scheduled posts
  const [drafts, scheduled] = await Promise.all([
    prisma.post.findMany({
      where: {
        authorId: session.user.id,
        isDraft: true,
        deletedAt: null,
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
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.post.findMany({
      where: {
        authorId: session.user.id,
        isDraft: false,
        scheduledFor: {
          not: null,
        },
        deletedAt: null,
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
        media: true,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: { scheduledFor: "asc" },
    }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Drafts & Scheduled</h1>
        </div>

        {/* Scheduled Posts */}
        {scheduled.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Posts ({scheduled.length})
            </h2>
            {scheduled.map((post) => (
              <div key={post.id} className="relative">
                <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {post.scheduledFor && format(new Date(post.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
                </div>
                <PostCard
                  post={{
                    ...post,
                    likes: [],
                    reactions: [],
                    shares: [],
                    bookmarks: [],
                  }}
                  currentUserId={session.user.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Drafts */}
        {drafts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Drafts ({drafts.length})
            </h2>
            {drafts.map((post) => (
              <div key={post.id} className="relative">
                <div className="absolute top-2 right-2 z-10 bg-muted px-3 py-1 rounded-full text-sm">
                  Draft
                </div>
                <PostCard
                  post={{
                    ...post,
                    likes: [],
                    reactions: [],
                    shares: [],
                    bookmarks: [],
                  }}
                  currentUserId={session.user.id}
                />
              </div>
            ))}
          </div>
        )}

        {drafts.length === 0 && scheduled.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No drafts or scheduled posts yet.</p>
            <Link href="/home">
              <Button variant="outline" className="mt-4">
                Create a Post
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

