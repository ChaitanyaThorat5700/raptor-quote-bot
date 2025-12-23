import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load JSON manually
const dataPath = path.join(__dirname, "../data/products.json");
const rawData = fs.readFileSync(dataPath, "utf-8");
const products = JSON.parse(rawData);

export function getCategoryById(id) {
  return products.categories.find(cat => cat.id === id);
}
