import { getCategoryById } from "./product.util.js";
import { QUESTIONS } from "./questions.util.js";

/**
 * Decide the next question based on session state.
 * Uses:
 * - session.category
 * - session.collectedData
 * - category.requiredFields
 */
export function getNextQuestion(session) {
  if (!session) return "Hello! What service do you need? (Tile Fixing / Bathroom Renovation)";

  // If category not selected yet
  if (!session.category) {
    return "What service do you need? (Tile Fixing / Bathroom Renovation)";
  }

  const category = getCategoryById(session.category);
  if (!category) {
    return "Please choose a valid service: Tile Fixing / Bathroom Renovation";
  }

  const data = session.collectedData || {};

  for (const fieldKey of category.requiredFields) {
    if (data[fieldKey] === null || data[fieldKey] === undefined || data[fieldKey] === "") {
      return QUESTIONS[fieldKey] || `Please provide ${fieldKey}`;
    }
  }

  return null; // all collected
}
