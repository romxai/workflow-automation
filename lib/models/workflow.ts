import { ObjectId } from "mongodb";

export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  prompt: string;
  inputs: string[];
  outputs: string[];
}

export interface Workflow {
  _id?: ObjectId | string;
  userId: string;
  name: string;
  description: string;
  problemStatement: string;
  agents: Agent[];
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date | null;
  status: "draft" | "active" | "archived";
}

export interface WorkflowInput {
  name: string;
  description: string;
  problemStatement: string;
}
