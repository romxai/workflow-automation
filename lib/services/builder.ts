import { Agent } from "../models/workflow";

/**
 * Executes an agent with specific inputs
 * @param agent The agent to execute
 * @param inputs The inputs for the agent
 * @returns The result of the agent execution
 */
export async function executeAgent(
  agent: Agent,
  inputs: Record<string, any>
): Promise<Record<string, any>> {
  try {
    console.log(`Executing agent: ${agent.name} with inputs:`, inputs);

    // Validate inputs against agent's expected inputs
    const missingInputs = agent.inputs.filter((input) => !(input in inputs));
    if (missingInputs.length > 0) {
      console.warn(
        `Warning: Missing inputs for agent ${agent.name}: ${missingInputs.join(
          ", "
        )}`
      );
    }

    // Construct the prompt for Gemini with the agent's prompt and inputs
    let agentPrompt = agent.prompt;

    // Replace input placeholders in the prompt if they exist
    Object.entries(inputs).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      if (agentPrompt.includes(placeholder)) {
        agentPrompt = agentPrompt.replace(
          new RegExp(placeholder, "g"),
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value)
        );
      }
    });

    // Add instructions for JSON output with expected output structure
    const finalPrompt = `
${agentPrompt}

IMPORTANT: Your response must be in valid JSON format with the following structure:
{
  "result": {
    ${agent.outputs.map((output) => `"${output}": "value"`).join(",\n    ")}
  },
  "reasoning": "Explanation of how you arrived at this result"
}

Make sure to include all the required output fields: ${agent.outputs.join(", ")}
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
    let result: {
      result: Record<string, string>;
      reasoning: string;
    } = {
      result: {},
      reasoning: "",
    };

    try {
      const parsed = JSON.parse(jsonText);
      result = {
        result: parsed.result || {},
        reasoning: parsed.reasoning || "No reasoning provided",
      };
    } catch (parseError) {
      console.error("Error parsing agent response:", parseError);
      console.log("Raw response:", text);

      // Set error result
      result = {
        result: {},
        reasoning: "Error parsing response: " + String(parseError),
      };

      // Add placeholder values for expected outputs
      agent.outputs.forEach((output) => {
        result.result[output] = "Error: Failed to generate output";
      });
    }

    // Validate that all expected outputs are present
    const missingOutputs = agent.outputs.filter(
      (output) => !(output in (result.result || {}))
    );
    if (missingOutputs.length > 0) {
      console.warn(
        `Warning: Missing outputs from agent ${
          agent.name
        }: ${missingOutputs.join(", ")}`
      );

      // Add placeholder values for missing outputs
      missingOutputs.forEach((output) => {
        if (!result.result) result.result = {};
        result.result[output] = "Not provided by agent";
      });
    }

    console.log(`Agent ${agent.name} execution completed with result:`, result);
    return result;
  } catch (error) {
    console.error("Error executing agent:", error);

    // Create a fallback result with error information
    const fallbackResult: {
      result: Record<string, string>;
      reasoning: string;
    } = {
      result: {},
      reasoning: "Error executing agent: " + String(error),
    };

    // Add placeholder values for expected outputs
    agent.outputs.forEach((output) => {
      fallbackResult.result[output] = "Error: Agent execution failed";
    });

    return fallbackResult;
  }
}
