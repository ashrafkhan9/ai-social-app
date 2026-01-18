import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"
import { PostCard } from "@/components/post-card"
import { formatNumber } from "@/lib/utils"

export default async function HashtagPage({
  params,
}: {
  params: { name: string }
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  const hashtagName = decodeURIComponent(params.name).replace("#", "")

  const hashtag = await prisma.hashtag.findUnique({
    where: { name: hashtagName },
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  })

  if (!hashtag) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <p>Hashtag not found</p>
        </div>
      </div>
    )
  }

  const posts = await prisma.post.findMany({
    where: {
      hashtags: {
        some: {
          hashtagId: hashtag.id,
        },
      },
      isDraft: false,
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
      likes: {
        where: {
          userId: session.user.id,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">#{hashtag.name}</h1>
          <p className="text-muted-foreground">
            {formatNumber(hashtag._count.posts)} posts
          </p>
        </div>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts with this hashtag yet</p>
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

