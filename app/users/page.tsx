import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { Navbar } from "@/components/navbar"
import { SuggestedUsers } from "@/components/suggested-users"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default async function UsersPage() {
  const session = await getServerSession()

  if (!session) {
    redirect("/auth/signin")
  }

  // Get all users (excluding current user)
  const allUsers = await prisma.user.findMany({
    where: {
      id: {
        not: session.user.id,
      },
    },
    include: {
      _count: {
        select: {
          followers: true,
          posts: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Discover Users</h1>
        </div>
        
        <SuggestedUsers />
        
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <a
                      href={`/profile/${user.username}`}
                      className="font-semibold hover:underline"
                    >
                      {user.name || "Unknown"}
                    </a>
                    {user.isVerified && <span className="text-blue-500">✓</span>}
                    <span className="text-sm text-muted-foreground">
                      @{user.username}
                    </span>
                  </div>
                  <a
                    href={`/profile/${user.username}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Profile →
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

