import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

interface WorkflowCardProps {
  id: string
  title: string
  description: string
  lastRun: string
}

function WorkflowCard({ id, title, description, lastRun }: WorkflowCardProps) {
  return (
    <Card className="overflow-hidden card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-between border-t bg-muted/20 px-6 py-3">
        <p className="text-xs text-muted-foreground">Last run: {lastRun}</p>
        <Button asChild size="sm" className="group">
          <Link href={`/workflow/${id}`}>
            Open
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

export default function DashboardPage() {
  // Mock data for workflows
  const workflows = [
    {
      id: "1",
      title: "Text Analysis Pipeline",
      description: "Analyzes text sentiment and extracts key entities",
      lastRun: "2 hours ago",
    },
    {
      id: "2",
      title: "Customer Support Bot",
      description: "Handles customer inquiries and routes to appropriate agents",
      lastRun: "1 day ago",
    },
    {
      id: "3",
      title: "Content Generation",
      description: "Creates blog posts and social media content",
      lastRun: "3 days ago",
    },
    {
      id: "4",
      title: "Data Processing Flow",
      description: "Cleans and transforms data for analysis",
      lastRun: "1 week ago",
    },
  ]

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Workflows</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create New Workflow
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <WorkflowCard key={workflow.id} {...workflow} />
        ))}
      </div>
    </div>
  )
}

