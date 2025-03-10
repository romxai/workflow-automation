import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getWorkflowById } from "@/lib/services/workflow";
import { Orchestrator } from "@/lib/services/orchestrator";

// POST /api/workflows/[id]/chat - Chat with the orchestrator
// This endpoint is currently disabled as we're focusing on workflow execution updates
/*
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

    // Get the message from the request
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Create an orchestrator instance
    const orchestrator = new Orchestrator(workflow);
    await orchestrator.initialize();

    // Chat with the orchestrator
    const response = await orchestrator.chatWithOrchestrator(message);

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error chatting with orchestrator:", error);
    return NextResponse.json(
      {
        error: "Failed to chat with orchestrator",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
*/
