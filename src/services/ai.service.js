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
- Do NOT overwrite existing values
- If value is not present, return null
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Session data: ${JSON.stringify(session.collectedData)}\nUser message: ${message}`
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}
