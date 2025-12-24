import { QUOTE_FIELDS } from "../constants/quoteFields.js";

export function getNextQuestion(session) {
  for (const field of QUOTE_FIELDS) {
    if (!session[field.key]) {
      return field.question;
    }
  }
  return null;
}
