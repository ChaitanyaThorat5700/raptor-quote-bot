import "./bootstrap.js"; // 👈 MUST be FIRST, no imports before this

import express from "express";
import chatRoutes from "./routes/chat.routes.js";

const app = express();
app.use(express.json());

app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("RAPTOR Quote Bot API running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
