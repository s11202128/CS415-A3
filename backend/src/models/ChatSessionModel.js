/**
 * Sequelize model for chat_sessions.
 *
 * Aggregates many `chat_issues` rows under one session_id so we can hold
 * a single per-session rating and a finalised resolved/unresolved status.
 *
 * Auto-created via the existing sequelize.sync() pass.
 */

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChatSessionModel = sequelize.define(
  "ChatSession",
  {
    sessionId: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      field: "session_id",
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
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("open", "resolved", "unresolved"),
      allowNull: false,
      defaultValue: "open",
    },
    rating: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    messageCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "message_count",
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "started_at",
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "ended_at",
    },
  },
  {
    tableName: "chat_sessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["status"] },
      { fields: ["customer_id"] },
      { fields: ["started_at"] },
    ],
  }
);

module.exports = ChatSessionModel;
