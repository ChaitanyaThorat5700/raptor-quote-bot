import express from "express";
import pool from "../config/db.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * ==============================
 * GET /api/admin/leads
 * List leads with optional status filter
 * ==============================
 */
router.get(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  async (req, res) => {
    try {
      const { status } = req.query;

      let query = `
        SELECT 
          l.*,
          q.public_code,
          q.total,
          q.category_id
        FROM leads l
        LEFT JOIN quotes q ON q.lead_id = l.id
      `;

      const values = [];

      if (status) {
        query += " WHERE l.status = $1";
        values.push(status);
      }

      query += " ORDER BY l.created_at DESC";

      const result = await pool.query(query, values);

      return res.json({
        success: true,
        count: result.rows.length,
        leads: result.rows
      });

    } catch (error) {
      console.error("Fetch leads error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch leads"
      });
    }
  }
);

/**
 * ==============================
 * PATCH /api/admin/leads/:id/status
 * Update lead status
 * ==============================
 */
router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status value"
        });
      }

      const updateRes = await pool.query(
        "UPDATE leads SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      if (updateRes.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Lead not found"
        });
      }

      return res.json({
        success: true,
        message: "Lead status updated",
        lead: updateRes.rows[0]
      });

    } catch (error) {
      console.error("Update lead status error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to update status"
      });
    }
  }
);

export default router;