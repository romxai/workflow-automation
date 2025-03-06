import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getWorkflowById, updateWorkflow } from "@/lib/services/workflow";
import { Agent } from "@/lib/models/workflow";
import { ObjectId } from "mongodb";

// PATCH /api/workflows/[id]/agents - Update agents in a workflow
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get the updated agents from the request
    const { agents } = await request.json();

    if (!agents || !Array.isArray(agents)) {
      return NextResponse.json(
        { error: "Agents must be an array" },
        { status: 400 }
      );
    }

    // Update the workflow with the new agents
    const updatedWorkflow = await updateWorkflow(
      params.id,
      { agents },
      session.user.id
    );

    if (!updatedWorkflow) {
      return NextResponse.json(
        { error: "Failed to update workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Error updating agents:", error);
    return NextResponse.json(
      {
        error: "Failed to update agents",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/workflows/[id]/agents - Add a new agent to a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get the new agent from the request
    const agent = await request.json();

    // Validate the agent
    if (!agent.name || !agent.prompt || !agent.inputs || !agent.outputs) {
      return NextResponse.json(
        { error: "Agent is missing required fields" },
        { status: 400 }
      );
    }

    // Generate a unique ID for the agent if not provided
    if (!agent.id) {
      agent.id = new ObjectId().toString();
    }

    // Add the agent to the workflow
    const updatedAgents = [...workflow.agents, agent];

    // Update the workflow with the new agents
    const updatedWorkflow = await updateWorkflow(
      params.id,
      { agents: updatedAgents },
      session.user.id
    );

    if (!updatedWorkflow) {
      return NextResponse.json(
        { error: "Failed to update workflow" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Error adding agent:", error);
    return NextResponse.json(
      {
        error: "Failed to add agent",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
