import express from "express";
import {
  getPricingConfig,
  savePricingConfig
} from "../services/pricingStore.service.js";

const router = express.Router();

/**
 * GET /admin/pricing
 * View full pricing configuration
 */
router.get("/", (req, res) => {
  try {
    const pricing = getPricingConfig();
    return res.json(pricing);
  } catch (error) {
    console.error("Get Pricing Error:", error);
    return res.status(500).json({
      error: "Failed to load pricing configuration"
    });
  }
});

/**
 * PUT /admin/pricing/category/:id
 * Update base price per sqft for a category
 */
router.put("/category/:id", (req, res) => {
  try {
    const { id } = req.params;
    const base_price_per_sqft = req.body?.base_price_per_sqft;

    // 🔐 Validation
    if (
      base_price_per_sqft === undefined ||
      typeof base_price_per_sqft !== "number" ||
      base_price_per_sqft <= 0
    ) {
      return res.status(400).json({
        error: "base_price_per_sqft must be a positive number"
      });
    }

    const config = getPricingConfig();
    const category = config.categories.find(c => c.id === id);

    if (!category) {
      return res.status(404).json({
        error: "Category not found"
      });
    }

    category.base_price_per_sqft = base_price_per_sqft;
    savePricingConfig(config);

    return res.json({
      message: "Base price updated successfully",
      category
    });
  } catch (error) {
    console.error("Update Base Price Error:", error);
    return res.status(500).json({
      error: "Failed to update base price"
    });
  }
});

/**
 * PUT /admin/pricing/multiplier/:category/:type
 * Update multiplier for tile type (or similar fields)
 */
router.put("/multiplier/:category/:type", (req, res) => {
  try {
    const { category, type } = req.params;
    const multiplier = req.body?.multiplier;

    // 🔐 Validation
    if (
      multiplier === undefined ||
      typeof multiplier !== "number" ||
      multiplier <= 0
    ) {
      return res.status(400).json({
        error: "multiplier must be a positive number"
      });
    }

    const config = getPricingConfig();
    const cat = config.categories.find(c => c.id === category);

    if (!cat) {
      return res.status(404).json({
        error: "Category not found"
      });
    }

    if (!cat.multipliers || !cat.multipliers.tileType) {
      return res.status(400).json({
        error: "Multipliers not configured for this category"
      });
    }

    if (!(type in cat.multipliers.tileType)) {
      return res.status(404).json({
        error: `Multiplier type '${type}' not found`
      });
    }

    cat.multipliers.tileType[type] = multiplier;
    savePricingConfig(config);

    return res.json({
      message: "Multiplier updated successfully",
      category,
      type,
      multiplier
    });
  } catch (error) {
    console.error("Update Multiplier Error:", error);
    return res.status(500).json({
      error: "Failed to update multiplier"
    });
  }
});

export default router;
