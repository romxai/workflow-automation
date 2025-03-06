import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function HelpPage() {
  return (
    <div className="container py-6">
      <h1 className="mb-6 text-3xl font-bold">Help & Documentation</h1>

      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">User Guides</TabsTrigger>
          <TabsTrigger value="api">API Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is the AI Agent Orchestrator?</AccordionTrigger>
                  <AccordionContent>
                    The AI Agent Orchestrator is a platform that allows you to create and manage workflows of AI agents.
                    You can describe a task, and the system will dynamically create a workflow of AI agents to execute
                    it.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I create my first workflow?</AccordionTrigger>
                  <AccordionContent>
                    To create your first workflow, navigate to the Dashboard and click the "Create New Workflow" button.
                    You'll be guided through the process of setting up your workflow and adding AI agents.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>What types of AI agents are available?</AccordionTrigger>
                  <AccordionContent>
                    We offer a variety of AI agents including text analysis, content generation, data processing, and
                    customer support agents. Each agent is specialized for specific tasks and can be customized to your
                    needs.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Can I connect to external APIs?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can connect your workflows to external APIs by adding API keys in your User Settings. This
                    allows your AI agents to interact with external services and data sources.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>How do I share my workflows with others?</AccordionTrigger>
                  <AccordionContent>
                    Currently, workflows are private to your account. We're working on collaboration features that will
                    allow you to share workflows with team members and collaborate on their development.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Learn the basics of the AI Agent Orchestrator and create your first workflow.
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Introduction to the platform</li>
                  <li>Creating your first workflow</li>
                  <li>Adding and configuring agents</li>
                  <li>Running and testing workflows</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Workflows</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Take your workflows to the next level with advanced features and techniques.
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Conditional branching</li>
                  <li>Error handling and fallbacks</li>
                  <li>Integrating external APIs</li>
                  <li>Performance optimization</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Agent Types</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">
                  Explore the different types of AI agents available and their capabilities.
                </p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Text analysis agents</li>
                  <li>Content generation agents</li>
                  <li>Data processing agents</li>
                  <li>Customer support agents</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">Common issues and how to resolve them.</p>
                <ul className="list-inside list-disc space-y-2">
                  <li>Workflow execution errors</li>
                  <li>Agent configuration issues</li>
                  <li>API connection problems</li>
                  <li>Performance bottlenecks</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                Our API allows you to programmatically create and manage workflows, agents, and executions.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-lg font-medium">Authentication</h3>
                  <p className="text-muted-foreground">
                    All API requests require authentication using an API key. You can generate an API key in your User
                    Settings.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Endpoints</h3>
                  <ul className="list-inside list-disc space-y-2">
                    <li>
                      <code className="rounded bg-muted px-1 py-0.5">GET /api/workflows</code> - List all workflows
                    </li>
                    <li>
                      <code className="rounded bg-muted px-1 py-0.5">POST /api/workflows</code> - Create a new workflow
                    </li>
                    <li>
                      <code className="rounded bg-muted px-1 py-0.5">GET /api/workflows/:id</code> - Get workflow
                      details
                    </li>
                    <li>
                      <code className="rounded bg-muted px-1 py-0.5">PUT /api/workflows/:id</code> - Update a workflow
                    </li>
                    <li>
                      <code className="rounded bg-muted px-1 py-0.5">DELETE /api/workflows/:id</code> - Delete a
                      workflow
                    </li>
                    <li>
                      <code className="rounded bg-muted px-1 py-0.5">POST /api/workflows/:id/execute</code> - Execute a
                      workflow
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-lg font-medium">Rate Limits</h3>
                  <p className="text-muted-foreground">
                    API requests are limited to 100 requests per minute per API key. If you exceed this limit, you'll
                    receive a 429 Too Many Requests response.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

