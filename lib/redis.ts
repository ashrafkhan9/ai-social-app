import Redis from "ioredis"

const getRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL
  }
  return "redis://localhost:6379"
}

export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null,
})

redis.on("error", (err) => {
  console.error("Redis Client Error", err)
})

