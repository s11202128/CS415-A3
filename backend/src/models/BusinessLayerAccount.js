const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

/**
 * Persistence model for the new business-layer bank accounts.
 * Kept separate from the existing `Account` table to avoid touching legacy data.
 * Holds the per-account state needed to recompute monthly fees in code.
 */
const BusinessLayerAccount = sequelize.define(
  "BusinessLayerAccount",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    accountId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: "account_id",
    },
    accountType: {
      type: DataTypes.ENUM("access", "savings", "business"),
      allowNull: false,
      field: "account_type",
    },
    owner: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    balance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
    },
    withdrawalCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "withdrawal_count",
    },
    monthlyDeposits: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      field: "monthly_deposits",
    },
    monthlyWithdrawals: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      field: "monthly_withdrawals",
    },
  },
  {
    tableName: "business_layer_accounts",
    timestamps: true,
  }
);

module.exports = BusinessLayerAccount;
