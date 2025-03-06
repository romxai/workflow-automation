import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"
import { Brain, CheckCircle, Workflow, ArrowRight, Sparkles, Zap, Code, Bot } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 blur-backdrop">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">AI Agent Orchestrator</span>
            </div>
            <MainNav className="hidden md:flex" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="hero-gradient py-24 text-center">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="inline-block rounded-full bg-secondary/30 px-3 py-1 text-sm font-medium text-secondary-foreground backdrop-blur-sm">
                Introducing AI Agent Orchestrator
              </div>
              <h1 className="gradient-text text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Dynamic AI Agent Orchestration
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Describe a task, and our AI will dynamically create a workflow of specialized agents to execute it.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="group relative overflow-hidden">
                  <Link href="/dashboard">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="bg-background/50 backdrop-blur-sm">
                  <Link href="/help">Learn More</Link>
                </Button>
              </div>

              <div className="mt-12 flex justify-center">
                <div className="relative rounded-xl border bg-card/50 p-1 shadow-xl backdrop-blur-sm">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground">
                    <Sparkles className="mr-1 inline-block h-3 w-3" /> AI-Powered Workflow
                  </div>
                  <div className="flex items-center gap-2 p-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`rounded-lg bg-background p-3 shadow-sm ${i % 2 === 0 ? "floating" : ""}`}
                      >
                        <div className="h-6 w-6 rounded-full bg-primary/20 p-1">
                          {i === 1 ? (
                            <Bot className="h-4 w-4 text-primary" />
                          ) : i === 2 ? (
                            <Code className="h-4 w-4 text-primary" />
                          ) : i === 3 ? (
                            <Zap className="h-4 w-4 text-primary" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="mt-2 h-2 w-16 rounded-full bg-muted"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container px-4 md:px-6">
            <div className="mb-12 text-center">
              <h2 className="gradient-text inline-block text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Key Features
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground">
                Our platform offers powerful tools to create, manage, and execute AI agent workflows.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="card-hover flex flex-col items-center rounded-xl border bg-card p-6 text-center">
                <div className="feature-icon-glow mb-4 rounded-full bg-primary/10 p-4">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Dynamic Agent Creation</h3>
                <p className="text-muted-foreground">
                  Our AI automatically creates specialized agents based on your task description.
                </p>
                <div className="mt-4 h-1 w-12 rounded-full bg-primary/50"></div>
              </div>
              <div className="card-hover flex flex-col items-center rounded-xl border bg-card p-6 text-center">
                <div className="feature-icon-glow mb-4 rounded-full bg-primary/10 p-4">
                  <Workflow className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Visual Workflow Editor</h3>
                <p className="text-muted-foreground">
                  Create and edit workflows with our intuitive drag-and-drop interface.
                </p>
                <div className="mt-4 h-1 w-12 rounded-full bg-primary/50"></div>
              </div>
              <div className="card-hover flex flex-col items-center rounded-xl border bg-card p-6 text-center">
                <div className="feature-icon-glow mb-4 rounded-full bg-primary/10 p-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Automated Execution</h3>
                <p className="text-muted-foreground">
                  Run your workflows with a single click and monitor their progress in real-time.
                </p>
                <div className="mt-4 h-1 w-12 rounded-full bg-primary/50"></div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 hero-gradient opacity-70"></div>
          <div className="container relative px-4 md:px-6">
            <div className="mx-auto max-w-3xl rounded-2xl border bg-card/50 p-8 text-center backdrop-blur-sm">
              <h2 className="gradient-text text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Get Started?
              </h2>
              <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground">
                Create your first AI agent workflow today and experience the power of dynamic orchestration.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" className="group relative overflow-hidden">
                  <Link href="/auth/signup">
                    Sign Up Now
                    <span className="absolute -right-12 -top-12 h-24 w-24 translate-x-full translate-y-full transform rounded-full bg-white opacity-10 transition-transform group-hover:translate-x-0 group-hover:translate-y-0"></span>
                  </Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 rounded-full bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Free starter plan</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-background/50 px-4 py-2 text-sm backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 bg-background/80 backdrop-blur-sm">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AI Agent Orchestrator. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Help
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

