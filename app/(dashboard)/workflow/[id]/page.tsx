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
import {
  Loader2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Play,
  Send,
  Settings,
  X,
  Maximize2,
  Minimize2,
  Paperclip,
  Layers,
  Zap,
  MessageSquare,
  Pencil,
  FileInput,
  FileOutput,
  Brain,
  BrainCog,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { Workflow, Agent } from "@/lib/models/workflow";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkflowVisualizer from "@/components/workflow/WorkflowVisualizer";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Function to get initials from a name
const getInitials = (name: string): string => {
  const names = name.split(" ");
  return names.map((n) => n.charAt(0).toUpperCase()).join("");
};

function ChatPanel({
  isCollapsed,
  onToggle,
  isMobile,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile: boolean;
}) {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "I'm the Orchestrator Agent. How can I help you with your workflow?",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  const handleAttachment = () => {
    // This would be implemented to handle file attachments
    toast.info("File attachment feature coming soon!");
  };

  if (isCollapsed) {
    return (
      <div className="flex h-full flex-col">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 z-10"
          onClick={onToggle}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border rounded-lg bg-background">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <h3 className="text-lg font-medium">Orchestrator Chat</h3>
        </div>
      </div>
      <div className={`flex-1 overflow-auto p-4 space-y-3`}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in-0 slide-in-from-bottom-3 duration-300`}
          >
            {message.role !== "user" && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1">
                <Brain className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 shadow-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-muted rounded-tl-none"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
              <div
                className={`text-xs mt-1 opacity-70 text-right ${
                  message.role === "user"
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {message.role === "user" && (
              <div className="h-8 w-8 rounded-full ml-2 mt-1">
                <Avatar className="h-8 w-8">
                  {session?.user?.image ? (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name || "User"}
                    />
                  ) : (
                    <AvatarFallback>
                      {getInitials(session?.user?.name || "User")}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-3">
        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2 border">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hover:bg-primary/10 flex items-center justify-center"
            onClick={handleAttachment}
          >
            <Paperclip className="h-5 w-5 text-muted-foreground" />
          </Button>

          {/* Text Input */}
          <Textarea
            placeholder="Ask the Orchestrator Agent..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[40px] max-h-[120px] flex-1 border-0 focus-visible:ring-0 
                focus-visible:ring-offset-0 resize-none bg-transparent text-sm leading-relaxed"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          {/* Send Button */}
          <Button
            size="icon"
            className={`h-9 w-9 rounded-full flex items-center justify-center 
                ${
                  !input.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90"
                }`}
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </div>

        {/* Instruction Text */}
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Press <span className="font-medium">Enter</span> to send,{" "}
          <span className="font-medium">Shift+Enter</span> for new line
        </div>
      </div>
    </div>
  );
}

function NodeDetailsPanel({
  agent,
  onClose,
  onUpdate,
}: {
  agent: Agent | null;
  onClose: () => void;
  onUpdate: (updatedAgent: Agent) => void;
}) {
  const [prompt, setPrompt] = useState(agent?.prompt || "");
  const [isEditing, setIsEditing] = useState(false);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleUpdate = () => {
    if (agent) {
      onUpdate({ ...agent, prompt });
      setIsEditing(false);
      toast.success("Prompt updated");
    }
  };

  const handleCancel = () => {
    setPrompt(agent?.prompt || "");
    setIsEditing(false);
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="flex h-full flex-col border rounded-lg bg-background">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BrainCog className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{agent.name}</h3>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1">
              <FileInput className="h-4 w-4 text-primary" />
              Inputs
            </h4>
            <div className="bg-muted/50 rounded-lg p-2 text-sm">
              {agent.inputs.length > 0 ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {agent.inputs.map((input, index) => (
                    <li key={index} className="text-sm">
                      {input}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No inputs defined
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-1">
              <FileOutput className="h-4 w-4 text-primary" />
              Outputs
            </h4>
            <div className="bg-muted/50 rounded-lg p-2 text-sm">
              {agent.outputs.length > 0 ? (
                <ul className="list-disc list-inside text-sm space-y-1">
                  {agent.outputs.map((output, index) => (
                    <li key={index} className="text-sm">
                      {output}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  No outputs defined
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-primary" />
              Prompt
            </h4>
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleUpdate}>
                  Save
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <Textarea
              className="min-h-[200px] text-sm whitespace-pre-wrap border border-primary/20 focus-visible:ring-primary/20"
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Enter the agent's prompt..."
            />
          ) : (
            <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-[300px] overflow-auto border">
              {prompt || (
                <span className="text-muted-foreground italic">
                  No prompt defined
                </span>
              )}
            </div>
          )}
        </div>
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
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<"flow" | "details" | "chat">(
    "flow"
  );

  // Check if screen is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

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

  const handleAgentUpdate = async (updatedAgent: Agent) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/workflows/${params.id}/agents/${updatedAgent.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: updatedAgent.prompt }),
        }
      );

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

  const handleNodeClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowNodeDetails(true);
    if (isMobile) {
      setActiveTab("details");
    }
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

  // Mobile layout
  if (isMobile) {
    return (
      <div className="container py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{workflow.name}</h1>
            <p className="text-xs text-muted-foreground">
              {workflow.description}
            </p>
          </div>
          <Button size="sm">
            <Play className="mr-2 h-3 w-3" /> Run
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "flow" | "details" | "chat")
          }
          className="space-y-2"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flow" className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 22h14"></path>
                <path d="M5 2h14"></path>
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path>
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path>
              </svg>
              Workflow
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Chat
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="flow"
            className="h-[calc(100vh-14rem)] border rounded-lg overflow-hidden"
          >
            {workflow && (
              <WorkflowVisualizer
                workflow={workflow}
                onNodeClick={handleNodeClick}
              />
            )}
          </TabsContent>

          <TabsContent value="chat" className="h-[calc(100vh-14rem)]">
            <ChatPanel
              isCollapsed={false}
              onToggle={() => {}}
              isMobile={true}
            />
          </TabsContent>

          <TabsContent value="details" className="h-[calc(100vh-14rem)]">
            {showNodeDetails ? (
              <NodeDetailsPanel
                agent={selectedAgent}
                onClose={() => {
                  setShowNodeDetails(false);
                  setActiveTab("flow");
                }}
                onUpdate={handleAgentUpdate}
              />
            ) : (
              <div className="flex h-full items-center justify-center border rounded-lg p-4">
                <div className="text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-4 text-muted-foreground"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                  <h3 className="text-lg font-medium mb-2">
                    No Agent Selected
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Click on a node in the workflow to view agent details
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop layout
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

      <div className="grid grid-cols-3 gap-4 h-[calc(100%-4rem)]">
        {/* Main workflow visualization - takes 2/3 of the screen */}
        <div className="col-span-2 rounded-lg border overflow-hidden">
          {workflow && (
            <WorkflowVisualizer
              workflow={workflow}
              onNodeClick={handleNodeClick}
            />
          )}
        </div>

        {/* Right sidebar - takes 1/3 of the screen */}
        <div className="col-span-1 flex flex-col gap-4">
          {showNodeDetails && (
            <div className="flex-1">
              <NodeDetailsPanel
                agent={selectedAgent}
                onClose={() => setShowNodeDetails(false)}
                onUpdate={handleAgentUpdate}
              />
            </div>
          )}

          <div className={showNodeDetails ? "flex-1" : "h-full"}>
            <ChatPanel
              isCollapsed={isChatCollapsed}
              onToggle={() => setIsChatCollapsed(!isChatCollapsed)}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
