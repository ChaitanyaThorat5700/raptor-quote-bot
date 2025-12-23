import express from "express";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";

dotenv.config();

const app = express();

// middleware to read JSON body
app.use(express.json());

// routes
app.use("/api", chatRoutes);

// health check
app.get("/", (req, res) => {
  res.send("RAPTOR Quote Bot API running 🚀");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
