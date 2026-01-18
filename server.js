// Load environment variables
require("dotenv").config()

const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  // Store user sessions
  const userSockets = new Map()

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    // Authenticate user
    socket.on("authenticate", async (data) => {
      try {
        // In production, verify the token with your auth system
        const { userId, token } = data
        if (userId) {
          socket.userId = userId
          userSockets.set(userId, socket.id)
          // Join a room for this user to receive notifications
          socket.join(userId)
          socket.emit("authenticated", { success: true })
          console.log(`User ${userId} authenticated on socket ${socket.id}`)
        }
      } catch (error) {
        console.error("Authentication error:", error)
        socket.emit("authenticated", { success: false })
      }
    })

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { conversationId, userId, isTyping } = data
      socket.to(`conversation:${conversationId}`).emit("user-typing", {
        userId,
        isTyping,
      })
    })

    // Join conversation room
    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`)
    })

    // Leave conversation room
    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`)
    })

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSockets.delete(socket.userId)
      }
      console.log("Client disconnected:", socket.id)
    })
  })

  // Export io for use in API routes
  global.io = io

  httpServer.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
    console.log(`> Socket.io server running on port ${port}`)
  })
})

