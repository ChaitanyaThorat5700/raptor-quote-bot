import { v4 as uuid } from "uuid";

const sessions = {};

export function createSession() {
  const sessionId = uuid();
  sessions[sessionId] = { collectedData: {} };
  return sessionId;
}

export function getSession(sessionId) {
  return sessions[sessionId];
}

export function updateSession(sessionId, data) {
  sessions[sessionId].collectedData = {
    ...sessions[sessionId].collectedData,
    ...data
  };
}
