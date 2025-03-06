import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { executeWorkflow, getWorkflowById } from "@/lib/services/workflow";

// POST /api/workflows/[id]/execute - Execute a workflow
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

    // Get the input data from the request
    const inputData = await request.json();

    // Execute the workflow
    const result = await executeWorkflow(params.id, inputData, session.user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to execute workflow",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
