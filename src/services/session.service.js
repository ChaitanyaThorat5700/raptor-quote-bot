import crypto from "crypto";

const sessions = {};

// ✅ Config
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function now() {
  return new Date();
}

function isExpired(session) {
  if (!session?.updatedAt) return true;
  return now().getTime() - new Date(session.updatedAt).getTime() > SESSION_TTL_MS;
}

// 🧹 Periodic cleanup to avoid memory leak
setInterval(() => {
  const ids = Object.keys(sessions);
  for (const id of ids) {
    if (isExpired(sessions[id])) {
      delete sessions[id];
    }
  }
}, CLEANUP_INTERVAL_MS);

export function createSession() {
  const id = crypto.randomUUID();
  const t = now().toISOString();

  sessions[id] = {
    state: "INIT", // INIT → CATEGORY_SELECTED → COLLECTING_FIELDS → READY_FOR_QUOTE → QUOTE_GENERATED
    category: null,
    collectedData: {},
    lastQuestion: null,
    createdAt: t,
    updatedAt: t
  };

  return id;
}

export function getSession(id) {
  const session = sessions[id] || null;
  if (!session) return null;

  // ✅ Expiry check
  if (isExpired(session)) {
    delete sessions[id];
    return null;
  }

  return session;
}

function touch(id) {
  if (!sessions[id]) return;
  sessions[id].updatedAt = now().toISOString();
}

export function updateSession(id, data) {
  if (!sessions[id]) return;

  sessions[id].collectedData = {
    ...sessions[id].collectedData,
    ...data
  };

  // ✅ If category exists, we’re collecting fields
  if (sessions[id].category) {
    sessions[id].state = "COLLECTING_FIELDS";
  }

  touch(id);
}

export function setCategory(id, category) {
  if (!sessions[id]) return;

  // ✅ Only set once
  if (!sessions[id].category) {
    sessions[id].category = category;
    sessions[id].state = "CATEGORY_SELECTED";
    touch(id);
  }
}

export function setLastQuestion(id, question) {
  if (!sessions[id]) return;
  sessions[id].lastQuestion = question;
  touch(id);
}

export function setState(id, state) {
  if (!sessions[id]) return;
  sessions[id].state = state;
  touch(id);
}