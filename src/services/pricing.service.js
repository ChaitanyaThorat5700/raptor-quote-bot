import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve path safely (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load pricing config once
const pricingConfig = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../data/products.json"),
    "utf-8"
  )
);

/**
 * Calculate quotation based on category + collectedData
 */
export function calculateQuote(categoryId, data) {
  const category = pricingConfig.categories.find(
    (c) => c.id === categoryId
  );

  if (!category) {
    throw new Error(`Pricing config not found for category: ${categoryId}`);
  }

  const area = Number(data.area);
  if (!area || area <= 0) {
    throw new Error("Invalid area for pricing calculation");
  }

  const breakdown = [];
  const currency = category.currency || "INR";

  // 1️⃣ Base cost
  const baseRate = category.base_price_per_sqft;
  let subtotal = area * baseRate;

  breakdown.push({
    label: "Base cost",
    calculation: `${area} sqft × ₹${baseRate}`,
    amount: subtotal
  });

  // 2️⃣ Multipliers (e.g. tileType)
  if (category.multipliers) {
    for (const [field, map] of Object.entries(category.multipliers)) {
      const selectedValue = data[field];
      const multiplier = map?.[selectedValue];

      if (multiplier && multiplier !== 1) {
        const multipliedAmount = subtotal * multiplier;
        breakdown.push({
          label: `${field}: ${selectedValue}`,
          calculation: `₹${subtotal} × ${multiplier}`,
          amount: multipliedAmount
        });
        subtotal = multipliedAmount;
      }
    }
  }

  // 3️⃣ Add-ons (flat per sqft)
  if (category.addons) {
    for (const [field, map] of Object.entries(category.addons)) {
      const selectedValue = data[field];
      const addonRate = map?.[selectedValue];

      if (addonRate && addonRate > 0) {
        const addonAmount = area * addonRate;
        breakdown.push({
          label: `${field}: ${selectedValue}`,
          calculation: `${area} sqft × ₹${addonRate}`,
          amount: addonAmount
        });
        subtotal += addonAmount;
      }
    }
  }

  return {
    category: categoryId,
    area,
    currency,
    breakdown,
    total: Math.round(subtotal)
  };
}
