import express from "express";
import { analyzeUserMessage } from "../services/ai.service.js";
import {
  createSession,
  getSession,
  updateSession,
  setCategory,
  setLastQuestion
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

    const lowerMessage = message.toLowerCase();

    // 🔁 Restart / cancel handling
    const resetKeywords = ["restart", "start over", "cancel", "reset"];
    if (resetKeywords.some(k => lowerMessage.includes(k))) {
      const newSessionId = createSession();
      return res.json({
        sessionId: newSessionId,
        reply: "Sure 🙂 Let’s start fresh. What service do you need?"
      });
    }

    // 📏 Range handling (e.g. 1000–1200 sqft)
    const rangeMatch = message.match(/(\d+)\s*(to|-)\s*(\d+)/i);
    if (rangeMatch) {
      return res.json({
        sessionId: sessionId || createSession(),
        reply:
          `I see a range (${rangeMatch[1]}–${rangeMatch[3]} sqft). ` +
          `Please tell me an approximate single value so I can estimate accurately.`
      });
    }

    // 🔁 Session handling
    const currentSessionId = sessionId || createSession();
    const session = getSession(currentSessionId);

    if (!session) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    // 🤖 AI extraction (context-aware)
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

    // 👍 Acknowledgement if multiple details captured
    let acknowledgment = null;
    if (Object.keys(cleanData).length >= 2) {
      acknowledgment = "Got it 👍 I’ve noted those details.";
    }

    // ❓ Decide next question
    const nextQuestion = getNextQuestion(updatedSession);

    if (nextQuestion) {
      // 🔁 Anti-loop: same question repeated
      if (updatedSession.lastQuestion === nextQuestion) {
        const rephrased = "Let me rephrase that 🙂 " + nextQuestion;
        setLastQuestion(currentSessionId, rephrased);

        return res.json({
          sessionId: currentSessionId,
          reply: rephrased
        });
      }

      setLastQuestion(currentSessionId, nextQuestion);

      return res.json({
        sessionId: currentSessionId,
        reply: acknowledgment
          ? acknowledgment + " " + nextQuestion
          : nextQuestion
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
