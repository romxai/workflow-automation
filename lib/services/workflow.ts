import { ObjectId } from "mongodb";
import clientPromise from "../mongodb";
import { Workflow, WorkflowInput } from "../models/workflow";
import { analyzeProblemStatement } from "./gemini";

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

    // Analyze the problem statement using Gemini API
    const { agents, analysis } = await analyzeProblemStatement(
      workflowInput.problemStatement
    );

    // Create the workflow object
    const workflow: Omit<Workflow, "_id"> = {
      userId,
      name: workflowInput.name,
      description: workflowInput.description,
      problemStatement: workflowInput.problemStatement,
      agents,
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
  workflowInput: Partial<WorkflowInput>,
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

    // If problem statement is updated, re-analyze it
    if (workflowInput.problemStatement) {
      const { agents, analysis } = await analyzeProblemStatement(
        workflowInput.problemStatement
      );
      updateData.agents = agents;
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
