import express from "express";
import bodyParser from "body-parser";
import chatRoutes from "./routes/chat.routes.js";

const app = express();

app.use(bodyParser.json());

app.use("/api/chat", chatRoutes);

export default app;
