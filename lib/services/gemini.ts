import { Agent } from "../models/workflow";

// Function to analyze a problem statement using Gemini API
export async function analyzeProblemStatement(
  problemStatement: string
): Promise<{
  agents: Agent[];
  analysis: string;
}> {
  try {
    console.log(
      "Analyzing problem statement with Gemini API:",
      problemStatement
    );

    // Construct the prompt for Gemini
    const prompt = `
You are an AI workflow analyzer. Your task is to analyze the following problem statement and identify the necessary AI agents needed to solve it.

Problem Statement: "${problemStatement}"

Based on this problem statement, please:
1. Identify the specific AI agents needed to solve this problem
2. For each agent, provide:
   - A descriptive name
   - A clear description of its purpose
   - Its specific role in the workflow
   - A tailored prompt that the agent should use
   - What inputs it requires
   - What outputs it produces

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
  ]
}

Ensure your response is valid JSON and follows this exact structure.
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
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

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
    };
  } catch (error) {
    console.error("Error analyzing problem statement:", error);
    throw error;
  }
}
