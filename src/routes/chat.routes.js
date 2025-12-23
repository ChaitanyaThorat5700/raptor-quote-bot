import express from "express";
import { analyzeUserMessage } from "../services/ai.service.js";
import { createSession, getSession, updateSession } from "../services/session.service.js";
import { getCategoryById } from "../utils/product.util.js";
import { calculateEstimate } from "../services/pricing.service.js";

const router = express.Router();

router.post("/chat", async (req, res) => {

  const { message, sessionId } = req.body;

  const currentSessionId = sessionId || createSession();
  const session = getSession(currentSessionId);

  const aiResponse = await analyzeUserMessage(message);

  if (aiResponse.providedData) {
    updateSession(currentSessionId, aiResponse.providedData);
  }

  if (aiResponse.nextQuestion) {
    return res.json({
      sessionId: currentSessionId,
      reply: aiResponse.nextQuestion
    });
  }

  const category = getCategoryById(aiResponse.category);
  const price = calculateEstimate(category, session.collectedData);

  return res.json({
    sessionId: currentSessionId,
    reply: `Estimated cost is ₹${price}`,
    breakdown: session.collectedData
  });
});

export default router;
