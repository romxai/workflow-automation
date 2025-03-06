import { Agent } from "../models/workflow";

// Function to generate a specific prompt for an agent using Gemini
export async function generateAgentPrompt(agent: Agent): Promise<string> {
  try {
    console.log(`Generating optimized prompt for agent: ${agent.name}`);

    // Construct the prompt for Gemini to generate a better agent prompt
    const prompt = `
You are an AI prompt engineer specializing in creating effective prompts for AI agents. 
Your task is to create an optimized prompt for an AI agent with the following details:

Agent Name: ${agent.name}
Agent Description: ${agent.description}
Agent Role: ${agent.role}
Agent Inputs: ${agent.inputs.join(", ")}
Agent Outputs: ${agent.outputs.join(", ")}

The current prompt template for this agent is:
"""
${agent.prompt}
"""

Please generate an improved, more specific prompt that will help this agent achieve its goals more effectively.
The prompt should:
1. Be clear and specific about the agent's purpose
2. Include detailed instructions on how to process the inputs
3. Specify the expected format for outputs
4. Include any constraints or guidelines the agent should follow
5. Be optimized for the Gemini 1.5 Flash model

Return only the improved prompt text without any additional explanations or formatting.
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
            maxOutputTokens: 4096,
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

    // Extract the text from the response
    const generatedPrompt = data.candidates[0].content.parts[0].text.trim();

    return generatedPrompt;
  } catch (error) {
    console.error("Error generating agent prompt:", error);
    throw error;
  }
}

// Function to execute an agent with specific inputs
export async function executeAgent(
  agent: Agent,
  inputs: Record<string, any>
): Promise<Record<string, any>> {
  try {
    console.log(`Executing agent: ${agent.name} with inputs:`, inputs);

    // Construct the prompt for Gemini with the agent's prompt and inputs
    let agentPrompt = agent.prompt;

    // Replace input placeholders in the prompt if they exist
    Object.entries(inputs).forEach(([key, value]) => {
      agentPrompt = agentPrompt.replace(`{{${key}}}`, String(value));
    });

    // Add instructions for JSON output
    const finalPrompt = `
${agentPrompt}

IMPORTANT: Your response must be in valid JSON format with the following structure:
{
  "result": {
    ${agent.outputs.map((output) => `"${output}": "value"`).join(",\n    ")}
  },
  "reasoning": "Explanation of how you arrived at this result"
}
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
                  text: finalPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
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
    const result = JSON.parse(jsonText);

    return result;
  } catch (error) {
    console.error("Error executing agent:", error);
    throw error;
  }
}

// Function to debug an agent by generating a better prompt and testing it
export async function debugAgent(
  agent: Agent,
  inputs: Record<string, any>
): Promise<{
  originalAgent: Agent;
  improvedAgent: Agent;
  originalResult: Record<string, any> | null;
  improvedResult: Record<string, any>;
  success: boolean;
}> {
  try {
    console.log(`Debugging agent: ${agent.name}`);

    // Try to execute the agent with the original prompt
    let originalResult = null;
    try {
      originalResult = await executeAgent(agent, inputs);
    } catch (error) {
      console.warn("Original agent execution failed:", error);
      // Continue with the improved prompt generation
    }

    // Generate an improved prompt
    const improvedPrompt = await generateAgentPrompt(agent);

    // Create an improved agent with the new prompt
    const improvedAgent: Agent = {
      ...agent,
      prompt: improvedPrompt,
    };

    // Execute the improved agent
    const improvedResult = await executeAgent(improvedAgent, inputs);

    return {
      originalAgent: agent,
      improvedAgent,
      originalResult,
      improvedResult,
      success: true,
    };
  } catch (error) {
    console.error("Error debugging agent:", error);
    throw error;
  }
}
