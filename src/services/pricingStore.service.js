import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve path safely (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRICING_FILE = path.resolve(__dirname, "../data/products.json");

/**
 * Load pricing config from JSON
 */
export function getPricingConfig() {
  const raw = fs.readFileSync(PRICING_FILE, "utf-8");
  return JSON.parse(raw);
}

/**
 * Save pricing config back to JSON
 */
export function savePricingConfig(config) {
  config.last_updated = new Date().toISOString();
  fs.writeFileSync(PRICING_FILE, JSON.stringify(config, null, 2));
}

/**
 * Get category by ID
 */
export function getCategoryPricing(categoryId) {
  const config = getPricingConfig();
  return config.categories.find(c => c.id === categoryId);
}
