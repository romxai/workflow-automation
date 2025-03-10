import { ObjectId } from "mongodb";
import clientPromise from "../mongodb";
import { Workflow, WorkflowInput } from "../models/workflow";
import { analyzeProblemStatement } from "./architect";
import { Orchestrator } from "./orchestrator";

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

    // Create the workflow object
    const workflow: Omit<Workflow, "_id"> = {
      userId,
      name: workflowInput.name,
      description: workflowInput.description,
      problemStatement: workflowInput.problemStatement,
      agents: agents,
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

      updateData.agents = agents;
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
  updates: any[];
}> {
  try {
    console.log(
      `Starting execution of workflow ${workflowId} with inputs:`,
      inputData
    );

    const workflow = await getWorkflowById(workflowId, userId);

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Create an instance of the Orchestrator
    const orchestrator = new Orchestrator(workflow);

    // Initialize the orchestrator
    await orchestrator.initialize();

    // Execute the workflow
    console.log(
      `Executing workflow ${workflow.name} with ${workflow.agents.length} agents`
    );
    const { results, agentOutputs, updates } = await orchestrator.execute(
      inputData
    );

    // Update the workflow with the last run timestamp
    const workflowToUpdate = await getWorkflowById(workflowId, userId);
    if (workflowToUpdate) {
      workflowToUpdate.lastRun = new Date();
      await updateWorkflow(
        workflowId,
        {
          name: workflowToUpdate.name,
          description: workflowToUpdate.description,
          problemStatement: workflowToUpdate.problemStatement,
          agents: workflowToUpdate.agents,
          flow: workflowToUpdate.flow,
        },
        userId
      );
    }

    console.log(`Workflow execution completed with results:`, results);
    return { results, agentOutputs, updates };
  } catch (error) {
    console.error("Error executing workflow:", error);
    throw error;
  }
}
