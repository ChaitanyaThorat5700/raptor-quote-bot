import express from "express";
import { analyzeUserMessage } from "../services/ai.service.js";
import {
  createSession,
  getSession,
  updateSession,
  setCategory
} from "../services/session.service.js";
import { getNextQuestion } from "../utils/flowManager.js";
import { calculateQuote } from "../services/pricing.service.js";

const router = express.Router();

/**
 * POST /api
 * Body: { message, sessionId }
 */
router.post("/", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // 🔐 Basic validation
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 🔁 Session handling
    const currentSessionId = sessionId || createSession();
    const session = getSession(currentSessionId);

    if (!session) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    // 🤖 AI extraction (pass session for context)
    const aiResponse = await analyzeUserMessage(message, session);

    // 🧠 Save category (only once)
    if (aiResponse.category) {
      setCategory(currentSessionId, aiResponse.category);
    }

    // 🧠 Save extracted fields (ignore nulls + category)
    const { category, ...extractedFields } = aiResponse;

    const cleanData = {};
    for (const [key, value] of Object.entries(extractedFields)) {
      if (value !== null && value !== undefined && value !== "") {
        cleanData[key] = value;
      }
    }

    if (Object.keys(cleanData).length > 0) {
      updateSession(currentSessionId, cleanData);
    }

    // 🔄 Get updated session
    const updatedSession = getSession(currentSessionId);

    // ❓ Decide next question
    const nextQuestion = getNextQuestion(updatedSession);

    if (nextQuestion) {
      return res.json({
        sessionId: currentSessionId,
        reply: nextQuestion
      });
    }

    // 💰 All data collected → calculate quote
    const quote = calculateQuote(
      updatedSession.category,
      updatedSession.collectedData
    );

    return res.json({
      sessionId: currentSessionId,
      reply: "Thank you. Here is your quotation.",
      quote
    });

  } catch (error) {
    console.error("Chat Route Error:", error);
    return res.status(500).json({
      error: "Something went wrong while generating the quotation"
    });
  }
});

export default router;
