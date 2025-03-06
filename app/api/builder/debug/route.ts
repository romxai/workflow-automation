import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import {
  debugAgent,
  executeAgent,
  generateAgentPrompt,
} from "@/lib/services/builder";
import { Agent } from "@/lib/models/workflow";

// POST /api/builder/debug - Debug an agent
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the agent and inputs from the request
    const { agent, inputs, action } = await request.json();

    // Validate the input
    if (!agent) {
      return NextResponse.json({ error: "Agent is required" }, { status: 400 });
    }

    // Validate that the agent has the required fields
    if (!agent.name || !agent.prompt || !agent.inputs || !agent.outputs) {
      return NextResponse.json(
        { error: "Agent is missing required fields" },
        { status: 400 }
      );
    }

    // Perform the requested action
    switch (action) {
      case "debug":
        // Debug the agent (generate a better prompt and test it)
        const debugResult = await debugAgent(agent, inputs || {});
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
