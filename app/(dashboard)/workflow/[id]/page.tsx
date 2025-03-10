"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Play,
  Send,
  Settings,
  X,
  MessageSquare,
  Pencil,
  FileInput,
  FileOutput,
  Brain,
  BrainCog,
  BrainCircuit,
  Square,
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
import { ExecutionUpdate } from "@/lib/services/orchestrator";

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

function ChatPanel({
  workflowId,
  isExecuting,
  executionUpdates,
  executionStatus,
  onInterrupt,
}: {
  workflowId: string;
  isExecuting: boolean;
  executionUpdates: ExecutionUpdate[];
  executionStatus: "idle" | "executing" | "finished" | "failed";
  onInterrupt: () => void;
}) {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "I'm the Orchestrator Agent. I'll show you the progress of your workflow execution here. When you run the workflow, you'll see detailed updates about each agent's execution, including inputs, outputs, and reasoning.",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedUpdates = useRef<Set<string>>(new Set());

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Add execution updates to messages
  useEffect(() => {
    if (executionUpdates.length > 0) {
      console.log(
        "[DEBUG] ChatPanel: Processing execution updates:",
        executionUpdates.length
      );

      // Process only new updates
      const newUpdates = executionUpdates.filter((update) => {
        const timestamp =
          typeof update.timestamp === "string"
            ? update.timestamp
            : update.timestamp instanceof Date
            ? update.timestamp.toISOString()
            : String(update.timestamp);
        const updateKey = `${update.type}-${timestamp}`;

        if (!processedUpdates.current.has(updateKey)) {
          processedUpdates.current.add(updateKey);
          return true;
        }
        return false;
      });

      if (newUpdates.length > 0) {
        console.log(
          `[DEBUG] ChatPanel: Found ${newUpdates.length} new updates to display`
        );

        const messagesToAdd = newUpdates.map((update) => {
          // Create a message that mirrors the console log format
          let content = `[${update.type}] ${update.message}`;

          // Add data details based on update type
          if (update.type === "start") {
            // No additional content needed for start updates
          } else if (update.type === "agent-start" && update.agent) {
            content += `\nExecuting agent: ${update.agent.name} with inputs:`;
            if (update.data && update.data.inputs) {
              console.log(
                `[DEBUG] ChatPanel: Agent start inputs:`,
                update.data.inputs
              );
              content += `\n\`\`\`json\n${JSON.stringify(
                update.data.inputs,
                null,
                2
              )}\n\`\`\``;
            }
          } else if (update.type === "agent-complete" && update.agent) {
            content += `\nAgent ${update.agent.name} execution completed with result:`;
            if (
              update.data &&
              update.data.outputs &&
              update.data.outputs.result
            ) {
              console.log(
                `[DEBUG] ChatPanel: Agent complete outputs:`,
                update.data.outputs.result
              );
              content += `\n\`\`\`json\n${JSON.stringify(
                update.data.outputs.result,
                null,
                2
              )}\n\`\`\``;
            }
            if (update.data && update.data.reasoning) {
              content += `\n\nReasoning:\n${update.data.reasoning}`;
            }
          } else if (
            update.type === "complete" &&
            update.data &&
            update.data.results
          ) {
            content += `\nWorkflow execution completed with results:`;
            console.log(
              `[DEBUG] ChatPanel: Workflow complete results:`,
              update.data.results
            );
            content += `\n\`\`\`json\n${JSON.stringify(
              update.data.results,
              null,
              2
            )}\n\`\`\``;
          } else if (update.type === "error") {
            content += `\nError: ${update.data?.error || "Unknown error"}`;
          }

          return { role: "system", content };
        });

        setMessages((prev) => [...prev, ...messagesToAdd]);

        // Ensure scroll to bottom after adding messages
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    }
  }, [executionUpdates]);

  // Add a final message when workflow is finished
  useEffect(() => {
    if (
      executionStatus === "finished" &&
      !processedUpdates.current.has("workflow-finished")
    ) {
      processedUpdates.current.add("workflow-finished");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "🎉 Workflow execution finished successfully!",
        },
      ]);
    } else if (
      executionStatus === "failed" &&
      !processedUpdates.current.has("workflow-failed")
    ) {
      processedUpdates.current.add("workflow-failed");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: "❌ Workflow execution failed!",
        },
      ]);
    }
  }, [executionStatus]);

  return (
    <div className="flex flex-col border rounded-lg bg-background h-[calc(100vh-12rem)]">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <h3 className="text-lg font-medium">Orchestrator Chat</h3>
          {executionStatus === "executing" && (
            <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
              Executing
            </span>
          )}
          {executionStatus === "finished" && (
            <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded-full">
              Finished
            </span>
          )}
          {executionStatus === "failed" && (
            <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
              Failed
            </span>
          )}
        </div>
        {isExecuting && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onInterrupt}
            className="flex items-center gap-1"
          >
            <Square className="h-3 w-3" />
            Interrupt
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-full">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex justify-start animate-in fade-in-0 slide-in-from-bottom-3 duration-300`}
          >
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <Settings className="h-4 w-4 text-primary" />
            </div>

            <div className="max-w-[90%] rounded-lg px-4 py-2.5 shadow-sm bg-muted rounded-tl-none">
              <div className="text-sm whitespace-pre-wrap break-words overflow-x-auto">
                {typeof message.content === "object"
                  ? JSON.stringify(message.content, null, 2)
                  : message.content.includes("```json")
                  ? message.content.split("```json").map((part, i) => {
                      if (i % 2 === 0) {
                        return <span key={i}>{part}</span>;
                      } else {
                        try {
                          const jsonContent = part.split("```")[0];
                          return (
                            <pre
                              key={i}
                              className="bg-black/10 p-2 rounded my-2 overflow-x-auto"
                            >
                              <code>{jsonContent}</code>
                            </pre>
                          );
                        } catch (e) {
                          return (
                            <pre
                              key={i}
                              className="bg-black/10 p-2 rounded my-2 overflow-x-auto"
                            >
                              {part}
                            </pre>
                          );
                        }
                      }
                    })
                  : message.content.includes("```")
                  ? message.content.split("```").map((part, i) => {
                      if (i % 2 === 0) {
                        return <span key={i}>{part}</span>;
                      } else {
                        return (
                          <pre
                            key={i}
                            className="bg-black/10 p-2 rounded my-2 overflow-x-auto"
                          >
                            <code>{part}</code>
                          </pre>
                        );
                      }
                    })
                  : message.content}
              </div>
              <div className="text-xs mt-1 opacity-70 text-right text-muted-foreground">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="text-xs text-muted-foreground text-center">
          {executionStatus === "idle" &&
            "Click 'Run Workflow' to start execution"}
          {executionStatus === "executing" &&
            "Workflow is currently executing..."}
          {executionStatus === "finished" &&
            "Workflow execution completed successfully"}
          {executionStatus === "failed" && "Workflow execution failed"}
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
  const [prompt, setPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Update prompt when agent changes
  useEffect(() => {
    if (agent) {
      setPrompt(agent.prompt || "");
    }
  }, [agent]);

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
    if (agent) {
      setPrompt(agent.prompt || "");
    }
    setIsEditing(false);
  };

  if (!agent) {
    return (
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
          <h3 className="text-lg font-medium mb-2">No Agent Selected</h3>
          <p className="text-sm text-muted-foreground">
            Click on a node in the workflow to view agent details
          </p>
        </div>
      </div>
    );
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

// Input Dialog for workflow execution
function WorkflowInputDialog({
  isOpen,
  onClose,
  onSubmit,
  firstAgent,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inputs: Record<string, string>) => void;
  firstAgent: Agent | null;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && firstAgent) {
      // Initialize inputs with empty strings for each required input
      const initialInputs: Record<string, string> = {};
      firstAgent.inputs.forEach((input) => {
        initialInputs[input] = "";
      });
      setInputs(initialInputs);
    }
  }, [isOpen, firstAgent]);

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(inputs);
    onClose();
  };

  if (!isOpen || !firstAgent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Workflow Inputs</h2>
        <p className="text-muted-foreground mb-4">
          Please provide the following inputs for the first agent (
          {firstAgent.name}):
        </p>

        <div className="space-y-4">
          {firstAgent.inputs.map((input) => (
            <div key={input} className="space-y-2">
              <label className="text-sm font-medium">{input}</label>
              <Textarea
                value={inputs[input] || ""}
                onChange={(e) => handleInputChange(input, e.target.value)}
                placeholder={`Enter ${input}...`}
                className="w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Start Execution</Button>
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

  // Workflow execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionUpdates, setExecutionUpdates] = useState<ExecutionUpdate[]>(
    []
  );
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [firstAgent, setFirstAgent] = useState<Agent | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add execution status state
  const [executionStatus, setExecutionStatus] = useState<
    "idle" | "executing" | "finished" | "failed"
  >("idle");

  // Add a ref to track if execution is complete
  const executionCompleteRef = useRef<boolean>(false);

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

  // Close agent details when chat is collapsed
  useEffect(() => {
    if (isChatCollapsed) {
      setShowNodeDetails(false);
    }
  }, [isChatCollapsed]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

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

      // Find the first agent (with no incoming connections)
      if (data.agents.length > 0) {
        const incomingConnections = new Set(
          data.flow.connections.map((conn: any) => conn.to)
        );

        const startingAgents = data.agents.filter(
          (agent: Agent) => !incomingConnections.has(agent.id)
        );

        if (startingAgents.length > 0) {
          setFirstAgent(startingAgents[0]);
        } else {
          // If no clear starting agent, use the first one
          setFirstAgent(data.agents[0]);
        }
      }

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
    console.log("Node clicked in page component:", agent);
    // Make a deep copy of the agent to avoid reference issues
    const agentCopy = JSON.parse(JSON.stringify(agent));
    setSelectedAgent(agentCopy);
    setShowNodeDetails(true);
    if (isMobile) {
      setActiveTab("details");
    }
  };

  const handleRunWorkflow = () => {
    if (firstAgent && firstAgent.inputs.length > 0) {
      setShowInputDialog(true);
    } else {
      startWorkflowExecution({});
    }
  };

  const startWorkflowExecution = async (inputs: Record<string, string>) => {
    try {
      console.log("[DEBUG] Starting workflow execution with inputs:", inputs);
      setIsExecuting(true);
      setExecutionStatus("executing");
      setExecutionUpdates([]);
      // Reset the execution complete flag
      executionCompleteRef.current = false;

      // Clean up any existing inputs to ensure proper format
      const formattedInputs: Record<string, string> = {};
      Object.entries(inputs).forEach(([key, value]) => {
        // Remove any type annotations from the key
        const cleanKey = key.split(":")[0].trim();
        formattedInputs[cleanKey] = value;
      });

      console.log("[DEBUG] Formatted inputs:", formattedInputs);

      // Start the workflow execution
      const response = await fetch(`/api/workflows/${params.id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedInputs),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DEBUG] Failed to start workflow execution:", errorData);
        throw new Error(
          `Failed to start workflow execution: ${
            errorData.error || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log(
        "[DEBUG] Workflow execution started with ID:",
        data.executionId
      );
      setExecutionId(data.executionId);

      // Start polling for updates
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      pollingIntervalRef.current = setInterval(() => {
        fetchExecutionUpdates(data.executionId);
      }, 1000);

      toast.success("Workflow execution started");
    } catch (error) {
      console.error("[DEBUG] Error starting workflow execution:", error);
      toast.error("Failed to start workflow execution");
      setIsExecuting(false);
      setExecutionStatus("failed");
    }
  };

  const fetchExecutionUpdates = async (execId: string) => {
    // Skip if we already know execution is complete
    if (executionCompleteRef.current) {
      console.log("[DEBUG] Skipping update fetch - execution already complete");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    try {
      console.log(`[DEBUG] Fetching execution updates for ID: ${execId}`);
      const response = await fetch(
        `/api/workflows/${params.id}/execute?executionId=${execId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DEBUG] Failed to fetch execution updates:", errorData);
        throw new Error(
          `Failed to fetch execution updates: ${
            errorData.error || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log(
        `[DEBUG] Received ${data.updates.length} execution updates, isComplete: ${data.isComplete}`
      );

      // Process the updates
      if (data.updates && data.updates.length > 0) {
        setExecutionUpdates(data.updates);
      }

      // If execution is complete or has error, stop polling and update status
      if (data.isComplete) {
        console.log("[DEBUG] Workflow execution is complete, stopping polling");
        executionCompleteRef.current = true;

        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }

        // Check if execution completed successfully or with error
        const hasError = data.updates.some(
          (update: ExecutionUpdate) => update.type === "error"
        );
        if (hasError) {
          console.log("[DEBUG] Workflow execution failed");
          setIsExecuting(false);
          setExecutionStatus("failed");
          toast.error("Workflow execution failed");
        } else {
          console.log("[DEBUG] Workflow execution completed successfully");
          setIsExecuting(false);
          setExecutionStatus("finished");
          toast.success("Workflow execution completed");
        }
      }
    } catch (error) {
      console.error("[DEBUG] Error fetching execution updates:", error);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsExecuting(false);
      setExecutionStatus("failed");
      toast.error("Error monitoring workflow execution");
    }
  };

  // Add a separate useEffect for cleanup
  useEffect(() => {
    // Cleanup function to clear interval when component unmounts
    return () => {
      if (pollingIntervalRef.current) {
        console.log("[DEBUG] Cleaning up polling interval on unmount");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Add the interrupt handler function
  const handleInterruptWorkflow = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setIsExecuting(false);
    setExecutionStatus("failed");

    // Create an interrupt update that will be displayed in the chat
    const interruptUpdate: ExecutionUpdate = {
      type: "error",
      message: "Workflow execution was manually interrupted",
      timestamp: new Date(),
    };

    // Add the update to the execution updates
    setExecutionUpdates((prev) => [...prev, interruptUpdate]);

    toast.info("Workflow execution interrupted");
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
          <Button
            size="sm"
            onClick={handleRunWorkflow}
            disabled={isExecuting}
            className={
              executionStatus === "failed"
                ? "bg-red-500 hover:bg-red-600"
                : executionStatus === "finished"
                ? "bg-green-500 hover:bg-green-600"
                : undefined
            }
          >
            {isExecuting ? (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            ) : (
              <Play className="mr-2 h-3 w-3" />
            )}
            {executionStatus === "executing"
              ? "Running..."
              : executionStatus === "finished"
              ? "Finished"
              : executionStatus === "failed"
              ? "Failed"
              : "Run"}
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
            <TabsTrigger
              value="details"
              className="flex items-center gap-1"
              disabled={!showNodeDetails}
            >
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
              workflowId={params.id}
              isExecuting={isExecuting}
              executionUpdates={executionUpdates}
              executionStatus={executionStatus}
              onInterrupt={handleInterruptWorkflow}
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

        {/* Input Dialog */}
        <WorkflowInputDialog
          isOpen={showInputDialog}
          onClose={() => setShowInputDialog(false)}
          onSubmit={startWorkflowExecution}
          firstAgent={firstAgent}
        />
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
        <Button
          onClick={handleRunWorkflow}
          disabled={isExecuting}
          className={
            executionStatus === "failed"
              ? "bg-red-500 hover:bg-red-600"
              : executionStatus === "finished"
              ? "bg-green-500 hover:bg-green-600"
              : undefined
          }
        >
          {isExecuting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {executionStatus === "executing"
            ? "Running Workflow..."
            : executionStatus === "finished"
            ? "Workflow Finished"
            : executionStatus === "failed"
            ? "Workflow Failed"
            : "Run Workflow"}
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
              workflowId={params.id}
              isExecuting={isExecuting}
              executionUpdates={executionUpdates}
              executionStatus={executionStatus}
              onInterrupt={handleInterruptWorkflow}
            />
          </div>
        </div>
      </div>

      {/* Input Dialog */}
      <WorkflowInputDialog
        isOpen={showInputDialog}
        onClose={() => setShowInputDialog(false)}
        onSubmit={startWorkflowExecution}
        firstAgent={firstAgent}
      />
    </div>
  );
}
