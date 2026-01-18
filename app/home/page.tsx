import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { FeedTabs } from "@/components/feed-tabs"
import { InfinitePosts } from "@/components/infinite-posts"
import { CreatePost } from "@/components/create-post"
import { Navbar } from "@/components/navbar"
import { SuggestedUsers } from "@/components/suggested-users"
import { StoriesBar } from "@/components/stories-bar"
import { getForYouFeed } from "@/lib/ai-feed-ranking"

export default async function HomePage({
  searchParams,
}: {
  searchParams: { feed?: string }
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  const feedType = searchParams.feed || "for-you"

  // Get blocked and muted user IDs
  const blocks = await prisma.block.findMany({
    where: { blockerId: session.user.id },
    select: { blockedId: true },
  })
  const mutes = await prisma.mute.findMany({
    where: { muterId: session.user.id },
    select: { mutedId: true },
  })
  const blockedIds = blocks.map((b) => b.blockedId)
  const mutedIds = mutes.map((m) => m.mutedId)

  // Fetch initial posts (first page)
  let whereClause: any = {
    isDraft: false,
    deletedAt: null,
    scheduledFor: null, // Only show published posts (not scheduled)
    authorId: {
      notIn: [...blockedIds, ...mutedIds],
    },
  }

  if (feedType === "following") {
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    })
    const followingIds = following.map((f) => f.followingId)
    whereClause.authorId = {
      in: followingIds.length > 0 ? followingIds : [session.user.id],
    }
  } else if (feedType === "trending") {
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    whereClause.createdAt = { gte: oneDayAgo }
  }

  let posts: any[] = []

  if (feedType === "for-you") {
    // For You feed uses AI ranking
    const rankedPostIds = await getForYouFeed(session.user.id, 20)
    if (rankedPostIds.length > 0) {
      posts = await prisma.post.findMany({
        where: {
          id: { in: rankedPostIds },
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
            where: { userId: session.user.id },
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
      // Sort to match ranking order
      posts = rankedPostIds
        .map((id) => posts.find((p) => p.id === id))
        .filter((p): p is typeof posts[0] => p !== undefined)
    }
  } else {
    // Other feeds use standard query
    posts = await prisma.post.findMany({
      where: whereClause,
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
      orderBy:
        feedType === "trending"
          ? [{ likes: { _count: "desc" } }, { createdAt: "desc" }]
          : { createdAt: "desc" },
      take: 20,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Home</h1>
        </div>
        <FeedTabs currentFeed={feedType} />
        
        <StoriesBar />
        
        {feedType === "following" && (
          <SuggestedUsers />
        )}
        
        <CreatePost />
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>
              {feedType === "following"
                ? "Follow users to see their posts here! Check out suggested users above."
                : "No posts yet. Be the first to post!"}
            </p>
          </div>
        ) : (
          <InfinitePosts
            initialPosts={posts}
            feedType={feedType}
            currentUserId={session.user.id}
          />
        )}
      </div>
    </div>
  )
}

