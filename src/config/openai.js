import dotenv from "dotenv";
import OpenAI from "openai";

// Load env vars here (VERY IMPORTANT)
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default client;
