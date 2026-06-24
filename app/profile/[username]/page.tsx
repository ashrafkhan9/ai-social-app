import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PostCard } from "@/components/post-card"
import { FollowButton } from "@/components/follow-button"
import { UserActionsMenu } from "@/components/user-actions-menu"
import { MessageButton } from "@/components/message-button"
import { formatNumber } from "@/lib/utils"

export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      _count: {
        select: {
          posts: true,
          followers: true,
          follows: true,
        },
      },
    },
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto p-4">
          <p>User not found</p>
        </div>
      </div>
    )
  }

  const posts = await prisma.post.findMany({
    where: {
      authorId: user.id,
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
    orderBy: {
      createdAt: "desc",
    },
  })

  const isFollowing = session.user.id !== user.id ? await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id,
        followingId: user.id,
      },
    },
  }) : null

  const isBlocked = session.user.id !== user.id ? await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: session.user.id,
        blockedId: user.id,
      },
    },
  }) : null

  const isMuted = session.user.id !== user.id ? await prisma.mute.findUnique({
    where: {
      muterId_mutedId: {
        muterId: session.user.id,
        mutedId: user.id,
      },
    },
  }) : null

  const isBlockedBy = session.user.id !== user.id ? await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: user.id,
        blockedId: session.user.id,
      },
    },
  }) : null

  const isOwnProfile = session.user.id === user.id

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-2xl">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{user.name || "Unknown"}</h1>
                {user.isVerified && <span className="text-blue-500">✓</span>}
              </div>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.bio && <p className="mt-2">{user.bio}</p>}
              <div className="flex gap-6 mt-4">
                <div>
                  <span className="font-semibold">{formatNumber(user._count.posts)}</span>
                  <span className="text-muted-foreground ml-1">posts</span>
                </div>
                <div>
                  <span className="font-semibold">{formatNumber(user._count.followers)}</span>
                  <span className="text-muted-foreground ml-1">followers</span>
                </div>
                <div>
                  <span className="font-semibold">{formatNumber(user._count.follows)}</span>
                  <span className="text-muted-foreground ml-1">following</span>
                </div>
              </div>
              {!isOwnProfile && (
                <div className="flex gap-2 mt-4 items-center">
                  <FollowButton
                    userId={user.id}
                    isFollowing={!!isFollowing}
                    currentUserId={session.user.id}
                  />
                  <MessageButton userId={user.id} />
                  <UserActionsMenu
                    userId={user.id}
                    isBlocked={!!isBlocked}
                    isMuted={!!isMuted}
                    isFollowing={!!isFollowing}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No posts yet</p>
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

