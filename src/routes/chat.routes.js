import express from "express";
import { analyzeUserMessage } from "../services/ai.service.js";
import {
  createSession,
  getSession,
  updateSession,
  setCategory,
  setLastQuestion,
  setState
} from "../services/session.service.js";
import { getNextQuestion } from "../utils/flowManager.js";
import { calculateQuote } from "../services/pricing.service.js";

const router = express.Router();

/**
 * ✅ Helpers
 */
function ok(res, payload) {
  return res.json({ success: true, ...payload });
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, error: message });
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeAreaCandidate(message) {
  const m = String(message).match(/(\d+(\.\d+)?)/);
  if (!m) return null;
  const n = toNumber(m[1]);
  if (!n) return null;
  return Math.round(n);
}

function isValidArea(area) {
  const n = toNumber(area);
  if (!n) return false;
  if (n <= 0) return false;
  if (n > 200000) return false; // sanity cap
  return true;
}

function formatCurrency(amount, currency = "INR") {
  const num = Number(amount) || 0;
  if (currency === "INR") return "₹" + num.toLocaleString("en-IN");
  return String(num);
}

function formatServiceName(categoryId) {
  if (!categoryId) return "SERVICE";
  return String(categoryId).replaceAll("_", " ").toUpperCase();
}

/**
 * POST /api/chat
 * Body: { message, sessionId }
 */
router.post("/", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return fail(res, 400, "Message is required");
    }

    const lowerMessage = message.toLowerCase().trim();

    // Restart keywords
    const resetKeywords = ["restart", "start over", "cancel", "reset"];
    if (resetKeywords.some(k => lowerMessage.includes(k))) {
      const newSessionId = createSession();
      return ok(res, {
        sessionId: newSessionId,
        reply: "Sure 🙂 Let’s start fresh. What service do you need? (Tile Fixing / Bathroom Renovation)"
      });
    }

    // Range handling (1000-1200)
    const rangeMatch = message.match(/(\d+)\s*(to|-)\s*(\d+)/i);
    if (rangeMatch) {
      const sid = sessionId || createSession();
      return ok(res, {
        sessionId: sid,
        reply:
          `I see a range (${rangeMatch[1]}–${rangeMatch[3]} sqft). ` +
          `Please share a single approximate value (e.g., 1100).`
      });
    }

    // Session
    const currentSessionId = sessionId || createSession();
    const session = getSession(currentSessionId);

    if (!session) {
      return fail(res, 400, "Invalid or expired sessionId. Please restart.");
    }

    // AI extraction
    const aiResponse = await analyzeUserMessage(message, session);

    if (aiResponse?.category) {
      setCategory(currentSessionId, aiResponse.category);
    }

    const { category, ...extractedFields } = aiResponse || {};

    const cleanData = {};
    for (const [key, value] of Object.entries(extractedFields || {})) {
      if (value !== null && value !== undefined && value !== "") {
        cleanData[key] = value;
      }
    }

    // Area fallback if AI didn't catch it
    if (cleanData.area === undefined) {
      const fallbackArea = normalizeAreaCandidate(message);
      if (fallbackArea !== null) cleanData.area = fallbackArea;
    }

    // Friendly area validation
    if (cleanData.area !== undefined && !isValidArea(cleanData.area)) {
      return ok(res, {
        sessionId: currentSessionId,
        reply: "I couldn’t understand the area. Please share a valid number in square feet (e.g., 450)."
      });
    }

    if (Object.keys(cleanData).length > 0) {
      updateSession(currentSessionId, cleanData);
    }

    const updatedSession = getSession(currentSessionId);
    if (!updatedSession) {
      return fail(res, 400, "Session expired. Please restart.");
    }

    // Acknowledgement
    const acknowledgment =
      Object.keys(cleanData).length >= 2 ? "Got it 👍 I’ve noted those details. " : "";

    // Next question
    const nextQuestion = getNextQuestion(updatedSession);

    if (nextQuestion) {
      setState(currentSessionId, "COLLECTING_FIELDS");

      // Anti-loop
      if (updatedSession.lastQuestion === nextQuestion) {
        const rephrased = "Let me rephrase that 🙂 " + nextQuestion;
        setLastQuestion(currentSessionId, rephrased);
        return ok(res, { sessionId: currentSessionId, reply: rephrased });
      }

      setLastQuestion(currentSessionId, nextQuestion);
      return ok(res, {
        sessionId: currentSessionId,
        reply: acknowledgment + nextQuestion
      });
    }

    // Ensure category exists before quote
    if (!updatedSession.category) {
      setState(currentSessionId, "INIT");
      return ok(res, {
        sessionId: currentSessionId,
        reply: "Please choose a valid service first: Tile Fixing / Bathroom Renovation"
      });
    }

    setState(currentSessionId, "READY_FOR_QUOTE");

    // Calculate quote safely
    let quote;
    try {
      quote = calculateQuote(updatedSession.category, updatedSession.collectedData);
    } catch (e) {
      console.error("Quote calculation error:", e?.message || e);
      return ok(res, {
        sessionId: currentSessionId,
        reply: "I need a valid area in square feet to calculate the quote (e.g., 450)."
      });
    }

    setState(currentSessionId, "QUOTE_GENERATED");

    // Professional summary
    const serviceName = formatServiceName(updatedSession.category);
    const area = quote.area;
    const total = formatCurrency(quote.total, quote.currency);

    const formattedBreakdown = (quote.breakdown || [])
      .map(item => {
        const amt = formatCurrency(item.amount, quote.currency);
        return `• ${item.label}\n  ${item.calculation}\n  Amount: ${amt}`;
      })
      .join("\n\n");

    const summary = `
━━━━━━━━━━━━━━━━━━━━━━
🧾 QUOTATION SUMMARY
━━━━━━━━━━━━━━━━━━━━━━

Service: ${serviceName}
Area: ${area} sq.ft

Breakdown:
${formattedBreakdown}

━━━━━━━━━━━━━━━━━━━━━━
💰 TOTAL ESTIMATED COST
${total}
━━━━━━━━━━━━━━━━━━━━━━

Note: This is an approximate estimate based on provided details.
Final pricing may vary after site inspection.
`.trim();

    return ok(res, {
      sessionId: currentSessionId,
      reply: "Here is your quotation summary.",
      summary,
      quote
    });
  } catch (error) {
    console.error("Chat Route Error:", error);
    return fail(res, 500, "Something went wrong while generating the quotation");
  }
});

export default router;