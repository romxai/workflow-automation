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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { Workflow } from "@/lib/models/workflow";

interface WorkflowExecuteDialogProps {
  workflow: Workflow;
}

export function WorkflowExecuteDialog({
  workflow,
}: WorkflowExecuteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);

  // Get all unique input fields from all agents
  const allInputs = Array.from(
    new Set(workflow.agents.flatMap((agent) => agent.inputs))
  );

  const handleInputChange = (key: string, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/workflows/${workflow._id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute workflow");
      }

      const data = await response.json();
      setResult(data);
      toast.success("Workflow executed successfully");
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to execute workflow"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Run Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execute Workflow: {workflow.name}</DialogTitle>
          <DialogDescription>
            Provide inputs for the workflow and execute it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Inputs</h3>
            {allInputs.length > 0 ? (
              allInputs.map((input) => (
                <div key={input} className="space-y-2">
                  <Label htmlFor={input}>{input}</Label>
                  <Input
                    id={input}
                    value={inputs[input] || ""}
                    onChange={(e) => handleInputChange(input, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">
                No inputs required for this workflow.
              </p>
            )}
          </div>

          <Button
            onClick={handleExecute}
            disabled={isLoading}
            className="w-full mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Execute Workflow
              </>
            )}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Results</h3>
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-[300px]">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(result.results, null, 2)}
                </pre>
              </div>

              <h3 className="text-lg font-medium">Agent Outputs</h3>
              <div className="space-y-4">
                {Object.entries(result.agentOutputs).map(
                  ([agentId, output]) => {
                    const agent = workflow.agents.find((a) => a.id === agentId);
                    return (
                      <div key={agentId} className="bg-muted p-4 rounded-md">
                        <h4 className="font-medium mb-2">
                          {agent?.name || agentId}
                        </h4>
                        <pre className="text-sm whitespace-pre-wrap">
                          {JSON.stringify(output, null, 2)}
                        </pre>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
