"use client"

import PusherClient from "pusher-js"

let pusherClient: PusherClient | null = null

export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    console.warn(
      "Pusher client key or cluster environment variables are missing. Real-time features will be disabled."
    )
    return null
  }

  if (!pusherClient) {
    pusherClient = new PusherClient(key, {
      cluster: cluster,
      authEndpoint: "/api/pusher/auth",
    })
  }
  return pusherClient
}
