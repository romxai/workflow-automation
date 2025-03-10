import { Agent, Workflow, WorkflowFlow } from "../models/workflow";
import { executeAgent } from "./builder";

export interface ExecutionUpdate {
  type: "start" | "agent-start" | "agent-complete" | "complete" | "error";
  message: string;
  agent?: Agent;
  data?: any;
  timestamp: Date;
}

export class Orchestrator {
  private workflow: Workflow;
  private executionUpdates: ExecutionUpdate[] = [];
  private updateCallback?: (update: ExecutionUpdate) => void;

  constructor(workflow: Workflow) {
    this.workflow = workflow;
  }

  async initialize(): Promise<void> {
    console.log("Orchestrator initialized");
    console.log("Workflow:", this.workflow.name);
    console.log(
      "Agents:",
      this.workflow.agents.map((a) => a.name)
    );
    this.addUpdate("start", `Initialized workflow: ${this.workflow.name}`);
  }

  setUpdateCallback(callback: (update: ExecutionUpdate) => void): void {
    this.updateCallback = callback;
  }

  private addUpdate(
    type: ExecutionUpdate["type"],
    message: string,
    agent?: Agent,
    data?: any
  ): void {
    const update: ExecutionUpdate = {
      type,
      message,
      agent,
      data,
      timestamp: new Date(),
    };

    this.executionUpdates.push(update);

    if (this.updateCallback) {
      this.updateCallback(update);
    }

    // Log to console - this will be mirrored in the chat
    console.log(`[${type}] ${message}`, data || "");
  }

  getExecutionUpdates(): ExecutionUpdate[] {
    return [...this.executionUpdates];
  }

  async execute(inputData: Record<string, any>): Promise<{
    results: Record<string, any>;
    agentOutputs: Record<string, any>;
    updates: ExecutionUpdate[];
  }> {
    try {
      this.executionUpdates = []; // Reset updates
      this.addUpdate(
        "start",
        `Starting workflow execution: ${this.workflow.name}`
      );

      const agentOutputs: Record<string, any> = {};
      const results: Record<string, any> = {};
      const agentMap: Record<string, Agent> = {};
      const executedAgents = new Set<string>(); // Track executed agents to prevent duplicates

      // Create a map of agents by ID for easy lookup
      this.workflow.agents.forEach((agent) => {
        agentMap[agent.id] = agent;
      });

      // Get the execution order based on the flow
      const executionOrder = this.determineExecutionOrder(
        this.workflow.flow,
        this.workflow.agents
      );

      this.addUpdate(
        "start",
        `Determined execution order: ${executionOrder
          .map((id) => agentMap[id].name)
          .join(" → ")}`
      );

      // Track current inputs for each agent
      let currentInputs = { ...inputData };

      // Execute agents in the determined order
      for (const agentId of executionOrder) {
        // Skip if agent was already executed
        if (executedAgents.has(agentId)) {
          const skipMessage = `Skipping already executed agent: ${agentMap[agentId].name}`;
          console.log(skipMessage);
          this.addUpdate("start", skipMessage);
          continue;
        }

        const agent = agentMap[agentId];
        executedAgents.add(agentId); // Mark as executed

        this.addUpdate("agent-start", `Starting agent: ${agent.name}`, agent, {
          inputs: currentInputs,
        });

        // Prepare inputs for this agent
        const agentInputs = this.prepareAgentInputs(
          agent,
          currentInputs,
          agentOutputs
        );

        // Execute the agent
        const output = await executeAgent(agent, agentInputs);

        // Store the output
        agentOutputs[agent.id] = output;

        // Update results
        if (output.result) {
          Object.assign(results, output.result);
          // Update current inputs for next agent
          currentInputs = { ...currentInputs, ...output.result };
        }

        this.addUpdate(
          "agent-complete",
          `Completed agent: ${agent.name}`,
          agent,
          {
            inputs: agentInputs,
            outputs: output,
            reasoning: output.reasoning || "No reasoning provided",
          }
        );
      }

      this.addUpdate(
        "complete",
        `Workflow execution completed successfully`,
        undefined,
        { results }
      );

      return {
        results,
        agentOutputs,
        updates: this.getExecutionUpdates(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addUpdate("error", `Workflow execution failed: ${errorMessage}`);
      console.error("Workflow execution failed:", error);
      throw error;
    }
  }

  private determineExecutionOrder(
    flow: WorkflowFlow,
    agents: Agent[]
  ): string[] {
    // If there are no connections, execute agents in the order they are defined
    if (!flow.connections || flow.connections.length === 0) {
      return agents.map((agent) => agent.id);
    }

    // Create a directed graph representation
    const graph: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    // Initialize graph and in-degree
    agents.forEach((agent) => {
      graph[agent.id] = [];
      inDegree[agent.id] = 0;
    });

    // Build the graph
    flow.connections.forEach((connection) => {
      // Skip connections with invalid agents
      if (!graph[connection.from] || !graph[connection.to]) {
        console.warn(
          `Skipping invalid connection: ${connection.from} -> ${connection.to}`
        );
        return;
      }

      graph[connection.from].push(connection.to);
      inDegree[connection.to] = (inDegree[connection.to] || 0) + 1;
    });

    // Find nodes with no incoming edges (starting points)
    const queue: string[] = [];
    agents.forEach((agent) => {
      if (inDegree[agent.id] === 0) {
        queue.push(agent.id);
      }
    });

    // Perform topological sort
    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      graph[current].forEach((neighbor) => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check if we have a valid ordering (no cycles)
    if (result.length !== agents.length) {
      console.warn(
        "Workflow may contain cycles. Falling back to defined order."
      );
      return agents.map((agent) => agent.id);
    }

    return result;
  }

  private prepareAgentInputs(
    agent: Agent,
    globalInputs: Record<string, any>,
    agentOutputs: Record<string, any>
  ): Record<string, any> {
    // Start with global inputs
    const inputs = { ...globalInputs };

    // Find connections where this agent is the target
    const incomingConnections = this.workflow.flow.connections.filter(
      (conn) => conn.to === agent.id
    );

    // Add outputs from source agents
    incomingConnections.forEach((conn) => {
      const sourceOutput = agentOutputs[conn.from];
      if (sourceOutput && sourceOutput.result) {
        Object.assign(inputs, sourceOutput.result);
      }
    });

    return inputs;
  }
}
