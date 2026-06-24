"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, User, Hash, FileText, Filter, X } from "lucide-react"
import { PostCard } from "@/components/post-card"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { formatNumber } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

function SearchPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [searchType, setSearchType] = useState("all")
  const [results, setResults] = useState<any>({ users: [], posts: [], hashtags: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [sort, setSort] = useState("newest")
  const [mediaType, setMediaType] = useState("all")
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const performSearch = async (searchQuery: string, type: string) => {
    if (!searchQuery.trim()) {
      setResults({ users: [], posts: [], hashtags: [] })
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type,
        sort,
        mediaType,
      })
      if (dateFrom) params.append("dateFrom", dateFrom.toISOString())
      if (dateTo) params.append("dateTo", dateTo.toISOString())

      const response = await fetch(`/api/search?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        performSearch(query, searchType)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchType, sort, mediaType, dateFrom, dateTo])

  if (!session) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <h1 className="text-3xl font-bold">Search</h1>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users, posts, hashtags..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchType === "posts" || searchType === "all" ? (
              <Popover open={showFilters} onOpenChange={setShowFilters}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Sort by</label>
                      <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="mostLiked">Most Liked</SelectItem>
                          <SelectItem value="mostCommented">Most Commented</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Media Type</label>
                      <Select value={mediaType} onValueChange={setMediaType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="text">Text Only</SelectItem>
                          <SelectItem value="image">With Images</SelectItem>
                          <SelectItem value="video">With Videos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date From</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Date To</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            disabled={(date) => dateFrom ? date < dateFrom : false}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    {(dateFrom || dateTo || sort !== "newest" || mediaType !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setDateFrom(undefined)
                          setDateTo(undefined)
                          setSort("newest")
                          setMediaType("all")
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            ) : null}
          </div>
        </div>

        {query && (
          <Tabs value={searchType} onValueChange={setSearchType}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Searching...</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-4">
                  {results.users.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Users
                      </h2>
                      <div className="space-y-2">
                        {results.users.map((user: any) => (
                          <Link key={user.id} href={`/profile/${user.username}`}>
                            <Card className="hover:bg-accent transition-colors cursor-pointer">
                              <CardContent className="p-4 flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={user.image || undefined} />
                                  <AvatarFallback>
                                    {user.name?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{user.name || "Unknown"}</span>
                                    {user.isVerified && <span className="text-blue-500">✓</span>}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    @{user.username} · {formatNumber(user._count.followers)} followers
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.posts.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Posts
                      </h2>
                      <div className="space-y-4">
                        {results.posts.map((post: any) => (
                          <PostCard key={post.id} post={post} currentUserId={session.user.id} />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.hashtags.length > 0 && (
                    <div>
                      <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Hash className="h-5 w-5" />
                        Hashtags
                      </h2>
                      <div className="space-y-2">
                        {results.hashtags.map((hashtag: any) => (
                          <Link key={hashtag.id} href={`/hashtag/${hashtag.name}`}>
                            <Card className="hover:bg-accent transition-colors cursor-pointer">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-lg">#{hashtag.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {formatNumber(hashtag._count.posts)} posts
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No results found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="users" className="space-y-2">
                  {results.users.length > 0 ? (
                    results.users.map((user: any) => (
                      <Link key={user.id} href={`/profile/${user.username}`}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{user.name || "Unknown"}</span>
                                {user.isVerified && <span className="text-blue-500">✓</span>}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                @{user.username} · {formatNumber(user._count.followers)} followers
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No users found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="posts" className="space-y-4">
                  {results.posts.length > 0 ? (
                    results.posts.map((post: any) => (
                      <PostCard key={post.id} post={post} currentUserId={session.user.id} />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No posts found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="hashtags" className="space-y-2">
                  {results.hashtags.length > 0 ? (
                    results.hashtags.map((hashtag: any) => (
                      <Link key={hashtag.id} href={`/hashtag/${hashtag.name}`}>
                        <Card className="hover:bg-accent transition-colors cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-lg">#{hashtag.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatNumber(hashtag._count.posts)} posts
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No hashtags found</p>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        )}

        {!query && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Start typing to search...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading search...</p>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

