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
- Understand natural language and synonyms
- Normalize values:
  - "ground floor", "flooring", "on floor" → "floor"
  - "wall tiles", "on wall", "wall tiling" → "wall"
  - "yes", "required", "needed", "include" → "yes"
  - "no", "not required", "exclude" → "no"
- Convert approximate numbers to nearest whole number
  - e.g. "around 1200", "about 1150" → 1200 / 1150
- Do NOT invent values
- Do NOT overwrite values already present in session data
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
