import { Agent } from "../models/workflow";

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
