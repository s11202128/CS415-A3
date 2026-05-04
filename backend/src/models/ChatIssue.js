/**
 * ChatIssue - data model representing a single chatbot interaction.
 *
 * The chatbot module persists issues to a JSON file (see ChatbotService),
 * so this class is a lightweight value object rather than a Sequelize model.
 * Existing Sequelize models are not affected.
 */

const { v4: uuidv4 } = require("uuid");

const VALID_STATUSES = new Set(["resolved", "unresolved"]);
const VALID_CATEGORIES = new Set([
  "account",
  "fees",
  "card",
  "loan",
  "transfer",
  "general",
  "fraud",
  "other",
]);

class ChatIssue {
  constructor({
    issueId,
    customerId = null,
    customerName,
    customerEmail = null,
    query,
    response,
    status,
    category,
    rating = null,
    ratingComment = null,
    createdAt,
    resolvedAt = null,
  } = {}) {
    this.issueId = issueId || uuidv4();
    this.customerId = customerId == null ? null : Number(customerId) || null;
    this.customerName = String(customerName || "").trim() || "Guest";
    this.customerEmail = customerEmail ? String(customerEmail).trim() : null;
    this.query = String(query || "").trim();
    this.response = String(response || "").trim();
    this.status = VALID_STATUSES.has(status) ? status : "unresolved";
    this.category = VALID_CATEGORIES.has(category) ? category : "other";
    this.rating = rating == null ? null : Number(rating);
    this.ratingComment = ratingComment ? String(ratingComment) : null;
    this.createdAt = createdAt || new Date().toISOString();
    this.resolvedAt = resolvedAt || (this.status === "resolved" ? this.createdAt : null);
  }

  toJSON() {
    return {
      issueId: this.issueId,
      customerId: this.customerId,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      query: this.query,
      response: this.response,
      status: this.status,
      category: this.category,
      rating: this.rating,
      ratingComment: this.ratingComment,
      createdAt: this.createdAt,
      resolvedAt: this.resolvedAt,
    };
  }

  static fromJSON(obj) {
    return new ChatIssue(obj);
  }
}

ChatIssue.VALID_STATUSES = VALID_STATUSES;
ChatIssue.VALID_CATEGORIES = VALID_CATEGORIES;

module.exports = ChatIssue;
