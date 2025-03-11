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
    console.log(`\n[DEBUG] executeAgent: Starting execution of ${agent.name}`);
    console.log(`[DEBUG] executeAgent: Agent inputs:`, inputs);
    console.log(
      `[DEBUG] executeAgent: Agent expected inputs: ${agent.inputs.join(", ")}`
    );
    console.log(
      `[DEBUG] executeAgent: Agent expected outputs: ${agent.outputs.join(
        ", "
      )}`
    );

    // Validate inputs against agent's expected inputs
    const missingInputs = agent.inputs.filter((input) => !(input in inputs));
    if (missingInputs.length > 0) {
      console.warn(
        `[DEBUG] executeAgent: Warning - Missing inputs for agent ${
          agent.name
        }: ${missingInputs.join(", ")}`
      );
    }

    // Construct the prompt for Gemini with the agent's prompt and inputs
    let agentPrompt = agent.prompt;
    console.log(
      `[DEBUG] executeAgent: Original prompt: ${agentPrompt.substring(
        0,
        100
      )}...`
    );

    // Replace input placeholders in the prompt if they exist
    Object.entries(inputs).forEach(([key, value]) => {
      // Handle different placeholder formats
      const placeholders = [
        `{{${key}}}`, // Format: {{key}}
        `{${key}}`, // Format: {key}
        `{{${key.split(":")[0]}}}`, // Format: {{key}} when input has type annotation
        `{${key.split(":")[0]}}`, // Format: {key} when input has type annotation
      ];

      let replacementMade = false;

      placeholders.forEach((placeholder) => {
        if (agentPrompt.includes(placeholder)) {
          const valueStr =
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : String(value);

          console.log(
            `[DEBUG] executeAgent: Replacing placeholder ${placeholder} with value: ${valueStr.substring(
              0,
              50
            )}${valueStr.length > 50 ? "..." : ""}`
          );

          agentPrompt = agentPrompt.replace(
            new RegExp(placeholder, "g"),
            valueStr
          );

          replacementMade = true;
        }
      });

      if (!replacementMade) {
        // Try to find if there's any placeholder that might match this input
        const possiblePlaceholders = [
          new RegExp(`\\{\\{${key.split(":")[0]}(?:\\s*|[^}]*?)\\}\\}`, "g"), // {{key}} or {{key with something}}
          new RegExp(`\\{${key.split(":")[0]}(?:\\s*|[^}]*?)\\}`, "g"), // {key} or {key with something}
        ];

        let foundPlaceholder = false;
        possiblePlaceholders.forEach((regex) => {
          const matches = agentPrompt.match(regex);
          if (matches) {
            foundPlaceholder = true;
            matches.forEach((match) => {
              console.log(
                `[DEBUG] executeAgent: Found potential placeholder match: ${match} for input ${key}`
              );
              const valueStr =
                typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value);

              agentPrompt = agentPrompt.replace(match, valueStr);
              console.log(`[DEBUG] executeAgent: Replaced ${match} with value`);
            });
          }
        });

        if (!foundPlaceholder) {
          console.log(
            `[DEBUG] executeAgent: No placeholder found for input ${key}`
          );
        }
      }
    });

    // Add instructions for JSON output with expected output structure
    // Normalize output field names by removing type annotations
    const normalizedOutputs = agent.outputs.map((output) => {
      const normalizedOutput = output.split(":")[0].trim();
      return normalizedOutput;
    });

    const finalPrompt = `
${agentPrompt}

IMPORTANT: Your response must be in valid JSON format with the following structure:
{
  "result": {
    ${normalizedOutputs.map((output) => `"${output}": "value"`).join(",\n    ")}
  },
  "reasoning": "Explanation of how you arrived at this result"
}

Make sure to include all the required output fields: ${normalizedOutputs.join(
      ", "
    )}
Do not include any fields in the result that are not in this list: ${normalizedOutputs.join(
      ", "
    )}
`;

    console.log(`[DEBUG] executeAgent: Final prompt prepared, sending to API`);

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
      console.error("[DEBUG] executeAgent: Gemini API error:", errorData);
      throw new Error(
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(`[DEBUG] executeAgent: Received response from API`);

    // Extract the text from the response
    const text = data.candidates[0].content.parts[0].text;
    console.log(
      `[DEBUG] executeAgent: Raw response text: ${text.substring(0, 200)}...`
    );

    // Parse the JSON from the text
    // Find the JSON object in the text (it might be surrounded by markdown code blocks)
    const jsonMatch =
      text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error(
        "[DEBUG] executeAgent: Could not extract JSON from response"
      );
      throw new Error("Could not extract JSON from response");
    }

    const jsonStr = jsonMatch[1];
    console.log(
      `[DEBUG] executeAgent: Extracted JSON string: ${jsonStr.substring(
        0,
        200
      )}...`
    );

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(jsonStr);
      console.log(`[DEBUG] executeAgent: Successfully parsed JSON`);
    } catch (parseError) {
      console.error(`[DEBUG] executeAgent: Error parsing JSON: ${parseError}`);
      throw new Error(`Failed to parse JSON response: ${parseError}`);
    }

    // Validate that the output contains all required fields
    if (!parsedOutput.result) {
      console.error("[DEBUG] executeAgent: Output is missing 'result' field");
      parsedOutput.result = {};
    }

    // Helper function to normalize keys by removing type annotations
    const normalizeKey = (key: string): string => key.split(":")[0].trim();

    // Create mappings between normalized and original output fields
    const normalizedToOriginal = new Map<string, string>();
    const originalToNormalized = new Map<string, string>();

    agent.outputs.forEach((output) => {
      const normalized = normalizeKey(output);
      normalizedToOriginal.set(normalized, output);
      originalToNormalized.set(output, normalized);
    });

    // Get normalized versions of the expected outputs
    const normalizedExpectedOutputs = agent.outputs.map(normalizeKey);

    // Check for missing outputs by comparing normalized keys
    const missingOutputs: string[] = [];

    normalizedExpectedOutputs.forEach((normalizedOutput) => {
      // Check if any key in the result matches this normalized output
      const hasOutput = Object.keys(parsedOutput.result).some(
        (resultKey) => normalizeKey(resultKey) === normalizedOutput
      );

      if (!hasOutput) {
        // Use the original output field name with type annotation for the error message
        const originalOutput =
          normalizedToOriginal.get(normalizedOutput) || normalizedOutput;
        missingOutputs.push(originalOutput);
      }
    });

    if (missingOutputs.length > 0) {
      console.warn(
        `[DEBUG] executeAgent: Warning - Agent ${
          agent.name
        } output is missing fields: ${missingOutputs.join(", ")}`
      );

      // Add missing outputs with placeholder values
      missingOutputs.forEach((output) => {
        // Use the normalized key for the result
        const normalizedOutput =
          originalToNormalized.get(output) || normalizeKey(output);
        parsedOutput.result[output] = `Missing output: ${output}`;
      });
    }

    // Transform the result to use the original output field names with type annotations
    const transformedResult: Record<string, any> = {};

    Object.entries(parsedOutput.result).forEach(([key, value]) => {
      const normalizedKey = normalizeKey(key);

      // If this is a known output field, use the original name with type annotation
      if (normalizedToOriginal.has(normalizedKey)) {
        const originalKey = normalizedToOriginal.get(normalizedKey)!;
        transformedResult[originalKey] = value;
      } else {
        // Otherwise keep the original key
        transformedResult[key] = value;
      }
    });

    // Replace the result with the transformed version
    parsedOutput.result = transformedResult;

    // Check for unexpected fields (after normalization)
    const extraOutputs = Object.keys(parsedOutput.result).filter((key) => {
      const normalizedKey = normalizeKey(key);
      return !normalizedExpectedOutputs.includes(normalizedKey);
    });

    if (extraOutputs.length > 0) {
      console.warn(
        `[DEBUG] executeAgent: Warning - Agent ${
          agent.name
        } output contains unexpected fields: ${extraOutputs.join(", ")}`
      );

      extraOutputs.forEach((key) => {
        console.warn(
          `[DEBUG] executeAgent: Removing unexpected output field: ${key}`
        );
        delete parsedOutput.result[key];
      });
    }

    // Ensure reasoning is present
    if (!parsedOutput.reasoning) {
      console.warn("[DEBUG] executeAgent: Output is missing 'reasoning' field");
      parsedOutput.reasoning = "No reasoning provided";
    }

    console.log(
      `[DEBUG] executeAgent: Final validated output for ${agent.name}:`,
      parsedOutput
    );
    return parsedOutput;
  } catch (error) {
    console.error(
      `[DEBUG] executeAgent: Error executing agent ${agent.name}:`,
      error
    );

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

    console.log(
      `[DEBUG] executeAgent: Returning fallback result for ${agent.name}:`,
      fallbackResult
    );
    return fallbackResult;
  }
}
