import "./bootstrap.js"; // MUST be first

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import chatRoutes from "./routes/chat.routes.js";
import adminPricingRoutes from "./routes/admin.pricing.routes.js";

const app = express();

/**
 * ✅ Environment log (helps during deployments + debugging)
 */
console.log("Environment:", process.env.NODE_ENV || "development");

/**
 * ✅ CORS (required for frontend)
 * For now allow all. Later you can restrict origin to your frontend domain.
 */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

/**
 * ✅ JSON body parser
 */
app.use(express.json());

/**
 * ✅ Basic request logging with response time
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
 * ✅ Rate limiting (recommended)
 * If you do not want rate limiting now, you can remove this block.
 */
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again shortly." }
});
app.use("/api/chat", chatLimiter);

/**
 * ✅ Routes
 */
app.use("/api/chat", chatRoutes);
app.use("/admin/pricing", adminPricingRoutes);

/**
 * ✅ Health check
 */
app.get("/", (req, res) => {
  res.json({ success: true, message: "RAPTOR Quote Bot API running 🚀" });
});

/**
 * ✅ Global error handler (safety net)
 */
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

/**
 * ✅ Start server
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});