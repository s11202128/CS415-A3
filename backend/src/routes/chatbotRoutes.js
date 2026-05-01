/**
 * Chatbot REST API
 *
 * Public:
 *   POST  /api/chatbot/query
 *   POST  /api/chatbot/rate/:issueId
 *
 * Admin only (requireAuth + requireAdmin):
 *   GET   /api/chatbot/issues
 *   GET   /api/chatbot/issues/resolved
 *   GET   /api/chatbot/issues/unresolved
 *   GET   /api/chatbot/issues/:issueId
 *   GET   /api/chatbot/search?q=...
 *   GET   /api/chatbot/stats
 *   GET   /api/chatbot/export.csv
 */

const express = require("express");
const router = express.Router();

const ChatbotService = require("../services/ChatbotService");
const { requireAuth, requireAdmin } = require("../middleware/auth");

// ─── Lightweight in-memory rate limiter ─────────────────────────────────
//   Limits POST /query to 30 requests per 60s per client IP.
//   Stops a single visitor from flooding the chat store.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 30;
const rateBuckets = new Map(); // ip -> { count, resetAt }

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();
  let bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    rateBuckets.set(ip, bucket);
  }
  bucket.count += 1;
  if (bucket.count > RATE_MAX) {
    const retryAfter = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfter));
    return res
      .status(429)
      .json({ error: "Too many chatbot requests. Please slow down." });
  }
  return next();
}

// Periodic cleanup so the map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets.entries()) {
    if (b.resetAt < now) rateBuckets.delete(ip);
  }
}, 5 * 60 * 1000).unref();

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return `"${value.toISOString()}"`;
  const s = String(value).replace(/"/g, '""');
  return `"${s}"`;
}

// ─── Public endpoints ───────────────────────────────────────────────────

router.post("/query", rateLimit, async (req, res) => {
  try {
    const { customerName, query, customerId, customerEmail, sessionId } = req.body || {};
    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: "Query is required" });
    }
    const issue = await ChatbotService.processQuery(
      customerName || "Guest",
      query,
      customerId || null,
      customerEmail || null,
      sessionId || null
    );
    return res.status(201).json(issue);
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to process query" });
  }
});

router.post("/rate/:issueId", async (req, res) => {
  try {
    const { rating, ratingComment } = req.body || {};
    const updated = await ChatbotService.submitRating(
      req.params.issueId,
      rating,
      ratingComment || ""
    );
    return res.json(updated);
  } catch (err) {
    const status = err.message === "Issue not found" ? 404 : 400;
    return res.status(status).json({ error: err.message || "Failed to submit rating" });
  }
});

// Escalate to human support (rate-limited, public so guests can use it)
router.post("/escalate", rateLimit, async (req, res) => {
  try {
    const created = await ChatbotService.escalateIssue(req.body || {});
    return res.status(201).json(created);
  } catch (err) {
    return res.status(400).json({ error: err.message || "Failed to escalate" });
  }
});

// Customer-scoped: returns issues belonging to the authenticated customer
router.get("/my-issues", requireAuth, async (req, res, next) => {
  try {
    const customerId = req.auth?.customerId;
    if (!customerId) return res.json([]);
    res.json(await ChatbotService.getMyIssues(customerId));
  } catch (e) { next(e); }
});

// ─── Session-level (public so guests can close their own session) ───
router.post("/sessions/:sessionId/close", async (req, res) => {
  try {
    const closed = await ChatbotService.closeSession(req.params.sessionId);
    res.json(closed);
  } catch (err) {
    const status = err.message === "Session not found" ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

router.post("/sessions/:sessionId/rate", async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const rated = await ChatbotService.rateSession(
      req.params.sessionId,
      rating,
      comment || ""
    );
    res.json(rated);
  } catch (err) {
    const status = err.message === "Session not found" ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

router.get("/my-sessions", requireAuth, async (req, res, next) => {
  try {
    const customerId = req.auth?.customerId;
    if (!customerId) return res.json([]);
    res.json(await ChatbotService.getMySessions(customerId));
  } catch (e) { next(e); }
});

router.get("/sessions", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await ChatbotService.getAllSessions()); } catch (e) { next(e); }
});

router.get("/sessions/:sessionId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const session = await ChatbotService.getSessionById(req.params.sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (e) { next(e); }
});

// ─── Admin-only endpoints ───────────────────────────────────────────────

router.get("/issues", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await ChatbotService.getAllIssues()); } catch (e) { next(e); }
});

router.get("/issues/resolved", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await ChatbotService.getResolvedIssues()); } catch (e) { next(e); }
});

router.get("/issues/unresolved", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await ChatbotService.getUnresolvedIssues()); } catch (e) { next(e); }
});

router.get("/search", requireAuth, requireAdmin, async (req, res, next) => {
  try { res.json(await ChatbotService.searchIssues(req.query.q || "")); } catch (e) { next(e); }
});

router.get("/stats", requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await ChatbotService.getStats()); } catch (e) { next(e); }
});

router.get("/export.csv", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const issues = await ChatbotService.getAllIssues();
    const header = [
      "issueId","customerId","customerName","customerEmail","status","category",
      "query","response","rating","ratingComment","createdAt","resolvedAt",
    ];
    const lines = [header.join(",")];
    for (const i of issues) {
      lines.push(header.map((k) => csvEscape(i[k])).join(","));
    }
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="chat_issues.csv"`);
    res.send(lines.join("\r\n"));
  } catch (e) { next(e); }
});

// Keep this LAST so it doesn't shadow /issues/resolved etc.
router.get("/issues/:issueId", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const issue = await ChatbotService.getIssueById(req.params.issueId);
    if (!issue) return res.status(404).json({ error: "Issue not found" });
    res.json(issue);
  } catch (e) { next(e); }
});

module.exports = router;
