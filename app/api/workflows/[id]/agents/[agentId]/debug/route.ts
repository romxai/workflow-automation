import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../auth/[...nextauth]/route";
import { getWorkflowById, updateWorkflow } from "@/lib/services/workflow";
import {
  debugAgent,
  executeAgent,
  generateAgentPrompt,
} from "@/lib/services/builder";

// POST /api/workflows/[id]/agents/[agentId]/debug - Debug a specific agent in a workflow
export async function POST(
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

    // Get the inputs and action from the request
    const { inputs, action } = await request.json();

    // Perform the requested action
    switch (action) {
      case "debug":
        // Debug the agent (generate a better prompt and test it)
        const debugResult = await debugAgent(agent, inputs || {});

        // If the debug was successful and the user wants to update the agent
        if (
          debugResult.success &&
          request.nextUrl.searchParams.get("update") === "true"
        ) {
          // Update the agent in the workflow
          const updatedAgents = workflow.agents.map((a) =>
            a.id === params.agentId ? debugResult.improvedAgent : a
          );

          // Update the workflow with the new agents
          await updateWorkflow(
            params.id,
            { agents: updatedAgents },
            session.user.id
          );

          // Return the debug result with a flag indicating the agent was updated
          return NextResponse.json({
            ...debugResult,
            agentUpdated: true,
          });
        }

        return NextResponse.json(debugResult);

      case "execute":
        // Execute the agent with the provided inputs
        if (!inputs) {
          return NextResponse.json(
            { error: "Inputs are required for execution" },
            { status: 400 }
          );
        }
        const executeResult = await executeAgent(agent, inputs);
        return NextResponse.json({ result: executeResult, success: true });

      case "generate-prompt":
        // Generate a better prompt for the agent
        const improvedPrompt = await generateAgentPrompt(agent);

        // If the user wants to update the agent
        if (request.nextUrl.searchParams.get("update") === "true") {
          // Update the agent in the workflow
          const updatedAgents = workflow.agents.map((a) =>
            a.id === params.agentId ? { ...a, prompt: improvedPrompt } : a
          );

          // Update the workflow with the new agents
          await updateWorkflow(
            params.id,
            { agents: updatedAgents },
            session.user.id
          );

          // Return the improved prompt with a flag indicating the agent was updated
          return NextResponse.json({
            improvedPrompt,
            success: true,
            agentUpdated: true,
            agent: {
              ...agent,
              prompt: improvedPrompt,
            },
          });
        }

        return NextResponse.json({
          improvedPrompt,
          success: true,
          agent: {
            ...agent,
            prompt: improvedPrompt,
          },
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Must be one of: debug, execute, generate-prompt",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error debugging agent:", error);
    return NextResponse.json(
      {
        error: "Failed to debug agent",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
