import openai from "../config/openai.js";

export async function analyzeUserMessage(message, session) {
  const systemPrompt = `
You are RAPTOR, a quotation assistant.

Extract structured data from user messages.

Return ONLY valid JSON in this format:
{
  "category": null | "tile_fixing" | "bathroom_renovation",
  "area": number | null,
  "tileType": "ceramic" | "vitrified" | "marble" | null,
  "location": "floor" | "wall" | null,
  "plumbingWork": "yes" | "no" | null
}

Rules:
- Do NOT invent values
- Do NOT overwrite existing values from session data
- If value is not present, return null
`;

  const sessionData = session?.collectedData || {};

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Session data: ${JSON.stringify(sessionData)}\nUser message: ${message}`
      }
    ],
    response_format: { type: "json_object" }
  });

  const content = response?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}
