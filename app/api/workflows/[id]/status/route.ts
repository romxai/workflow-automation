import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { getWorkflowById } from "@/lib/services/workflow";

// GET /api/workflows/[id]/status - Get workflow status
export async function GET(
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

    // Return the workflow status
    return NextResponse.json({
      id: workflow._id,
      name: workflow.name,
      status: workflow.status,
      lastRun: workflow.lastRun,
      agentCount: workflow.agents.length,
      connectionCount: workflow.flow.connections.length,
    });
  } catch (error) {
    console.error("Error getting workflow status:", error);
    return NextResponse.json(
      {
        error: "Failed to get workflow status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
