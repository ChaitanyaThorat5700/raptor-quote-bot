export function calculateEstimate(category, collectedData) {
  let price = category.base_price_per_sqft * collectedData.area;

  if (collectedData.tile_type) {
    const multiplier =
      category.multipliers.tile_type[collectedData.tile_type];
    price *= multiplier;
  }

  return Math.round(price);
}
