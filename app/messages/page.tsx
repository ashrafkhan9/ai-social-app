"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Send, MessageCircle, Search, Plus, Loader2 } from "lucide-react"
import { formatDate, formatNumber } from "@/lib/utils"
import Link from "next/link"
import { getConversationChannel, leaveConversationChannel } from "@/lib/websocket"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Conversation {
  id: string
  name: string
  otherParticipant?: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    isVerified: boolean
  }
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
    read: boolean
  } | null
  updatedAt: string
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  read: boolean
  sender: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageContent, setMessageContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [defaultUsers, setDefaultUsers] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session])

  useEffect(() => {
    if (selectedConversation && session?.user?.id) {
      fetchMessages(selectedConversation)
      
      // Subscribe to Pusher conversation channel
      const channel = getConversationChannel(selectedConversation)
      if (!channel) return

      channel.bind("user-typing", (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== session.user.id) {
          setTypingUsers((prev) => {
            const newSet = new Set(prev)
            if (data.isTyping) {
              newSet.add(data.userId)
            } else {
              newSet.delete(data.userId)
            }
            return newSet
          })
        }
      })

      channel.bind("new-message", (message: Message) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id)
          return exists ? prev : [...prev, message]
        })
      })

      return () => {
        channel.unbind("user-typing")
        channel.unbind("new-message")
        leaveConversationChannel(selectedConversation)
      }
    }
  }, [selectedConversation, session])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversation || !session?.user?.id) return

    fetch("/api/pusher/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedConversation, isTyping }),
    }).catch(console.error)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false)
      }, 3000)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageContent.trim() || !selectedConversation) return

    // Stop typing indicator
    handleTyping(false)

    setIsSending(true)
    try {
      const response = await fetch(
        `/api/conversations/${selectedConversation}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: messageContent }),
        }
      )

      if (!response.ok) throw new Error("Failed to send message")

      const newMessage = await response.json()
      setMessages([...messages, newMessage])
      setMessageContent("")
      fetchConversations() // Refresh conversations list
    } catch (error) {
      toast.error("Failed to send message")
    } finally {
      setIsSending(false)
    }
  }

  const startConversation = async (userId: string) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to create conversation")

      const conversation = await response.json()
      setSelectedConversation(conversation.id)
      setShowNewMessageDialog(false)
      setSearchQuery("")
      setSearchResults([])
      fetchConversations()
      toast.success("Conversation started!")
    } catch (error) {
      toast.error("Failed to start conversation")
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=users`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const fetchDefaultUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch("/api/users/messaging")
      if (response.ok) {
        const data = await response.json()
        setDefaultUsers(data)
      } else {
        console.error("Failed to fetch users:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (showNewMessageDialog && !searchQuery) {
      fetchDefaultUsers()
    }
  }, [showNewMessageDialog])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (showNewMessageDialog) {
        if (searchQuery.trim()) {
          searchUsers(searchQuery)
        } else {
          setSearchResults([])
          fetchDefaultUsers()
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, showNewMessageDialog])

  if (!session) return null

  const currentConversation = conversations.find(
    (c) => c.id === selectedConversation
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          {/* Conversations List */}
          <Card className="md:col-span-1">
            <CardContent className="p-0 h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Messages
                  </h2>
                  <Dialog 
                    open={showNewMessageDialog} 
                    onOpenChange={(open) => {
                      setShowNewMessageDialog(open)
                      if (!open) {
                        setSearchQuery("")
                        setSearchResults([])
                        setDefaultUsers([])
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                      <DialogDescription>
                        Search for a user or select from the list below
                      </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <ScrollArea className="h-[300px]">
                          {isSearching || isLoadingUsers ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          ) : searchQuery.trim() && searchResults.length > 0 ? (
                            <div className="space-y-2">
                              {searchResults.map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => startConversation(user.id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                >
                                  <Avatar>
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback>
                                      {user.name?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold truncate">
                                        {user.name || "Unknown"}
                                      </span>
                                      {user.isVerified && (
                                        <span className="text-blue-500">✓</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                      @{user.username} · {formatNumber(user._count?.followers || 0)} followers
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : searchQuery.trim() && searchResults.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No users found</p>
                            </div>
                          ) : defaultUsers.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground px-2 pb-2">
                                Suggested users
                              </p>
                              {defaultUsers.map((user) => (
                                <button
                                  key={user.id}
                                  onClick={() => startConversation(user.id)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                                >
                                  <Avatar>
                                    <AvatarImage src={user.image || undefined} />
                                    <AvatarFallback>
                                      {user.name?.charAt(0).toUpperCase() || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold truncate">
                                        {user.name || "Unknown"}
                                      </span>
                                      {user.isVerified && (
                                        <span className="text-blue-500">✓</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">
                                      @{user.username} · {formatNumber(user._count?.followers || 0)} followers
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No users available</p>
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {conversations.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 px-4">
                      <p>No conversations yet</p>
                      <p className="text-sm mt-2">
                        Click the + button above to start a new conversation
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${
                          selectedConversation === conv.id ? "bg-accent" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {conv.otherParticipant ? (
                            <Avatar>
                              <AvatarImage
                                src={conv.otherParticipant.image || undefined}
                              />
                              <AvatarFallback>
                                {conv.otherParticipant.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <MessageCircle className="h-5 w-5" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">
                                {conv.name}
                              </p>
                              {conv.otherParticipant?.isVerified && (
                                <span className="text-blue-500">✓</span>
                              )}
                            </div>
                            {conv.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {conv.lastMessage.senderId === session.user.id
                                  ? "You: "
                                  : ""}
                                {conv.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2">
            <CardContent className="p-0 h-full flex flex-col">
              {selectedConversation ? (
                <>
                  {currentConversation && (
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        {currentConversation.otherParticipant ? (
                          <>
                            <Avatar>
                              <AvatarImage
                                src={
                                  currentConversation.otherParticipant.image ||
                                  undefined
                                }
                              />
                              <AvatarFallback>
                                {currentConversation.otherParticipant.name?.charAt(0) ||
                                  "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/profile/${currentConversation.otherParticipant?.username}`}
                                  className="font-semibold hover:underline"
                                >
                                  {currentConversation.name}
                                </Link>
                                {currentConversation.otherParticipant.isVerified && (
                                  <span className="text-blue-500">✓</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                @{currentConversation.otherParticipant.username}
                              </p>
                            </div>
                          </>
                        ) : (
                          <h3 className="font-semibold">{currentConversation.name}</h3>
                        )}
                      </div>
                    </div>
                  )}

                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === session.user.id
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] flex gap-2 ${
                                isOwn ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {!isOwn && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage
                                    src={message.sender.image || undefined}
                                  />
                                  <AvatarFallback>
                                    {message.sender.name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isOwn
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="whitespace-pre-wrap">
                                  {message.content}
                                </p>
                                <p
                                  className={`text-xs mt-1 ${
                                    isOwn
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {formatDate(new Date(message.createdAt))}
                                  {isOwn && message.read && " ✓✓"}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {typingUsers.size > 0 && currentConversation && (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] flex gap-2">
                            {currentConversation.otherParticipant && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={currentConversation.otherParticipant.image || undefined}
                                />
                                <AvatarFallback>
                                  {currentConversation.otherParticipant.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="bg-muted rounded-lg px-4 py-2">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t flex gap-2"
                  >
                    <Input
                      value={messageContent}
                      onChange={(e) => {
                        setMessageContent(e.target.value)
                        handleTyping(e.target.value.length > 0)
                      }}
                      onKeyDown={() => handleTyping(true)}
                      placeholder="Type a message..."
                      disabled={isSending}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isSending || !messageContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
