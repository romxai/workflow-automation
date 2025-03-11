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
      console.log("\n[DEBUG] Starting workflow execution");
      console.log(`[DEBUG] Workflow name: ${this.workflow.name}`);
      console.log(`[DEBUG] Initial input data:`, inputData);

      // Helper function to normalize keys by removing type annotations
      const normalizeKey = (key: string): string => key.split(":")[0].trim();

      // Normalize input data by removing type annotations from keys
      const normalizedInputData: Record<string, any> = {};
      Object.entries(inputData).forEach(([key, value]) => {
        const normalizedKey = normalizeKey(key);
        normalizedInputData[key] = value; // Keep original key

        // Only add normalized key if it's different from the original
        if (normalizedKey !== key) {
          normalizedInputData[normalizedKey] = value;
          console.log(
            `[DEBUG] Added normalized input key: ${normalizedKey} (original: ${key})`
          );
        }
      });

      this.executionUpdates = []; // Reset updates
      this.addUpdate(
        "start",
        `Starting workflow execution: ${this.workflow.name}`
      );

      // Initialize data structures
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

      console.log(
        `[DEBUG] Determined execution order: ${executionOrder
          .map((id) => agentMap[id].name)
          .join(" → ")}`
      );

      this.addUpdate(
        "start",
        `Determined execution order: ${executionOrder
          .map((id) => agentMap[id].name)
          .join(" → ")}`
      );

      // Track global inputs that are available to all agents
      const globalInputs = { ...normalizedInputData };

      // Execute agents in the determined order
      for (const agentId of executionOrder) {
        // Skip if agent was already executed
        if (executedAgents.has(agentId)) {
          const skipMessage = `Skipping already executed agent: ${agentMap[agentId].name}`;
          console.log(`[DEBUG] ${skipMessage}`);
          this.addUpdate("start", skipMessage);
          continue;
        }

        const agent = agentMap[agentId];
        console.log(`\n[DEBUG] Executing agent: ${agent.name} (${agent.id})`);

        executedAgents.add(agentId); // Mark as executed

        // Prepare inputs for this agent
        const agentInputs = this.prepareAgentInputs(
          agent,
          globalInputs,
          agentOutputs
        );

        // Add update for agent start
        this.addUpdate("agent-start", `Starting agent: ${agent.name}`, agent, {
          inputs: agentInputs,
        });

        // Execute the agent
        console.log(`[DEBUG] Calling executeAgent for ${agent.name}`);
        const output = await executeAgent(agent, agentInputs);
        console.log(`[DEBUG] Agent ${agent.name} execution completed`);

        // Validate output structure
        if (!output.result) {
          console.error(
            `[DEBUG] Error: Agent ${agent.name} output is missing 'result' field`
          );
          output.result = {};
        }

        // Store the output
        agentOutputs[agent.id] = output;

        // Update results with this agent's output
        if (output.result) {
          // Helper function to normalize keys by removing type annotations
          const normalizeKey = (key: string): string =>
            key.split(":")[0].trim();

          // Add each output to the global results and inputs
          Object.entries(output.result).forEach(([key, value]) => {
            // Normalize the output key
            const normalizedKey = normalizeKey(key);

            // Store with both the original and normalized keys
            results[key] = value;

            // Only add the normalized key if it's different from the original
            if (normalizedKey !== key) {
              results[normalizedKey] = value;
            }

            // Also add to global inputs with both keys
            globalInputs[key] = value;

            // Only add the normalized key if it's different from the original
            if (normalizedKey !== key) {
              globalInputs[normalizedKey] = value;
            }

            console.log(
              `[DEBUG] Adding output '${key}' (normalized: '${normalizedKey}') from ${agent.name} to global results and inputs`
            );
          });
        }

        // Add update for agent completion
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

      console.log(`\n[DEBUG] Workflow execution completed`);
      console.log(`[DEBUG] Final results:`, results);

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
      console.error(`[DEBUG] Workflow execution failed: ${errorMessage}`);
      this.addUpdate("error", `Workflow execution failed: ${errorMessage}`);
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
    console.log(
      `\n[DEBUG] Preparing inputs for agent: ${agent.name} (${agent.id})`
    );
    console.log(
      `[DEBUG] Agent ${agent.name} expects inputs: ${agent.inputs.join(", ")}`
    );

    // Initialize inputs object
    const inputs: Record<string, any> = {};

    // Step 1: Find all incoming connections to this agent
    const incomingConnections = this.workflow.flow.connections.filter(
      (conn) => conn.to === agent.id
    );

    console.log(
      `[DEBUG] Found ${incomingConnections.length} incoming connections for ${agent.name}`
    );

    // Helper function to normalize input/output names by removing type annotations
    const normalizeKey = (key: string): string => key.split(":")[0].trim();

    // Create a map of normalized input names to original input names
    const normalizedInputMap = new Map<string, string>();
    agent.inputs.forEach((input) => {
      normalizedInputMap.set(normalizeKey(input), input);
    });

    // Step 2: For each expected input, try to find a value from connected agents or global inputs
    for (const inputName of agent.inputs) {
      // Get the normalized input name (without type annotation)
      const normalizedInputName = normalizeKey(inputName);

      // First check if this input is provided by a connected agent
      let inputFound = false;

      // Look through all incoming connections
      for (const connection of incomingConnections) {
        const sourceAgentId = connection.from;
        const sourceAgent = this.workflow.agents.find(
          (a) => a.id === sourceAgentId
        );

        if (!sourceAgent) {
          console.warn(
            `[DEBUG] Warning: Source agent with ID ${sourceAgentId} not found`
          );
          continue;
        }

        // Create a map of normalized output names to original output names
        const normalizedOutputMap = new Map<string, string>();
        sourceAgent.outputs.forEach((output) => {
          normalizedOutputMap.set(normalizeKey(output), output);
        });

        // Check if the source agent has an output matching this input name (normalized or not)
        const matchingOutput = sourceAgent.outputs.find(
          (output) =>
            normalizeKey(output) === normalizedInputName || output === inputName
        );

        if (matchingOutput) {
          // Check if we have outputs from this source agent
          const sourceOutput = agentOutputs[sourceAgentId];
          if (sourceOutput && sourceOutput.result) {
            // Try to find the output value using different key formats
            let outputValue;
            let outputKey;

            // First try the exact output name
            if (sourceOutput.result[matchingOutput] !== undefined) {
              outputValue = sourceOutput.result[matchingOutput];
              outputKey = matchingOutput;
            }
            // Then try the normalized output name
            else if (
              sourceOutput.result[normalizeKey(matchingOutput)] !== undefined
            ) {
              outputValue = sourceOutput.result[normalizeKey(matchingOutput)];
              outputKey = normalizeKey(matchingOutput);
            }
            // Finally, try all keys with normalized comparison
            else {
              outputKey = Object.keys(sourceOutput.result).find(
                (key) => normalizeKey(key) === normalizeKey(matchingOutput)
              );
              if (outputKey) {
                outputValue = sourceOutput.result[outputKey];
              }
            }

            if (outputValue !== undefined) {
              inputs[inputName] = outputValue;
              console.log(
                `[DEBUG] Input '${inputName}' for ${agent.name} found from agent ${sourceAgent.name} (output field: '${outputKey}')`
              );
              console.log(
                `[DEBUG] Value: ${
                  typeof outputValue === "object"
                    ? JSON.stringify(outputValue)
                    : outputValue
                }`
              );
              inputFound = true;
              break;
            }
          }
        }
      }

      // If not found from connected agents, check global inputs
      if (!inputFound) {
        // Try different key formats in global inputs
        let globalValue;
        let globalKey;

        // First try the exact input name
        if (globalInputs[inputName] !== undefined) {
          globalValue = globalInputs[inputName];
          globalKey = inputName;
        }
        // Then try the normalized input name
        else if (globalInputs[normalizedInputName] !== undefined) {
          globalValue = globalInputs[normalizedInputName];
          globalKey = normalizedInputName;
        }
        // Finally, try all keys with normalized comparison
        else {
          globalKey = Object.keys(globalInputs).find(
            (key) => normalizeKey(key) === normalizedInputName
          );
          if (globalKey) {
            globalValue = globalInputs[globalKey];
          }
        }

        if (globalValue !== undefined) {
          inputs[inputName] = globalValue;
          console.log(
            `[DEBUG] Input '${inputName}' for ${agent.name} found from global inputs (key: '${globalKey}')`
          );
          console.log(
            `[DEBUG] Value: ${
              typeof globalValue === "object"
                ? JSON.stringify(globalValue)
                : globalValue
            }`
          );
          inputFound = true;
        }
      }

      // If still not found, log a warning
      if (!inputFound) {
        console.warn(
          `[DEBUG] Warning: Input '${inputName}' for agent ${agent.name} not found from any source`
        );
      }
    }

    // Step 3: Check if all required inputs are present
    const missingInputs = agent.inputs.filter((input) => !(input in inputs));
    if (missingInputs.length > 0) {
      console.warn(
        `[DEBUG] Warning: Agent ${
          agent.name
        } is missing required inputs: ${missingInputs.join(", ")}`
      );
    }

    console.log(`[DEBUG] Final inputs for ${agent.name}:`, inputs);
    return inputs;
  }
}
