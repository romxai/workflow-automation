import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { getWorkflowById, updateWorkflow } from "@/lib/services/workflow";

// PUT /api/workflows/[id]/agents/[agentId] - Update a specific agent in a workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; agentId: string } }
) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the workflow
    const workflow = await getWorkflowById(params.id, session.user.id);

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Find the agent in the workflow
    const agent = workflow.agents.find((a) => a.id === params.agentId);

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Get the new prompt from the request body
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Update the agent in the workflow
    const updatedAgents = workflow.agents.map((a) =>
      a.id === params.agentId ? { ...a, prompt } : a
    );

    // Update the workflow with the new agents
    await updateWorkflow(
      params.id,
      { agents: updatedAgents },
      session.user.id
    );

    // Return the updated agent
    return NextResponse.json({
      ...agent,
      prompt,
    });
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      {
        error: "Failed to update agent",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}