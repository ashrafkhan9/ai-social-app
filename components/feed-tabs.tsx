"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Home, Users, TrendingUp, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { value: "for-you", label: "For You", icon: Sparkles },
  { value: "all", label: "All", icon: Home },
  { value: "following", label: "Following", icon: Users },
  { value: "trending", label: "Trending", icon: TrendingUp },
]

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
    <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/50">
      {tabs.map(({ value, label, icon: Icon }) => {
        const isActive = currentFeed === value
        return (
          <button
            key={value}
            onClick={() => handleTabChange(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              isActive
                ? "bg-background text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
