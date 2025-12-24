import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force load .env from project root
dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

console.log("ENV CHECK:", process.env.OPENAI_API_KEY);
