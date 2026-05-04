/**
 * Sequelize model registration for ChatIssue.
 *
 * Stored in MySQL table `chat_issues`. Created automatically when the
 * existing `sequelize.sync()` runs at server start.
 *
 * Kept in a separate file so the existing models/index.js does not need
 * to change. The chatbot module imports this directly.
 */

const { DataTypes } = require("sequelize");
const { v4: uuidv4 } = require("uuid");
const sequelize = require("../config/database");

const ChatIssueModel = sequelize.define(
  "ChatIssue",
  {
    issueId: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      defaultValue: () => uuidv4(),
      field: "issue_id",
    },
    customerId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      field: "customer_id",
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Guest",
      field: "customer_name",
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "customer_email",
    },
    sessionId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: "session_id",
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    response: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("resolved", "unresolved"),
      allowNull: false,
      defaultValue: "unresolved",
    },
    category: {
      type: DataTypes.ENUM(
        "account",
        "fees",
        "card",
        "loan",
        "transfer",
        "general",
        "fraud",
        "other"
      ),
      allowNull: false,
      defaultValue: "other",
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    ratingComment: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rating_comment",
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "resolved_at",
    },
  },
  {
    tableName: "chat_issues",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["status"] },
      { fields: ["category"] },
      { fields: ["customer_id"] },
      { fields: ["session_id"] },
    ],
  }
);

module.exports = ChatIssueModel;
