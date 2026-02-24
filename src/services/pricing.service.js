import { getPricingCategory } from "./pricingDb.service.js";

/**
 * Calculate quotation based on DB pricing
 */
export async function calculateQuote(categoryId, data) {
  const pricingData = await getPricingCategory(categoryId);

  if (!pricingData) {
    throw new Error(`Pricing config not found for category: ${categoryId}`);
  }

  const { category, multipliers, addons } = pricingData;

  const area = Number(data.area);
  if (!area || area <= 0) {
    throw new Error("Invalid area for pricing calculation");
  }

  const breakdown = [];
  let subtotal = area * Number(category.base_price_per_sqft);

  breakdown.push({
    label: "Base cost",
    calculation: `${area} sqft × ₹${category.base_price_per_sqft}`,
    amount: subtotal
  });

  // Apply multipliers
  for (const m of multipliers) {
    const selectedValue = data[m.field_key];

    if (selectedValue === m.field_value && Number(m.multiplier) !== 1) {
      const multipliedAmount = subtotal * Number(m.multiplier);
      breakdown.push({
        label: `${m.field_key}: ${selectedValue}`,
        calculation: `₹${subtotal} × ${m.multiplier}`,
        amount: multipliedAmount
      });
      subtotal = multipliedAmount;
    }
  }

  // Apply addons
  for (const a of addons) {
    const selectedValue = data[a.field_key];

    if (selectedValue === a.field_value && Number(a.addon_rate_per_sqft) > 0) {
      const addonAmount = area * Number(a.addon_rate_per_sqft);
      breakdown.push({
        label: `${a.field_key}: ${selectedValue}`,
        calculation: `${area} sqft × ₹${a.addon_rate_per_sqft}`,
        amount: addonAmount
      });
      subtotal += addonAmount;
    }
  }

  return {
    category: categoryId,
    area,
    currency: category.currency,
    breakdown,
    total: Math.round(subtotal)
  };
}