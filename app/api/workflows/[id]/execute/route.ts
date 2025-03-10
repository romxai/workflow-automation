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
    console.log(
      `\n[DEBUG] API: Starting workflow execution for workflow ID: ${params.id}`
    );

    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log(`[DEBUG] API: Unauthorized execution attempt`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the workflow
    const workflow = await getWorkflowById(params.id, session.user.id);

    if (!workflow) {
      console.log(`[DEBUG] API: Workflow not found: ${params.id}`);
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    console.log(`[DEBUG] API: Found workflow: ${workflow.name}`);
    console.log(`[DEBUG] API: Workflow has ${workflow.agents.length} agents`);

    // Get the input data from the request
    const inputData = await request.json();
    console.log(`[DEBUG] API: Received input data:`, inputData);

    // Create a unique execution ID
    const executionId = `${params.id}-${Date.now()}`;
    console.log(`[DEBUG] API: Created execution ID: ${executionId}`);

    // Create an orchestrator instance
    const orchestrator = new Orchestrator(workflow);
    await orchestrator.initialize();
    console.log(`[DEBUG] API: Orchestrator initialized`);

    // Store the orchestrator instance
    activeExecutions.set(executionId, {
      orchestrator,
      updates: [],
    });

    // Set up update callback
    orchestrator.setUpdateCallback((update) => {
      console.log(
        `[DEBUG] API: Received update from orchestrator: ${update.type} - ${update.message}`
      );
      const execution = activeExecutions.get(executionId);
      if (execution) {
        execution.updates.push(update);
      }
    });

    // Execute the workflow asynchronously
    executeWorkflow(params.id, inputData, session.user.id)
      .then((result) => {
        console.log(
          `[DEBUG] API: Workflow execution completed for ID: ${executionId}`
        );
        console.log(`[DEBUG] API: Results:`, result);

        // Add a complete update to the execution
        const execution = activeExecutions.get(executionId);
        if (execution) {
          // Check if we already have a complete update
          const hasCompleteUpdate = execution.updates.some(
            (update) => update.type === "complete" || update.type === "error"
          );

          // If not, add one
          if (!hasCompleteUpdate) {
            console.log(
              `[DEBUG] API: Adding completion update for execution ID: ${executionId}`
            );
            execution.updates.push({
              type: "complete",
              message: "Workflow execution completed successfully",
              data: { results: result.results },
              timestamp: new Date(),
            });
          }
        }

        // Keep execution data for 1 hour, then clean up
        setTimeout(() => {
          console.log(
            `[DEBUG] API: Cleaning up execution data for ID: ${executionId}`
          );
          activeExecutions.delete(executionId);
        }, 3600000);
      })
      .catch((error) => {
        console.error(
          `[DEBUG] API: Async workflow execution error for ID: ${executionId}:`,
          error
        );

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
    console.log(`[DEBUG] API: Returning execution ID: ${executionId}`);
    return NextResponse.json({
      executionId,
      message: "Workflow execution started",
    });
  } catch (error) {
    console.error("[DEBUG] API: Error starting workflow execution:", error);
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
      console.log(`[DEBUG] API: Unauthorized execution updates request`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the execution ID from query params
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get("executionId");

    if (!executionId) {
      console.log(`[DEBUG] API: Missing execution ID in request`);
      return NextResponse.json(
        { error: "Execution ID is required" },
        { status: 400 }
      );
    }

    console.log(
      `[DEBUG] API: Fetching updates for execution ID: ${executionId}`
    );

    // Get the execution data
    const execution = activeExecutions.get(executionId);

    if (!execution) {
      console.log(
        `[DEBUG] API: Execution not found or expired: ${executionId}`
      );
      return NextResponse.json(
        { error: "Execution not found or expired" },
        { status: 404 }
      );
    }

    // Check if execution is complete
    const isComplete = execution.updates.some(
      (update) => update.type === "complete" || update.type === "error"
    );

    console.log(
      `[DEBUG] API: Found ${execution.updates.length} updates for execution ID: ${executionId}, isComplete: ${isComplete}`
    );

    // Return the updates
    return NextResponse.json({
      updates: execution.updates,
      isComplete,
    });
  } catch (error) {
    console.error("[DEBUG] API: Error getting execution updates:", error);
    return NextResponse.json(
      {
        error: "Failed to get execution updates",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
