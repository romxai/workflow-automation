"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Workflow } from "@/lib/models/workflow";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { CardFooter } from "@/components/ui/card";

export default function WorkflowPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agentPrompts, setAgentPrompts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated") {
      fetchWorkflow();
    }
  }, [status, router, params.id]);

  const fetchWorkflow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflows/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Workflow not found");
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch workflow");
      }

      const data = await response.json();
      setWorkflow(data);
      // Initialize agent prompts state
      const initialPrompts: Record<string, string> = {};
      data.agents.forEach((agent: any) => {
        initialPrompts[agent.id] = agent.prompt;
      });
      setAgentPrompts(initialPrompts);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast.error("Failed to load workflow");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentUpdate = async (agentId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflows/${params.id}/agents/${agentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: agentPrompts[agentId] }),
      });

      if (!response.ok) {
        throw new Error("Failed to update agent prompt");
      }

      toast.success("Agent prompt updated successfully");
      fetchWorkflow(); // Refresh workflow data
    } catch (error) {
      console.error("Error updating agent prompt:", error);
      toast.error("Failed to update agent prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptChange = (agentId: string, value: string) => {
    setAgentPrompts({ ...agentPrompts, [agentId]: value });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-xl font-semibold mb-2">Workflow not found</h2>
          <p className="text-muted-foreground mb-4">
            The workflow you are looking for does not exist or you do not have
            permission to view it.
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{workflow.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Problem Statement</CardTitle>
              <CardDescription>
                The problem this workflow aims to solve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{workflow.problemStatement}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Agents</CardTitle>
                <CardDescription>
                  AI agents generated for this workflow
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {workflow.agents && workflow.agents.length > 0 ? (
                <div className="space-y-4">
                  {workflow.agents.map((agent) => (
                    <Card key={agent.id} className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle className="text-lg">
                              {agent.name}
                            </CardTitle>
                            <CardDescription>
                              {agent.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <h4 className="font-semibold text-sm">Role:</h4>
                          <p className="text-sm">{agent.role}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Prompt:</h4>
                          <Textarea
                            className="text-sm whitespace-pre-wrap"
                            value={agentPrompts[agent.id] || agent.prompt}
                            onChange={(e) => handlePromptChange(agent.id, e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-sm">Inputs:</h4>
                            <ul className="list-disc list-inside text-sm">
                              {agent.inputs.map((input, index) => (
                                <li key={index}>{input}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm">Outputs:</h4>
                            <ul className="list-disc list-inside text-sm">
                              {agent.outputs.map((output, index) => (
                                <li key={index}>{output}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm" onClick={() => handleAgentUpdate(agent.id)}>
                          Save Prompt
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No agents have been generated yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Workflow Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm">Status:</h4>
                <p className="capitalize">{workflow.status}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm">Created:</h4>
                <p>{new Date(workflow.createdAt).toLocaleString()}</p>
              </div>
              {workflow.lastRun && (
                <div>
                  <h4 className="font-semibold text-sm">Last Run:</h4>
                  <p>{new Date(workflow.lastRun).toLocaleString()}</p>
                </div>
              )}
              <div className="pt-4">
                <Button className="w-full">Run Workflow</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
