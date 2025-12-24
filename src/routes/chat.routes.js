import express from "express";
import { analyzeUserMessage } from "../services/ai.service.js";
import {
  createSession,
  getSession,
  updateSession,
  setCategory
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

    // Safety check
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Session handling
    const currentSessionId = sessionId || createSession();
    const session = getSession(currentSessionId);

    if (!session) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    // AI analysis (IMPORTANT: pass session)
    const aiResponse = await analyzeUserMessage(message, session);

    // Save category if provided
    if (aiResponse.category) {
      setCategory(currentSessionId, aiResponse.category);
    }

    // Save extracted fields (ignore category)
    const { category, ...extractedData } = aiResponse;

    // Remove nulls so we don't overwrite previously collected values
    const cleanData = {};
    for (const [k, v] of Object.entries(extractedData)) {
      if (v !== null && v !== undefined && v !== "") cleanData[k] = v;
    }

    if (Object.keys(cleanData).length > 0) {
      updateSession(currentSessionId, cleanData);
    }

    // Re-fetch updated session
    const updatedSession = getSession(currentSessionId);

    // Ask next question
    const nextQuestion = getNextQuestion(updatedSession);

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
      collectedData: updatedSession
    });
  } catch (error) {
    console.error("Chat Route Error:", error);
    return res.status(500).json({
      error: "Something went wrong in chat flow"
    });
  }
});

export default router;
