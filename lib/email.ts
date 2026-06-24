/**
 * Email utility functions
 * Supports Resend API for sending emails
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@yourdomain.com"
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "http://localhost:3000"

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`

  if (RESEND_API_KEY) {
    // Use Resend API if configured
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: email,
          subject: "Reset Your Password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset Your Password</h2>
              <p>You requested to reset your password. Click the link below to reset it:</p>
              <p>
                <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Reset Password
                </a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all;">${resetUrl}</p>
              <p>This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to send email")
      }
    } catch (error) {
      console.error("Resend API error:", error)
      throw error
    }
  } else {
    // Development mode: log the reset link
    console.log("=".repeat(60))
    console.log("PASSWORD RESET EMAIL (Development Mode)")
    console.log("=".repeat(60))
    console.log(`To: ${email}`)
    console.log(`Subject: Reset Your Password`)
    console.log(`Reset Link: ${resetUrl}`)
    console.log("=".repeat(60))
    console.log("\nNote: Configure RESEND_API_KEY in .env to send real emails")
    console.log("=".repeat(60))
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  if (RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: email,
          subject: "Welcome to AI Social Platform!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome${name ? `, ${name}` : ""}!</h2>
              <p>Thank you for joining our platform. We're excited to have you here!</p>
              <p>Get started by creating your first post and connecting with others.</p>
              <p>
                <a href="${NEXTAUTH_URL}/home" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Go to Home
                </a>
              </p>
            </div>
          `,
        }),
      })
    } catch (error) {
      console.error("Failed to send welcome email:", error)
    }
  } else {
    console.log(`Welcome email would be sent to: ${email}`)
  }
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<void> {
  if (RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${subject}</h2>
              <p>${message}</p>
              ${actionUrl && actionText ? `
                <p>
                  <a href="${actionUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    ${actionText}
                  </a>
                </p>
              ` : ""}
            </div>
          `,
        }),
      })
    } catch (error) {
      console.error("Failed to send notification email:", error)
    }
  } else {
    console.log(`Notification email would be sent to: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Message: ${message}`)
  }
}

