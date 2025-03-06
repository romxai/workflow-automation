import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { createWorkflow, getUserWorkflows } from "@/lib/services/workflow";
import { WorkflowInput } from "@/lib/models/workflow";

// GET /api/workflows - Get all workflows for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's workflows
    const workflows = await getUserWorkflows(session.user.id);

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error getting workflows:", error);
    return NextResponse.json(
      { error: "Failed to get workflows" },
      { status: 500 }
    );
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the workflow data from the request
    const workflowInput: WorkflowInput = await request.json();

    // Validate the input
    if (!workflowInput.name || !workflowInput.problemStatement) {
      return NextResponse.json(
        { error: "Name and problem statement are required" },
        { status: 400 }
      );
    }

    // Create the workflow
    const workflow = await createWorkflow(workflowInput, session.user.id);

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json(
      { error: "Failed to create workflow" },
      { status: 500 }
    );
  }
}
