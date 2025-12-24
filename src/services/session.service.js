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
  return sessions[id];
}

export function updateSession(id, data) {
  sessions[id].collectedData = {
    ...sessions[id].collectedData,
    ...data
  };
}

export function setCategory(id, category) {
  sessions[id].category = category;
}
