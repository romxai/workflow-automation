"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Bug, Play, Wand2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Agent } from "@/lib/models/workflow";

export default function BuilderDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<Agent>({
    id: "debug-agent",
    name: "Debug Agent",
    description: "A test agent for debugging purposes",
    role: "Testing and debugging",
    prompt:
      "You are a helpful assistant. Answer the following question: {{question}}",
    inputs: ["question"],
    outputs: ["answer"],
  });
  const [inputs, setInputs] = useState<Record<string, string>>({
    question: "What is the capital of France?",
  });
  const [result, setResult] = useState<any>(null);
  const [improvedPrompt, setImprovedPrompt] = useState<string>("");

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleAgentChange = (field: keyof Agent, value: any) => {
    setAgent((prev) => ({ ...prev, [field]: value }));
  };

  const handleInputsChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleInputsListChange = (value: string) => {
    try {
      const inputsList = value.split(",").map((item) => item.trim());
      setAgent((prev) => ({ ...prev, inputs: inputsList }));
    } catch (error) {
      toast.error("Invalid inputs format");
    }
  };

  const handleOutputsListChange = (value: string) => {
    try {
      const outputsList = value.split(",").map((item) => item.trim());
      setAgent((prev) => ({ ...prev, outputs: outputsList }));
    } catch (error) {
      toast.error("Invalid outputs format");
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/builder/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent,
          inputs,
          action: "execute",
        }),
      });

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
      const response = await fetch("/api/builder/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent,
          action: "generate-prompt",
        }),
      });

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
      const response = await fetch("/api/builder/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent,
          inputs,
          action: "debug",
        }),
      });

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

  const handleUpdateAgent = () => {
    if (!improvedPrompt) {
      toast.error("No improved prompt to update");
      return;
    }

    setAgent((prev) => ({ ...prev, prompt: improvedPrompt }));
    toast.success("Agent updated with improved prompt");
  };

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
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
        <h1 className="text-3xl font-bold">Builder Agent Debug</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Configure the agent for testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={agent.name}
                onChange={(e) => handleAgentChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={agent.description}
                onChange={(e) =>
                  handleAgentChange("description", e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={agent.role}
                onChange={(e) => handleAgentChange("role", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inputs">Inputs (comma-separated)</Label>
              <Input
                id="inputs"
                value={agent.inputs.join(", ")}
                onChange={(e) => handleInputsListChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outputs">Outputs (comma-separated)</Label>
              <Input
                id="outputs"
                value={agent.outputs.join(", ")}
                onChange={(e) => handleOutputsListChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                value={agent.prompt}
                onChange={(e) => handleAgentChange("prompt", e.target.value)}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Inputs</CardTitle>
              <CardDescription>
                Provide inputs for testing the agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {agent.inputs.map((input) => (
                <div key={input} className="space-y-2">
                  <Label htmlFor={`input-${input}`}>{input}</Label>
                  <Input
                    id={`input-${input}`}
                    value={inputs[input] || ""}
                    onChange={(e) => handleInputsChange(input, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Test and debug the agent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="execute" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="execute">
                    <Play className="mr-2 h-4 w-4" />
                    Execute
                  </TabsTrigger>
                  <TabsTrigger value="improve">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Improve
                  </TabsTrigger>
                  <TabsTrigger value="debug">
                    <Bug className="mr-2 h-4 w-4" />
                    Debug
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="execute">
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
                </TabsContent>

                <TabsContent value="improve">
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
                </TabsContent>

                <TabsContent value="debug">
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
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Output from the agent execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {improvedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle>Improved Prompt</CardTitle>
                <CardDescription>
                  Generated by the Builder Agent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {improvedPrompt}
                  </pre>
                </div>
                <Button
                  onClick={handleUpdateAgent}
                  disabled={isLoading}
                  className="w-full"
                >
                  Update Agent with Improved Prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
