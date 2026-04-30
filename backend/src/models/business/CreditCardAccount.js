"use strict";

/**
 * Standalone CreditCardAccount — intentionally NOT extending BankAccount.
 */
class CreditCardAccount {
  constructor({ cardNumber, customerId, creditLimit, currentBalance = 0, statementDue = null }) {
    if (!cardNumber) throw new Error("cardNumber is required");
    if (!customerId) throw new Error("customerId is required");
    const limit = Number(creditLimit);
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new Error("creditLimit must be a positive number");
    }
    this.cardNumber = String(cardNumber);
    this.customerId = String(customerId);
    this.creditLimit = limit;
    this.currentBalance = Number(currentBalance) || 0;
    this.statementDue = statementDue;
    this.transactions = [];
  }

  _validateAmount(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Amount must be a positive number");
    }
    return value;
  }

  charge(amount) {
    const value = this._validateAmount(amount);
    if (this.currentBalance + value > this.creditLimit) {
      throw new Error("Charge exceeds credit limit");
    }
    this.currentBalance += value;
    this.transactions.push({
      type: "charge",
      amount: value,
      balanceAfter: this.currentBalance,
      at: new Date().toISOString(),
    });
    return this.currentBalance;
  }

  makePayment(amount) {
    const value = this._validateAmount(amount);
    this.currentBalance = Math.max(0, this.currentBalance - value);
    this.transactions.push({
      type: "payment",
      amount: value,
      balanceAfter: this.currentBalance,
      at: new Date().toISOString(),
    });
    return this.currentBalance;
  }

  getAvailableCredit() {
    return Math.max(0, this.creditLimit - this.currentBalance);
  }

  toSummary() {
    return {
      cardNumber: this.cardNumber,
      customerId: this.customerId,
      creditLimit: this.creditLimit,
      currentBalance: this.currentBalance,
      availableCredit: this.getAvailableCredit(),
      statementDue: this.statementDue,
    };
  }
}

module.exports = CreditCardAccount;
