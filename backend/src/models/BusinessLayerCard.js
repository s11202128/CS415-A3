const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessLayerCard = sequelize.define(
  "BusinessLayerCard",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    cardNumber: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      field: "card_number",
    },
    customerId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      field: "customer_id",
    },
    creditLimit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      field: "credit_limit",
    },
    currentBalance: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
      defaultValue: 0,
      field: "current_balance",
    },
    statementDue: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "statement_due",
    },
  },
  {
    tableName: "business_layer_cards",
    timestamps: true,
  }
);

module.exports = BusinessLayerCard;
