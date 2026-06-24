import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Zap, Shield, Users } from "lucide-react"

export default async function Home() {
  const session = await getServerSession()

  if (session) {
    redirect("/home")
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold">AI Social</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
          <Button asChild className="gradient-primary border-0 hover:opacity-90">
            <Link href="/auth/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
          Social media{" "}
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            reimagined
          </span>
          <br />
          with AI
        </h1>

        <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect, create, and discover with an AI that understands you.
          Smarter feeds, AI-generated posts, and real conversations — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="gradient-primary border-0 hover:opacity-90 text-base px-8 h-12">
            <Link href="/auth/signup">Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 text-base px-8 h-12">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-24">
          {[
            {
              icon: Zap,
              title: "AI-Powered Feed",
              desc: "Your feed adapts to what you love using smart ranking algorithms.",
              color: "text-yellow-400",
              bg: "bg-yellow-400/10 border-yellow-400/20",
            },
            {
              icon: Sparkles,
              title: "AI Content Creation",
              desc: "Generate posts, captions, and ideas in seconds with AI assistance.",
              color: "text-violet-400",
              bg: "bg-violet-400/10 border-violet-400/20",
            },
            {
              icon: Shield,
              title: "AI Moderation",
              desc: "Automated content moderation keeps your community safe and positive.",
              color: "text-emerald-400",
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
          ].map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="rounded-2xl bg-white/5 border border-white/10 p-6 text-left hover:bg-white/[0.07] transition-colors"
            >
              <div className={`inline-flex p-2.5 rounded-xl border ${bg} mb-4`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-16 text-white/30 text-sm">
          <Users className="w-4 h-4" />
          Join thousands of creators already on the platform
        </div>
      </main>
    </div>
  )
}
