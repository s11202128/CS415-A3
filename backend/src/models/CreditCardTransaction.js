const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreditCardTransaction = sequelize.define('CreditCardTransaction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  cardNumber: {
    type: DataTypes.STRING(32),
    allowNull: false,
    field: 'card_number',
  },
  customerId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'customer_id',
  },
  kind: {
    type: DataTypes.ENUM('charge', 'payment'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'balance_after',
  },
  performedByUserId: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    field: 'performed_by_user_id',
  },
}, {
  tableName: 'credit_card_transactions',
  timestamps: true,
  updatedAt: false,
});

module.exports = CreditCardTransaction;
