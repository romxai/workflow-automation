import type React from "react"
import { Brain } from "lucide-react"
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-80 z-0"></div>
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-primary/20 p-3 backdrop-blur-sm">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">AI Agent Orchestrator</h1>
          <p className="text-muted-foreground">Create dynamic AI agent workflows</p>
        </div>
        <div className="backdrop-blur-sm">{children}</div>
      </div>
    </div>
  )
}

