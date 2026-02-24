import "./bootstrap.js"; // MUST be first

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import adminLeadRoutes from "./routes/admin.leads.routes.js";

import pool from "./config/db.js";

import chatRoutes from "./routes/chat.routes.js";
import adminPricingRoutes from "./routes/admin.pricing.routes.js";
import leadRoutes from "./routes/lead.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

/**
 * ===============================
 * Environment Log
 * ===============================
 */
console.log("Environment:", process.env.NODE_ENV || "development");

/**
 * ===============================
 * CORS
 * ===============================
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

/**
 * ===============================
 * JSON Body Parser
 * ===============================
 */
app.use(express.json());

/**
 * ===============================
 * Request Logger
 * ===============================
 */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`
    );
  });
  next();
});

/**
 * ===============================
 * Rate Limiter (Chat only)
 * ===============================
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again shortly."
  }
});

app.use("/api/chat", chatLimiter);

/**
 * ===============================
 * API Routes
 * ===============================
 */

// Chat (Public)
app.use("/api/chat", chatRoutes);

// Leads
app.use("/api/leads", leadRoutes);

// Auth
app.use("/api/auth", authRoutes);

// Admin Pricing (Protected)
app.use("/api/admin/pricing", adminPricingRoutes);
app.use("/api/admin/leads", adminLeadRoutes);

/**
 * ===============================
 * Health Check
 * ===============================
 */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RAPTOR Quote Bot API running 🚀"
  });
});

/**
 * ===============================
 * Global Error Handler
 * ===============================
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

/**
 * ===============================
 * Start Server
 * ===============================
 */
const PORT = process.env.PORT || 5000;

// Verify DB Connection
(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("🟢 Database connection verified");
  } catch (err) {
    console.error("🔴 Database connection failed:", err);
  }
})();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});