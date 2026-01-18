"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, Users, TrendingUp, Sparkles } from "lucide-react"

export function FeedTabs({ currentFeed }: { currentFeed: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("feed")
    } else {
      params.set("feed", value)
    }
    router.push(`/home?${params.toString()}`)
  }

  return (
    <Tabs value={currentFeed} onValueChange={handleTabChange}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="for-you" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          For You
        </TabsTrigger>
        <TabsTrigger value="all" className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          All
        </TabsTrigger>
        <TabsTrigger value="following" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Following
        </TabsTrigger>
        <TabsTrigger value="trending" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Trending
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

