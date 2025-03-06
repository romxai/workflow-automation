"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Bug, Play, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Agent } from "@/lib/models/workflow";

interface AgentDebugDialogProps {
  workflowId: string;
  agent: Agent;
  onAgentUpdate?: (updatedAgent: Agent) => void;
}

export function AgentDebugDialog({
  workflowId,
  agent,
  onAgentUpdate,
}: AgentDebugDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("execute");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [improvedPrompt, setImprovedPrompt] = useState<string>("");

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/agents/${agent.id}/debug`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs,
            action: "execute",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute agent");
      }

      const data = await response.json();
      setResult(data.result);
      toast.success("Agent executed successfully");
    } catch (error) {
      console.error("Error executing agent:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to execute agent"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePrompt = async () => {
    setIsLoading(true);
    setImprovedPrompt("");

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/agents/${agent.id}/debug`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate-prompt",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate prompt");
      }

      const data = await response.json();
      setImprovedPrompt(data.improvedPrompt);
      toast.success("Prompt generated successfully");
    } catch (error) {
      console.error("Error generating prompt:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate prompt"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebug = async () => {
    setIsLoading(true);
    setResult(null);
    setImprovedPrompt("");

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/agents/${agent.id}/debug`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs,
            action: "debug",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to debug agent");
      }

      const data = await response.json();
      setResult(data.originalResult);
      setImprovedPrompt(data.improvedAgent.prompt);
      toast.success("Agent debugged successfully");
    } catch (error) {
      console.error("Error debugging agent:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to debug agent"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAgent = async () => {
    if (!improvedPrompt) {
      toast.error("No improved prompt to update");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/workflows/${workflowId}/agents/${agent.id}/debug?update=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate-prompt",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update agent");
      }

      const data = await response.json();

      if (onAgentUpdate && data.agent) {
        onAgentUpdate(data.agent);
      }

      toast.success("Agent updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update agent"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Bug className="mr-2 h-4 w-4" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Debug Agent: {agent.name}</DialogTitle>
          <DialogDescription>
            Test and improve the agent's prompt and functionality.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="execute">
              <Play className="mr-2 h-4 w-4" />
              Execute
            </TabsTrigger>
            <TabsTrigger value="improve">
              <Wand2 className="mr-2 h-4 w-4" />
              Improve Prompt
            </TabsTrigger>
            <TabsTrigger value="debug">
              <Bug className="mr-2 h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="execute" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Inputs</h3>
                {agent.inputs.map((input) => (
                  <div key={input} className="mb-4">
                    <Label htmlFor={input}>{input}</Label>
                    <Input
                      id={input}
                      value={inputs[input] || ""}
                      onChange={(e) => handleInputChange(input, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleExecute}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Execute Agent
                  </>
                )}
              </Button>

              {result && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-medium">Result</h3>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="improve" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Current Prompt</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[150px]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {agent.prompt}
                  </pre>
                </div>
              </div>

              <Button
                onClick={handleGeneratePrompt}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Improved Prompt
                  </>
                )}
              </Button>

              {improvedPrompt && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-lg font-medium">Improved Prompt</h3>
                  <div className="bg-muted p-4 rounded-md overflow-auto max-h-[200px]">
                    <pre className="text-sm whitespace-pre-wrap">
                      {improvedPrompt}
                    </pre>
                  </div>

                  <Button
                    onClick={handleUpdateAgent}
                    disabled={isLoading}
                    className="w-full mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Agent with Improved Prompt"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="debug" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Inputs for Testing</h3>
                {agent.inputs.map((input) => (
                  <div key={input} className="mb-4">
                    <Label htmlFor={`debug-${input}`}>{input}</Label>
                    <Input
                      id={`debug-${input}`}
                      value={inputs[input] || ""}
                      onChange={(e) => handleInputChange(input, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={handleDebug}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Debugging...
                  </>
                ) : (
                  <>
                    <Bug className="mr-2 h-4 w-4" />
                    Debug Agent
                  </>
                )}
              </Button>

              {result && improvedPrompt && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Original Result</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-[150px]">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Improved Prompt</h3>
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-[150px]">
                      <pre className="text-sm whitespace-pre-wrap">
                        {improvedPrompt}
                      </pre>
                    </div>
                  </div>

                  <Button
                    onClick={handleUpdateAgent}
                    disabled={isLoading}
                    className="w-full mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Agent with Improved Prompt"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
