import pool from "../config/db.js";

/**
 * Fetch pricing category with multipliers and addons
 */
export async function getPricingCategory(categoryId) {
  const categoryRes = await pool.query(
    "SELECT * FROM pricing_categories WHERE id = $1 AND is_active = true",
    [categoryId]
  );

  if (categoryRes.rows.length === 0) {
    return null;
  }

  const category = categoryRes.rows[0];

  const multipliersRes = await pool.query(
    "SELECT field_key, field_value, multiplier FROM pricing_multipliers WHERE category_id = $1",
    [categoryId]
  );

  const addonsRes = await pool.query(
    "SELECT field_key, field_value, addon_rate_per_sqft FROM pricing_addons WHERE category_id = $1",
    [categoryId]
  );

  return {
    category,
    multipliers: multipliersRes.rows,
    addons: addonsRes.rows
  };
}