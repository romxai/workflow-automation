import { ObjectId } from "mongodb";
import clientPromise from "../mongodb";
import { Workflow, WorkflowInput } from "../models/workflow";
import { analyzeProblemStatement } from "./architect";
import { generateAgentPrompt } from "./builder";

// Get all workflows for a user
export async function getUserWorkflows(userId: string): Promise<Workflow[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const workflows = await db
      .collection("workflows")
      .find({ userId })
      .sort({ updatedAt: -1 })
      .toArray();

    return workflows as Workflow[];
  } catch (error) {
    console.error("Error getting user workflows:", error);
    throw error;
  }
}

// Get a single workflow by ID
export async function getWorkflowById(
  id: string,
  userId: string
): Promise<Workflow | null> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const workflow = await db
      .collection("workflows")
      .findOne({ _id: new ObjectId(id), userId });

    return workflow as Workflow | null;
  } catch (error) {
    console.error("Error getting workflow by ID:", error);
    throw error;
  }
}

// Create a new workflow
export async function createWorkflow(
  workflowInput: WorkflowInput,
  userId: string
): Promise<Workflow> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Analyze the problem statement using Architect Agent
    const { agents, analysis, flow } = await analyzeProblemStatement(
      workflowInput.problemStatement
    );

    // Improve prompts for each agent using Builder Agent
    console.log("Generating improved prompts for agents...");
    const improvedAgents = await Promise.all(
      agents.map(async (agent) => {
        try {
          const improvedPrompt = await generateAgentPrompt(agent);
          return {
            ...agent,
            prompt: improvedPrompt,
          };
        } catch (error) {
          console.error(
            `Error improving prompt for agent ${agent.name}:`,
            error
          );
          return agent; // Return original agent if prompt improvement fails
        }
      })
    );

    // Create the workflow object
    const workflow: Omit<Workflow, "_id"> = {
      userId,
      name: workflowInput.name,
      description: workflowInput.description,
      problemStatement: workflowInput.problemStatement,
      agents: improvedAgents,
      flow: flow,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRun: null,
      status: "draft",
    };

    // Insert the workflow into the database
    const result = await db.collection("workflows").insertOne(workflow);

    return {
      ...workflow,
      _id: result.insertedId,
    };
  } catch (error) {
    console.error("Error creating workflow:", error);
    throw error;
  }
}

// Update a workflow
export async function updateWorkflow(
  id: string,
  workflowInput: Partial<WorkflowInput> & { agents?: any[]; flow?: any },
  userId: string
): Promise<Workflow | null> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Create the update object
    const updateData: Partial<Workflow> = {
      ...workflowInput,
      updatedAt: new Date(),
    };

    // If problem statement is updated and agents are not provided, re-analyze it
    if (workflowInput.problemStatement && !workflowInput.agents) {
      const { agents, analysis, flow } = await analyzeProblemStatement(
        workflowInput.problemStatement
      );

      // Improve prompts for each agent using Builder Agent
      console.log("Generating improved prompts for agents...");
      const improvedAgents = await Promise.all(
        agents.map(async (agent) => {
          try {
            const improvedPrompt = await generateAgentPrompt(agent);
            return {
              ...agent,
              prompt: improvedPrompt,
            };
          } catch (error) {
            console.error(
              `Error improving prompt for agent ${agent.name}:`,
              error
            );
            return agent; // Return original agent if prompt improvement fails
          }
        })
      );

      updateData.agents = improvedAgents;
      updateData.flow = flow;
    }

    // Update the workflow in the database
    const result = await db
      .collection("workflows")
      .findOneAndUpdate(
        { _id: new ObjectId(id), userId },
        { $set: updateData },
        { returnDocument: "after" }
      );

    // Check if result is null
    if (!result) {
      console.error("No workflow found to update");
      return null; // or handle the case as needed
    }

    return result.value as Workflow | null;
  } catch (error) {
    console.error("Error updating workflow:", error);
    throw error;
  }
}

// Delete a workflow
export async function deleteWorkflow(
  id: string,
  userId: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Delete the workflow from the database
    const result = await db.collection("workflows").deleteOne({
      _id: new ObjectId(id),
      userId,
    });

    return result.deletedCount > 0;
  } catch (error) {
    console.error("Error deleting workflow:", error);
    throw error;
  }
}

// Get a specific agent from a workflow
export async function getAgentFromWorkflow(
  workflowId: string,
  agentId: string,
  userId: string
): Promise<any | null> {
  try {
    const workflow = await getWorkflowById(workflowId, userId);

    if (!workflow) {
      return null;
    }

    const agent = workflow.agents.find((a) => a.id === agentId);

    return agent || null;
  } catch (error) {
    console.error("Error getting agent from workflow:", error);
    throw error;
  }
}

// Update a specific agent in a workflow
export async function updateAgentInWorkflow(
  workflowId: string,
  agentId: string,
  agentData: any,
  userId: string
): Promise<Workflow | null> {
  try {
    const workflow = await getWorkflowById(workflowId, userId);

    if (!workflow) {
      return null;
    }

    // Update the agent in the workflow
    const updatedAgents = workflow.agents.map((agent) =>
      agent.id === agentId ? { ...agent, ...agentData } : agent
    );

    // Update the workflow with the new agents
    return updateWorkflow(workflowId, { agents: updatedAgents }, userId);
  } catch (error) {
    console.error("Error updating agent in workflow:", error);
    throw error;
  }
}

// Execute a workflow with input data
export async function executeWorkflow(
  workflowId: string,
  inputData: Record<string, any>,
  userId: string
): Promise<{
  results: Record<string, any>;
  agentOutputs: Record<string, any>;
}> {
  try {
    const workflow = await getWorkflowById(workflowId, userId);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Get the flow of agents
    const flow = workflow.flow || {
      description: "Sequential flow",
      connections: workflow.agents.slice(0, -1).map((agent, index) => ({
        from: agent.id,
        to: workflow.agents[index + 1].id,
        description: `Data flows from ${agent.name} to ${
          workflow.agents[index + 1].name
        }`,
      })),
    };

    // Execute each agent in the workflow according to the flow
    const agentOutputs: Record<string, any> = {};
    let finalResult = {};

    // Start with the first agent that doesn't have any incoming connections
    const startingAgentIds = getStartingAgents(
      workflow.agents,
      flow.connections
    );

    for (const agentId of startingAgentIds) {
      const result = await executeAgentChain(
        agentId,
        workflow.agents,
        flow.connections,
        inputData,
        agentOutputs
      );
      Object.assign(finalResult, result);
    }

    // Update the workflow with the last run timestamp
    await updateWorkflow(workflowId, { lastRun: new Date() }, userId);

    return {
      results: finalResult,
      agentOutputs,
    };
  } catch (error) {
    console.error("Error executing workflow:", error);
    throw error;
  }
}

// Helper function to get starting agents (agents with no incoming connections)
function getStartingAgents(agents: any[], connections: any[]): string[] {
  // Get all agent IDs that are destinations in connections
  const destinationIds = connections.map((conn) => conn.to);

  // Find agents that are not destinations (i.e., they are starting points)
  return agents
    .filter((agent) => !destinationIds.includes(agent.id))
    .map((agent) => agent.id);
}

// Helper function to execute an agent and its downstream chain
async function executeAgentChain(
  agentId: string,
  agents: any[],
  connections: any[],
  inputData: Record<string, any>,
  agentOutputs: Record<string, any>
): Promise<Record<string, any>> {
  // Import executeAgent dynamically to avoid circular dependencies
  const { executeAgent } = await import("./builder");

  // Find the current agent
  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }

  // Prepare inputs for this agent
  const agentInputs: Record<string, any> = { ...inputData };

  // Find connections where this agent is the destination
  const incomingConnections = connections.filter((conn) => conn.to === agentId);

  // Add outputs from upstream agents as inputs
  for (const conn of incomingConnections) {
    const sourceAgentId = conn.from;
    if (agentOutputs[sourceAgentId]) {
      // Merge the upstream agent's outputs into this agent's inputs
      Object.assign(agentInputs, agentOutputs[sourceAgentId].result || {});
    }
  }

  console.log(`Executing agent: ${agent.name} with inputs:`, agentInputs);

  // Execute the agent
  const result = await executeAgent(agent, agentInputs);

  // Store the result
  agentOutputs[agentId] = result;

  // Find connections where this agent is the source
  const outgoingConnections = connections.filter(
    (conn) => conn.from === agentId
  );

  // Execute downstream agents
  let downstreamResults = {};
  for (const conn of outgoingConnections) {
    const result = await executeAgentChain(
      conn.to,
      agents,
      connections,
      inputData,
      agentOutputs
    );
    Object.assign(downstreamResults, result);
  }

  // Return combined results
  return {
    ...result.result,
    ...downstreamResults,
  };
}
