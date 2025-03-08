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
import { Workflow, Agent } from "@/lib/models/workflow";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { CardFooter } from "@/components/ui/card";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Play, Send, Settings, X } from "lucide-react";

function WorkflowEditor({ agents, onNodeClick }: { agents: Agent[], onNodeClick: (agent: Agent) => void }) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border bg-muted/20 p-4">
      <div className="absolute left-4 top-4 flex gap-2">
        <Button size="sm" variant="secondary">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button size="sm" variant="secondary">
          <Play className="mr-2 h-4 w-4" />
          Run Workflow
        </Button>
      </div>

      <div className="flex h-full items-center justify-center">
        <div className="flex flex-wrap gap-8 p-8">
          {agents.map((agent, index) => (
            <Card
              key={agent.id}
              className="flex h-32 w-48 flex-col p-4 shadow-md cursor-pointer"
              onClick={() => onNodeClick(agent)}
            >
              <div className="mb-2 text-sm font-medium">{agent.name}</div>
              <div className="text-xs text-muted-foreground">
                {agent.description}
              </div>
              {index < agents.length - 1 && (
                <ChevronRight className="absolute -right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "I'm the Orchestrator Agent. How can I help you with your workflow?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      { role: "user", content: input },
      {
        role: "system",
        content:
          "I'll help you with that. What specific part of the workflow would you like to modify?",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-medium">Orchestrator Chat</h3>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask the Orchestrator Agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NodeDetailsPanel({ agent, onClose, onUpdate }: { agent: Agent | null, onClose: () => void, onUpdate: (updatedAgent: Agent) => void }) {
  const [prompt, setPrompt] = useState(agent?.prompt || "");

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleUpdate = () => {
    if (agent) {
      onUpdate({ ...agent, prompt });
    }
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-medium">{agent.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-sm">Role:</h4>
          <p className="text-sm">{agent.role}</p>
        </div>
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
        <div>
          <h4 className="font-semibold text-sm">Prompt:</h4>
          <Textarea
            className="text-sm whitespace-pre-wrap"
            value={prompt}
            onChange={handlePromptChange}
          />
        </div>
      </div>
      <div className="border-t p-4">
        <Button className="w-full" onClick={handleUpdate}>
          Save Prompt
        </Button>
      </div>
    </div>
  );
}

export default function WorkflowPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agentPrompts, setAgentPrompts] = useState<Record<string, string>>({});
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
    <div className="container h-[calc(100vh-4rem)] py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workflow.name}</h1>
          <p className="text-muted-foreground">{workflow.description}</p>
        </div>
        <Button>
          <Play className="mr-2 h-4 w-4" /> Run Workflow
        </Button>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="h-[calc(100%-4rem)]"
      >
        <ResizablePanel defaultSize={70} minSize={30}>
          <WorkflowEditor
            agents={workflow.agents}
            onNodeClick={(agent) => {
              setSelectedAgent(agent);
              setShowNodeDetails(true);
            }}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            {showNodeDetails && (
              <>
                <ResizablePanel defaultSize={50}>
                  <NodeDetailsPanel
                    agent={selectedAgent}
                    onClose={() => setShowNodeDetails(false)}
                    onUpdate={(updatedAgent) => {
                      handleAgentUpdate(updatedAgent.id);
                      setSelectedAgent(updatedAgent);
                    }}
                  />
                </ResizablePanel>
                <ResizableHandle withHandle />
              </>
            )}

            {showChat && (
              <ResizablePanel defaultSize={showNodeDetails ? 50 : 100}>
                <ChatPanel />
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
