import express from "express";
import { analyzeUserMessage } from "../services/ai.service.js";
import {
  createSession,
  getSession,
  updateSession
} from "../services/session.service.js";
import { getNextQuestion } from "../utils/flowManager.js";

const router = express.Router();

/**
 * POST /api
 * Body: { message, sessionId }
 */
router.post("/", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // 🔐 Safety check
    if (!message) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    // 🔁 Session handling
    const currentSessionId = sessionId || createSession();
    const session = getSession(currentSessionId);

    // 🤖 AI analysis
    const aiResponse = await analyzeUserMessage(message);

    // 🧠 Save extracted data
    if (aiResponse.providedData) {
      updateSession(currentSessionId, aiResponse.providedData);
    }

    // ❓ Ask next question
    const nextQuestion = getNextQuestion(session);

    if (nextQuestion) {
      return res.json({
        sessionId: currentSessionId,
        reply: nextQuestion
      });
    }

    // ✅ All details collected
    return res.json({
      sessionId: currentSessionId,
      reply:
        "Thank you. I have collected all the details. I will now generate your quotation.",
      collectedData: session
    });
  } catch (error) {
    console.error("Chat Route Error:", error.message);
    res.status(500).json({
      error: "Something went wrong in chat flow"
    });
  }
});

export default router;
