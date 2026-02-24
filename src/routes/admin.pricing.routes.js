import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import express from "express";
import pool from "../config/db.js";

const router = express.Router();

/**
 * GET /admin/pricing
 * Fetch full pricing configuration from DB
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN"),
  async (req, res) => {
  try {
    const categories = await pool.query(
      "SELECT * FROM pricing_categories WHERE is_active = true"
    );

    const multipliers = await pool.query(
      "SELECT * FROM pricing_multipliers"
    );

    const addons = await pool.query(
      "SELECT * FROM pricing_addons"
    );

    return res.json({
      success: true,
      categories: categories.rows,
      multipliers: multipliers.rows,
      addons: addons.rows
    });
  } catch (error) {
    console.error("Get Pricing Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load pricing configuration"
    });
  }
});

/**
 * PUT /admin/pricing/category/:id
 * Update base price per sqft
 */
router.put("/category/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { base_price_per_sqft } = req.body;

    if (!base_price_per_sqft || base_price_per_sqft <= 0) {
      return res.status(400).json({
        success: false,
        error: "base_price_per_sqft must be positive"
      });
    }

    await pool.query(
      "UPDATE pricing_categories SET base_price_per_sqft = $1 WHERE id = $2",
      [base_price_per_sqft, id]
    );

    return res.json({
      success: true,
      message: "Base price updated successfully"
    });
  } catch (error) {
    console.error("Update Base Price Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update base price"
    });
  }
});

/**
 * PUT /admin/pricing/multiplier/:id
 * Update multiplier value
 */
router.put("/multiplier/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { multiplier } = req.body;

    if (!multiplier || multiplier <= 0) {
      return res.status(400).json({
        success: false,
        error: "Multiplier must be positive"
      });
    }

    await pool.query(
      "UPDATE pricing_multipliers SET multiplier = $1 WHERE id = $2",
      [multiplier, id]
    );

    return res.json({
      success: true,
      message: "Multiplier updated successfully"
    });
  } catch (error) {
    console.error("Update Multiplier Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update multiplier"
    });
  }
});

export default router;