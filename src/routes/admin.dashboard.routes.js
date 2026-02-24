import express from "express";
import pool from "../config/db.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

function buildDateFilter(range, from, to) {
  // returns { clause: 'AND ...', values: [...] }
  const values = [];
  let clause = "";

  const now = new Date();

  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    values.push(start.toISOString());
    clause = `AND created_at >= $${values.length}`;
  } else if (range === "week") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    values.push(start.toISOString());
    clause = `AND created_at >= $${values.length}`;
  } else if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    values.push(start.toISOString());
    clause = `AND created_at >= $${values.length}`;
  } else if (range === "custom") {
    // expects from/to in YYYY-MM-DD
    if (from) {
      values.push(new Date(`${from}T00:00:00`).toISOString());
      clause += `AND created_at >= $${values.length} `;
    }
    if (to) {
      values.push(new Date(`${to}T23:59:59`).toISOString());
      clause += `AND created_at <= $${values.length} `;
    }
    clause = clause.trim();
  }

  return { clause, values };
}

router.get(
  "/summary",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  async (req, res) => {
    try {
      const range = (req.query.range || "month").toString();
      const from = req.query.from?.toString();
      const to = req.query.to?.toString();

      // Leads date filter
      const leadFilter = buildDateFilter(range, from, to);
      // Quotes date filter
      const quoteFilter = buildDateFilter(range, from, to);

      // 1) Lead status counts
      const leadStatusSql = `
        SELECT status, COUNT(*)::int AS count
        FROM leads
        WHERE 1=1
        ${leadFilter.clause ? leadFilter.clause : ""}
        GROUP BY status
      `;
      const leadStatusRes = await pool.query(leadStatusSql, leadFilter.values);

      const leadStatusCounts = {
        NEW: 0,
        CONTACTED: 0,
        QUOTED: 0,
        WON: 0,
        LOST: 0
      };
      for (const row of leadStatusRes.rows) {
        leadStatusCounts[row.status] = Number(row.count) || 0;
      }

      const totalLeads =
        Object.values(leadStatusCounts).reduce((a, b) => a + b, 0);

      // 2) Quotes count + revenue
      const quotesSql = `
        SELECT 
          COUNT(*)::int AS total_quotes,
          COALESCE(SUM(total), 0)::numeric AS total_revenue
        FROM quotes
        WHERE 1=1
        ${quoteFilter.clause ? quoteFilter.clause : ""}
      `;
      const quotesRes = await pool.query(quotesSql, quoteFilter.values);

      const totalQuotes = quotesRes.rows[0]?.total_quotes ?? 0;
      const totalRevenue = quotesRes.rows[0]?.total_revenue ?? 0;

      return res.json({
        success: true,
        range,
        from: from || null,
        to: to || null,
        leads: {
          total: totalLeads,
          byStatus: leadStatusCounts
        },
        quotes: {
          total: totalQuotes,
          totalRevenue
        }
      });
    } catch (error) {
      console.error("Dashboard summary error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to load dashboard summary"
      });
    }
  }
);

export default router;