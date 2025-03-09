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

    return {
      agents: parsedResponse.agents,
      analysis: parsedResponse.analysis,
      flow: parsedResponse.flow || {
        description: "Sequential flow between agents",
        connections: parsedResponse.agents.slice(0, -1).map((agent: Agent, index: number) => ({
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
