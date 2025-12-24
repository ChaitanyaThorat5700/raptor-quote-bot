import OpenAI from "openai";

console.log("OPENAI KEY LOADED:", !!process.env.OPENAI_API_KEY);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default client;
