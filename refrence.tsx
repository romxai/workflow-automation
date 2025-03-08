"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Play, Send, Settings, X } from "lucide-react";
import { useState } from "react";

// Mock data for the workflow
const workflowData = {
  id: "1",
  name: "Text Analysis Pipeline",
  description: "Analyzes text sentiment and extracts key entities",
  nodes: [
    {
      id: "1",
      type: "input",
      name: "Text Input",
      description: "Receives text input from the user",
      position: { x: 100, y: 100 },
    },
    {
      id: "2",
      type: "process",
      name: "Sentiment Analysis",
      description: "Analyzes the sentiment of the text",
      position: { x: 300, y: 100 },
    },
    {
      id: "3",
      type: "process",
      name: "Entity Extraction",
      description: "Extracts entities from the text",
      position: { x: 500, y: 100 },
    },
    {
      id: "4",
      type: "output",
      name: "Result Formatter",
      description: "Formats the results for display",
      position: { x: 700, y: 100 },
    },
  ],
};

// Mock component for the workflow editor
function WorkflowEditor() {
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

      {/* Placeholder for the workflow nodes */}
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-wrap gap-8 p-8">
          {workflowData.nodes.map((node, index) => (
            <Card
              key={node.id}
              className="flex h-32 w-48 flex-col p-4 shadow-md"
            >
              <div className="mb-2 text-sm font-medium">{node.name}</div>
              <div className="text-xs text-muted-foreground">
                {node.description}
              </div>
              {index < workflowData.nodes.length - 1 && (
                <ChevronRight className="absolute -right-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mock component for the node details panel
function NodeDetailsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-medium">Node Details</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Node Name</label>
              <input
                type="text"
                className="w-full rounded-md border px-3 py-2"
                defaultValue="Sentiment Analysis"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                className="min-h-[100px]"
                defaultValue="Analyzes the sentiment of the text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <select className="w-full rounded-md border px-3 py-2">
                <option>GPT-4</option>
                <option>Claude 3</option>
                <option>Llama 3</option>
              </select>
            </div>
          </TabsContent>
          <TabsContent value="code" className="space-y-4">
            <Textarea
              className="min-h-[300px] font-mono"
              defaultValue={`function processText(input) {\n  // Analyze sentiment\n  const sentiment = analyzeSentiment(input);\n  return {\n    score: sentiment.score,\n    label: sentiment.label\n  };\n}`}
            />
          </TabsContent>
        </Tabs>
      </div>
      <div className="border-t p-4">
        <Button className="w-full">Save Changes</Button>
      </div>
    </div>
  );
}

// Mock component for the chat panel
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

export default function WorkflowPage({ params }: { params: { id: string } }) {
  const [showNodeDetails, setShowNodeDetails] = useState(false);
  const [showChat, setShowChat] = useState(true);

  return (
    <div className="container h-[calc(100vh-4rem)] py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workflowData.name}</h1>
          <p className="text-muted-foreground">{workflowData.description}</p>
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
          <WorkflowEditor />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={30} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            {showNodeDetails && (
              <>
                <ResizablePanel defaultSize={50}>
                  <NodeDetailsPanel onClose={() => setShowNodeDetails(false)} />
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
