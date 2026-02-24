import express from "express";
import { createLeadFromQuote } from "../services/lead.service.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { publicCode, name, phone, email, address } = req.body;

    if (!publicCode || !name || !phone) {
      return res.status(400).json({
        success: false,
        error: "publicCode, name and phone are required"
      });
    }

    const result = await createLeadFromQuote({
      publicCode,
      name,
      phone,
      email,
      address
    });

    return res.json({
      success: true,
      message: "Lead created successfully",
      leadId: result.leadId
    });

  } catch (error) {
    if (error.message === "QUOTE_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Quote not found"
      });
    }

    console.error("Lead creation error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create lead"
    });
  }
});

export default router;