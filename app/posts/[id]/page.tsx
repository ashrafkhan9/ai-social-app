import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"
import { PostCard } from "@/components/post-card"
import { CommentsSection } from "@/components/comments-section"

export default async function PostPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
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
        where: {
          userId: session.user.id,
        },
      },
      reactions: {
        where: { userId: session.user.id },
      },
      shares: {
        where: { userId: session.user.id },
      },
      bookmarks: {
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
  })

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <p>Post not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <PostCard post={post} currentUserId={session.user.id} />
        <CommentsSection postId={post.id} currentUserId={session.user.id} />
      </div>
    </div>
  )
}

