import openai from "../config/openai.js";


const SYSTEM_PROMPT = `
You are RAPTOR, a quotation estimation assistant.

Rules:
- Identify service category
- Extract provided values
- Ask ONLY missing questions
- Never calculate price
- Respond strictly in JSON

Response format:
{
  "category": "",
  "providedData": {},
  "nextQuestion": ""
}
`;

export async function analyzeUserMessage(message) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
