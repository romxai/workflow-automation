import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { executeWorkflow, getWorkflowById } from "@/lib/services/workflow";
import { Orchestrator, ExecutionUpdate } from "@/lib/services/orchestrator";

// Map to store active workflow executions
const activeExecutions = new Map<
  string,
  {
    orchestrator: Orchestrator;
    updates: ExecutionUpdate[];
  }
>();

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

    // Create a unique execution ID
    const executionId = `${params.id}-${Date.now()}`;

    // Create an orchestrator instance
    const orchestrator = new Orchestrator(workflow);
    await orchestrator.initialize();

    // Store the orchestrator instance
    activeExecutions.set(executionId, {
      orchestrator,
      updates: [],
    });

    // Set up update callback
    orchestrator.setUpdateCallback((update) => {
      const execution = activeExecutions.get(executionId);
      if (execution) {
        execution.updates.push(update);
      }
    });

    // Execute the workflow asynchronously
    executeWorkflow(params.id, inputData, session.user.id)
      .then((result) => {
        // Add a complete update to the execution
        const execution = activeExecutions.get(executionId);
        if (execution) {
          // Check if we already have a complete update
          const hasCompleteUpdate = execution.updates.some(
            (update) => update.type === "complete" || update.type === "error"
          );

          // If not, add one
          if (!hasCompleteUpdate) {
            execution.orchestrator.setUpdateCallback((update) => {
              execution.updates.push(update);
            });

            // Add a complete update
            execution.updates.push({
              type: "complete",
              message: "Workflow execution completed successfully",
              data: { results: result },
              timestamp: new Date(),
            });
          }
        }

        // Keep execution data for 1 hour, then clean up
        setTimeout(() => {
          activeExecutions.delete(executionId);
        }, 3600000);
      })
      .catch((error) => {
        console.error("Async workflow execution error:", error);

        // Add an error update
        const execution = activeExecutions.get(executionId);
        if (execution) {
          execution.updates.push({
            type: "error",
            message: `Workflow execution failed: ${
              error.message || "Unknown error"
            }`,
            data: { error: error.message || "Unknown error" },
            timestamp: new Date(),
          });
        }
      });

    // Return the execution ID immediately
    return NextResponse.json({
      executionId,
      message: "Workflow execution started",
    });
  } catch (error) {
    console.error("Error starting workflow execution:", error);
    return NextResponse.json(
      {
        error: "Failed to start workflow execution",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// GET /api/workflows/[id]/execute?executionId=xxx - Get execution updates
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

    // Get the execution ID from query params
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get("executionId");

    if (!executionId) {
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    // Get the execution data
    const execution = activeExecutions.get(executionId);

    if (!execution) {
      return NextResponse.json(
        { error: "Execution not found or expired" },
        { status: 404 }
      );
    }

    // Return the updates
    return NextResponse.json({
      updates: execution.updates,
      isComplete: execution.updates.some(
        (update) => update.type === "complete" || update.type === "error"
      ),
    });
  } catch (error) {
    console.error("Error getting execution updates:", error);
    return NextResponse.json(
      {
        error: "Failed to get execution updates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
