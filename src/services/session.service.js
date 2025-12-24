import crypto from "crypto";

const sessions = {};

export function createSession() {
  const id = crypto.randomUUID();
  sessions[id] = {
    category: null,
    collectedData: {}
  };
  return id;
}

export function getSession(id) {
  return sessions[id] || null;
}

export function updateSession(id, data) {
  if (!sessions[id]) return;

  sessions[id].collectedData = {
    ...sessions[id].collectedData,
    ...data
  };
}

export function setCategory(id, category) {
  if (!sessions[id]) return;

  // Don't overwrite once set (prevents flip-flops)
  if (!sessions[id].category) {
    sessions[id].category = category;
  }
}
