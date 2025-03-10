import { Agent } from "../models/workflow";

// Function to analyze a problem statement using Gemini API
export async function analyzeProblemStatement(
  problemStatement: string
): Promise<{
  agents: Agent[];
  analysis: string;
  flow: {
    description: string;
    connections: Array<{
      from: string;
      to: string;
      description: string;
    }>;
  };
}> {
  try {
    console.log(
      "Analyzing problem statement with Architect Agent:",
      problemStatement
    );

    // Construct the prompt for Gemini
    const prompt = `
You are an AI Architect Agent. Your task is to analyze the following problem statement and design a workflow of AI agents needed to solve it.

Problem Statement: "${problemStatement}"

Based on this problem statement, please:
1. Identify the specific AI agents needed to solve this problem
2. For each agent, provide:
   - A descriptive name
   - A clear description of its purpose
   - Its specific role in the workflow
   - A tailored prompt that the agent should use
   - What inputs it requires (be specific about data types and formats)
   - What outputs it produces (be specific about data types and formats)
3. Define the flow of data between agents, showing how they connect and work together

IMPORTANT: Ensure that the outputs of one agent match the inputs of the next agent it connects to. The input/output names must match exactly.

Format your response as a JSON object with the following structure:
{
  "analysis": "A brief analysis of the problem and overall workflow strategy",
  "agents": [
    {
      "id": "unique-id-1",
      "name": "Agent Name",
      "description": "Description of what this agent does",
      "role": "The specific role this agent plays in the workflow",
      "prompt": "The prompt template this agent should use",
      "inputs": ["input1", "input2"],
      "outputs": ["output1", "output2"]
    },
    ...more agents as needed
  ],
  "flow": {
    "description": "A description of how data flows between agents",
    "connections": [
      {
        "from": "unique-id-1",
        "to": "unique-id-2",
        "description": "Description of what data passes from one agent to another"
      },
      ...more connections as needed
    ]
  }
}

Ensure your response is valid JSON and follows this exact structure. Be thoughtful about how agents connect and how data flows between them.
`;

    // Make the API call to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY || "",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Architect Agent response:", JSON.stringify(data, null, 2));

    // Extract the text from the response
    const text = data.candidates[0].content.parts[0].text;

    // Parse the JSON from the text
    // Find the JSON object in the text (it might be surrounded by markdown code blocks)
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) ||
      text.match(/```\n([\s\S]*?)\n```/) ||
      text.match(/{[\s\S]*?}/);

    let jsonText = "";
    if (jsonMatch) {
      jsonText = jsonMatch[0].replace(/```json\n|```\n|```/g, "");
    } else {
      jsonText = text;
    }

    // Parse the JSON
    const parsedResponse = JSON.parse(jsonText);

    // Validate the response
    validateArchitectResponse(parsedResponse);

    return {
      agents: parsedResponse.agents,
      analysis: parsedResponse.analysis,
      flow: parsedResponse.flow || {
        description: "Sequential flow between agents",
        connections: parsedResponse.agents
          .slice(0, -1)
          .map((agent: any, index: any) => ({
            from: agent.id,
            to: parsedResponse.agents[index + 1].id,
            description: `Data flows from ${agent.name} to ${
              parsedResponse.agents[index + 1].name
            }`,
          })),
      },
    };
  } catch (error) {
    console.error("Error in Architect Agent:", error);
    throw error;
  }
}

// Function to validate the architect response
function validateArchitectResponse(response: any): void {
  // Check if the response has the required fields
  if (!response.agents || !Array.isArray(response.agents)) {
    throw new Error("Invalid response: missing or invalid agents array");
  }

  if (!response.analysis || typeof response.analysis !== "string") {
    throw new Error("Invalid response: missing or invalid analysis");
  }

  // Check each agent
  response.agents.forEach((agent: any, index: number) => {
    if (!agent.id) {
      agent.id = `agent-${index + 1}`;
      console.warn(`Agent missing ID, assigned: ${agent.id}`);
    }

    if (!agent.name) {
      throw new Error(`Agent ${agent.id} missing name`);
    }

    if (!agent.inputs || !Array.isArray(agent.inputs)) {
      agent.inputs = [];
      console.warn(
        `Agent ${agent.name} missing inputs, defaulting to empty array`
      );
    }

    if (!agent.outputs || !Array.isArray(agent.outputs)) {
      agent.outputs = [];
      console.warn(
        `Agent ${agent.name} missing outputs, defaulting to empty array`
      );
    }

    if (!agent.prompt || typeof agent.prompt !== "string") {
      throw new Error(`Agent ${agent.name} missing or invalid prompt`);
    }

    if (!agent.role || typeof agent.role !== "string") {
      agent.role = agent.name;
      console.warn(`Agent ${agent.name} missing role, defaulting to name`);
    }

    if (!agent.description || typeof agent.description !== "string") {
      agent.description = `Agent responsible for ${agent.role}`;
      console.warn(
        `Agent ${agent.name} missing description, generated default`
      );
    }
  });

  // If flow is provided, validate it
  if (response.flow) {
    if (
      !response.flow.description ||
      typeof response.flow.description !== "string"
    ) {
      response.flow.description = "Workflow flow between agents";
      console.warn("Flow missing description, generated default");
    }

    if (
      !response.flow.connections ||
      !Array.isArray(response.flow.connections)
    ) {
      // Generate sequential connections if none provided
      response.flow.connections = response.agents
        .slice(0, -1)
        .map((agent: any, index: number) => ({
          from: agent.id,
          to: response.agents[index + 1].id,
          description: `Data flows from ${agent.name} to ${
            response.agents[index + 1].name
          }`,
        }));
      console.warn("Flow missing connections, generated sequential flow");
    } else {
      // Create a set of valid agent IDs
      const validAgentIds = new Set(
        response.agents.map((agent: any) => agent.id)
      );

      // Filter out invalid connections and fix them
      const validConnections: any[] = [];
      const agentIdMap = new Map(
        response.agents.map((agent: any) => [agent.id, agent])
      );

      response.flow.connections.forEach((connection: any, index: number) => {
        // Handle special case for "agent-input"
        if (connection.from === "agent-input") {
          // Create an input agent if it doesn't exist
          if (!validAgentIds.has("agent-input")) {
            const inputAgent = {
              id: "agent-input",
              name: "Input Agent",
              description: "Provides initial input to the workflow",
              role: "Input Provider",
              prompt: "Provide the initial input for the workflow",
              inputs: ["user_input"],
              outputs: ["word"],
            };
            response.agents.unshift(inputAgent);
            validAgentIds.add("agent-input");
            agentIdMap.set("agent-input", inputAgent);
            console.warn("Created missing agent-input agent");
          }
        }

        // Check if both source and target agents exist
        if (!connection.from || !connection.to) {
          console.warn(`Connection ${index} missing from or to, skipping`);
          return;
        }

        if (!validAgentIds.has(connection.from)) {
          console.warn(
            `Connection ${index} has invalid source agent ${connection.from}, skipping`
          );
          return;
        }

        if (!validAgentIds.has(connection.to)) {
          console.warn(
            `Connection ${index} has invalid target agent ${connection.to}, skipping`
          );
          return;
        }

        // Add description if missing
        if (!connection.description) {
          const sourceAgent = agentIdMap.get(connection.from) as any;
          const targetAgent = agentIdMap.get(connection.to) as any;
          connection.description = `Data flows from ${sourceAgent.name} to ${targetAgent.name}`;
        }

        validConnections.push(connection);
      });

      // Replace connections with valid ones
      response.flow.connections = validConnections;

      // If no valid connections, generate sequential ones
      if (validConnections.length === 0 && response.agents.length > 1) {
        response.flow.connections = response.agents
          .slice(0, -1)
          .map((agent: any, index: number) => ({
            from: agent.id,
            to: response.agents[index + 1].id,
            description: `Data flows from ${agent.name} to ${
              response.agents[index + 1].name
            }`,
          }));
        console.warn("No valid connections found, generated sequential flow");
      }
    }
  }

  console.log("Architect response validation successful");
}
