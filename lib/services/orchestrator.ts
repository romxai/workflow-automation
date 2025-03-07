import { Agent, Workflow } from "../models/workflow";
import { executeAgent } from "./builder";

export class Orchestrator {
  private workflow: Workflow;
  
  constructor(workflow: Workflow) {
    this.workflow = workflow;
  }

  async initialize(): Promise<void> {
    console.log("Orchestrator initialized");
    console.log("Workflow:", this.workflow.name);
    console.log("Agents:", this.workflow.agents.map(a => a.name));
  }

  async execute(inputData: Record<string, any>): Promise<{
    results: Record<string, any>;
    agentOutputs: Record<string, any>;
  }> {
    try {
      console.log("Starting workflow execution");
      
      const agentOutputs: Record<string, any> = {};
      const results: Record<string, any> = {};

      // Execute agents in the defined flow
      for (const agent of this.workflow.agents) {
        console.log(`Executing agent: ${agent.name}`);
        
        // Get inputs from previous agents if available
        const inputs = inputData;
        
        // Execute the agent
        const output = await executeAgent(agent, inputs);
        
        // Store the output
        agentOutputs[agent.id] = output;
        
        // Add results
        Object.assign(results, output.result || {});
        
        // Log the output
        console.log(`Agent ${agent.name} completed with output:`, output);
      }

      return { results, agentOutputs };
    } catch (error) {
      console.error("Workflow execution failed:", error);
      throw error;
    }
  }
}