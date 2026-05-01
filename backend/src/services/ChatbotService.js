/**
 * ChatbotService - core chatbot logic.
 *
 * Persistence: MySQL via Sequelize (ChatIssueModel). The `chat_issues`
 * table is created automatically by the existing sequelize.sync() call
 * in src/database.js since the model is registered on the same instance.
 *
 * Side effects:
 *   - When a query comes in unresolved, an email is dispatched to the
 *     configured support inbox (best-effort, never blocks the API).
 *   - In-memory session map remembers the last category for each
 *     sessionId so follow-up questions like "and for savings?" can be
 *     biased toward the previous topic.
 */

const { Op } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const ChatIssueModel = require("../models/ChatIssueModel");
const ChatSessionModel = require("../models/ChatSessionModel");
const KB = require("./KnowledgeBase");

let emailService = null;
try {
  emailService = require("./emailService");
} catch (_) {
  emailService = null;
}

const ESCALATION_MESSAGE =
  "Your query has been logged. Our support team will contact you shortly.";

const SUPPORT_INBOX =
  process.env.CHATBOT_SUPPORT_EMAIL || "support@bankoffiji.com.fj";

// sessionId -> { lastCategory, lastSeenAt }
const SESSION_CONTEXT = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

function rememberSession(sessionId, category) {
  if (!sessionId) return;
  SESSION_CONTEXT.set(sessionId, {
    lastCategory: category,
    lastSeenAt: Date.now(),
  });
}

function recallSession(sessionId) {
  if (!sessionId) return null;
  const ctx = SESSION_CONTEXT.get(sessionId);
  if (!ctx) return null;
  if (Date.now() - ctx.lastSeenAt > SESSION_TTL_MS) {
    SESSION_CONTEXT.delete(sessionId);
    return null;
  }
  return ctx;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of SESSION_CONTEXT.entries()) {
    if (now - v.lastSeenAt > SESSION_TTL_MS) SESSION_CONTEXT.delete(k);
  }
}, 5 * 60 * 1000).unref();

function toPlain(record) {
  if (!record) return null;
  const obj = typeof record.toJSON === "function" ? record.toJSON() : { ...record };
  if (obj.created_at && !obj.createdAt) obj.createdAt = obj.created_at;
  if (obj.resolved_at && !obj.resolvedAt) obj.resolvedAt = obj.resolved_at;
  delete obj.created_at;
  delete obj.updated_at;
  delete obj.resolved_at;
  return obj;
}

async function notifySupportOfUnresolvedIssue(issue) {
  if (!emailService || typeof emailService.sendEmail !== "function") return;
  try {
    const lines = [
      "A customer query could not be answered by the chatbot.",
      "",
      `Issue ID:    ${issue.issueId}`,
      `Customer:    ${issue.customerName}`,
      `Email:       ${issue.customerEmail || "(not provided)"}`,
      `Customer ID: ${issue.customerId || "(guest)"}`,
      `Created:     ${issue.createdAt}`,
      "",
      "Query:",
      issue.query,
    ];
    await emailService.sendEmail({
      to: SUPPORT_INBOX,
      subject: `[Chatbot] Unresolved issue ${String(issue.issueId).slice(0, 8)}`,
      text: lines.join("\n"),
    });
  } catch (err) {
    console.warn("[chatbot] failed to email support:", err.message);
  }
}

async function processQuery(customerName, query, customerId = null, customerEmail = null, sessionId = null) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) throw new Error("Query is required");

  let match = KB.findMatch(cleanQuery);

  // Conversation context: short follow-up retried with last category prefix.
  if (!match && sessionId) {
    const ctx = recallSession(sessionId);
    if (ctx && cleanQuery.split(/\s+/).length <= 4) {
      match = KB.findMatch(`${ctx.lastCategory} ${cleanQuery}`);
    }
  }

  const isResolved = !!match;
  const category = isResolved ? match.category : "other";
  const response = isResolved ? match.answer : ESCALATION_MESSAGE;
  const now = new Date();

  const created = await ChatIssueModel.create({
    issueId: uuidv4(),
    customerId: customerId ? Number(customerId) || null : null,
    customerName: (customerName && String(customerName).trim()) || "Guest",
    customerEmail: customerEmail ? String(customerEmail).trim() : null,
    sessionId: sessionId || null,
    query: cleanQuery,
    response,
    status: isResolved ? "resolved" : "unresolved",
    category,
    resolvedAt: isResolved ? now : null,
  });

  rememberSession(sessionId, category);

  // Upsert the session-level row so we can render aggregated views.
  if (sessionId) {
    try {
      const existing = await ChatSessionModel.findByPk(sessionId);
      if (!existing) {
        await ChatSessionModel.create({
          sessionId,
          customerId: customerId ? Number(customerId) || null : null,
          customerName: (customerName && String(customerName).trim()) || "Guest",
          customerEmail: customerEmail ? String(customerEmail).trim() : null,
          summary: cleanQuery.slice(0, 500),
          status: "open",
          messageCount: 1,
          startedAt: now,
        });
      } else {
        existing.messageCount = (existing.messageCount || 0) + 1;
        if (!existing.summary) existing.summary = cleanQuery.slice(0, 500);
        // Re-open if a follow-up arrives after a previous close.
        if (existing.status !== "open" && !existing.endedAt) existing.status = "open";
        await existing.save();
      }
    } catch (err) {
      console.warn("[chatbot] session upsert failed:", err.message);
    }
  }

  const issue = toPlain(created);
  if (!isResolved) notifySupportOfUnresolvedIssue(issue);
  return issue;
}

async function submitRating(issueId, rating, ratingComment = "") {
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }
  const record = await ChatIssueModel.findByPk(issueId);
  if (!record) throw new Error("Issue not found");
  record.rating = numericRating;
  record.ratingComment = ratingComment ? String(ratingComment).trim() : null;
  await record.save();
  return toPlain(record);
}

async function getResolvedIssues() {
  const rows = await ChatIssueModel.findAll({
    where: { status: "resolved" },
    order: [["created_at", "DESC"]],
  });
  return rows.map(toPlain);
}

async function getUnresolvedIssues() {
  const rows = await ChatIssueModel.findAll({
    where: { status: "unresolved" },
    order: [["created_at", "DESC"]],
  });
  return rows.map(toPlain);
}

async function getAllIssues() {
  const rows = await ChatIssueModel.findAll({ order: [["created_at", "DESC"]] });
  return rows.map(toPlain);
}

async function getIssueById(issueId) {
  const row = await ChatIssueModel.findByPk(issueId);
  return row ? toPlain(row) : null;
}

async function getMyIssues(customerId) {
  const id = Number(customerId);
  if (!Number.isFinite(id) || id <= 0) return [];
  const rows = await ChatIssueModel.findAll({
    where: { customerId: id },
    order: [["created_at", "DESC"]],
    limit: 100,
  });
  return rows.map(toPlain);
}

async function escalateIssue({
  issueId = null,
  customerName,
  customerEmail = null,
  phone = null,
  bestTime = null,
  message = "",
  customerId = null,
}) {
  const cleanName = (customerName && String(customerName).trim()) || "Guest";
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage && !issueId) {
    throw new Error("A message or originating issue id is required");
  }

  let originatingIssue = null;
  if (issueId) {
    originatingIssue = await ChatIssueModel.findByPk(issueId).catch(() => null);
  }

  // Persist the escalation request as its own ChatIssue row so admins
  // see it alongside other unresolved items.
  const created = await ChatIssueModel.create({
    issueId: uuidv4(),
    customerId: customerId ? Number(customerId) || null : null,
    customerName: cleanName,
    customerEmail: customerEmail ? String(customerEmail).trim() : null,
    sessionId: originatingIssue?.sessionId || null,
    query: `[ESCALATION] ${cleanMessage || "(no message)"}`,
    response:
      "Customer requested human follow-up. Phone: " +
      (phone || "n/a") +
      ". Best time: " +
      (bestTime || "any") +
      ".",
    status: "unresolved",
    category: "other",
    resolvedAt: null,
  });

  // Best-effort email
  if (emailService && typeof emailService.sendEmail === "function") {
    try {
      const lines = [
        "A customer requested human follow-up via the chatbot.",
        "",
        `Name:           ${cleanName}`,
        `Email:          ${customerEmail || "(not provided)"}`,
        `Phone:          ${phone || "(not provided)"}`,
        `Best time:      ${bestTime || "(any)"}`,
        `Customer ID:    ${customerId || "(guest)"}`,
        `Originating ID: ${issueId || "(none)"}`,
        "",
        "Message:",
        cleanMessage || "(none)",
      ];
      if (originatingIssue) {
        lines.push("", "Original query:", originatingIssue.query);
      }
      await emailService.sendEmail({
        to: SUPPORT_INBOX,
        subject: `[Chatbot] Callback request from ${cleanName}`,
        text: lines.join("\n"),
      });
    } catch (err) {
      console.warn("[chatbot] failed to email escalation:", err.message);
    }
  }

  return toPlain(created);
}

async function searchIssues(query) {
  const term = String(query || "").trim();
  if (!term) return getAllIssues();
  const like = `%${term}%`;
  const rows = await ChatIssueModel.findAll({
    where: {
      [Op.or]: [
        { customerName: { [Op.like]: like } },
        { query: { [Op.like]: like } },
      ],
    },
    order: [["created_at", "DESC"]],
  });
  return rows.map(toPlain);
}

async function getStats() {
  const all = await ChatIssueModel.findAll();
  const total = all.length;
  const resolved = all.filter((i) => i.status === "resolved").length;
  const unresolved = total - resolved;
  const ratings = all.map((i) => i.rating).filter((r) => Number.isFinite(r));
  const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;
  const issuesByCategory = {};
  for (const issue of all) {
    issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1;
  }
  return {
    totalIssues: total,
    resolvedCount: resolved,
    unresolvedCount: unresolved,
    averageRating: Number(avgRating.toFixed(2)),
    resolutionRate: total ? Number(((resolved / total) * 100).toFixed(2)) : 0,
    issuesByCategory,
  };
}

// ── Session-level helpers ─────────────────────────────────────────────

function sessionToPlain(session, issues = []) {
  if (!session) return null;
  const obj = typeof session.toJSON === "function" ? session.toJSON() : { ...session };
  if (obj.started_at && !obj.startedAt) obj.startedAt = obj.started_at;
  if (obj.ended_at && !obj.endedAt) obj.endedAt = obj.ended_at;
  if (obj.created_at && !obj.createdAt) obj.createdAt = obj.created_at;
  delete obj.started_at;
  delete obj.ended_at;
  delete obj.created_at;
  delete obj.updated_at;
  obj.issues = issues.map(toPlain);
  return obj;
}

async function closeSession(sessionId) {
  if (!sessionId) throw new Error("sessionId is required");
  const session = await ChatSessionModel.findByPk(sessionId);
  if (!session) throw new Error("Session not found");

  // Compute aggregate status from child issues.
  const issues = await ChatIssueModel.findAll({ where: { sessionId } });
  const anyUnresolved = issues.some((i) => i.status === "unresolved");
  session.status = anyUnresolved ? "unresolved" : "resolved";
  session.endedAt = new Date();
  if (issues.length) session.messageCount = issues.length;
  await session.save();
  return sessionToPlain(session, issues);
}

async function rateSession(sessionId, rating, comment = "") {
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }
  const session = await ChatSessionModel.findByPk(sessionId);
  if (!session) throw new Error("Session not found");
  session.rating = numericRating;
  session.comment = comment ? String(comment).trim() : null;
  if (!session.endedAt) session.endedAt = new Date();
  if (session.status === "open") {
    const issues = await ChatIssueModel.findAll({ where: { sessionId } });
    session.status = issues.some((i) => i.status === "unresolved") ? "unresolved" : "resolved";
  }
  await session.save();
  return sessionToPlain(session);
}

async function getAllSessions() {
  const sessions = await ChatSessionModel.findAll({ order: [["started_at", "DESC"]] });
  return sessions.map((s) => sessionToPlain(s));
}

async function getSessionById(sessionId) {
  const session = await ChatSessionModel.findByPk(sessionId);
  if (!session) return null;
  const issues = await ChatIssueModel.findAll({
    where: { sessionId },
    order: [["created_at", "ASC"]],
  });
  return sessionToPlain(session, issues);
}

async function getMySessions(customerId) {
  const id = Number(customerId);
  if (!Number.isFinite(id) || id <= 0) return [];
  const sessions = await ChatSessionModel.findAll({
    where: { customerId: id },
    order: [["started_at", "DESC"]],
    limit: 50,
  });
  return sessions.map((s) => sessionToPlain(s));
}

module.exports = {
  processQuery,
  submitRating,
  getResolvedIssues,
  getUnresolvedIssues,
  getAllIssues,
  getIssueById,
  getMyIssues,
  escalateIssue,
  searchIssues,
  getStats,
  closeSession,
  rateSession,
  getAllSessions,
  getSessionById,
  getMySessions,
  ESCALATION_MESSAGE,
};
