"use strict";

/**
 * Base in-memory BankAccount class for the new account-type business layer.
 * Kept completely separate from the existing Sequelize Account model.
 */
class BankAccount {
  constructor({ accountId, owner, accountType, balance = 0 }) {
    if (!accountId) throw new Error("accountId is required");
    if (!owner) throw new Error("owner is required");
    if (!accountType) throw new Error("accountType is required");

    this.accountId = String(accountId);
    this.owner = String(owner);
    this.accountType = accountType;
    this.balance = Number(balance) || 0;
    this.transactions = [];
  }

  _validateAmount(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Amount must be a positive number");
    }
    return value;
  }

  deposit(amount) {
    const value = this._validateAmount(amount);
    this.balance += value;
    this.transactions.push({
      type: "deposit",
      amount: value,
      balanceAfter: this.balance,
      at: new Date().toISOString(),
    });
    return this.balance;
  }

  withdraw(amount) {
    const value = this._validateAmount(amount);
    if (value > this.balance) {
      throw new Error("Insufficient balance");
    }
    this.balance -= value;
    this.transactions.push({
      type: "withdraw",
      amount: value,
      balanceAfter: this.balance,
      at: new Date().toISOString(),
    });
    return this.balance;
  }

  getBalance() {
    return this.balance;
  }

  // Abstract — must be overridden
  calculateMonthlyFee() {
    throw new Error("calculateMonthlyFee() must be implemented by subclass");
  }

  static round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  applyMonthlyFee() {
    const fee = BankAccount.round2(this.calculateMonthlyFee());
    if (fee > 0) {
      this.balance = BankAccount.round2(this.balance - fee);
      this.transactions.push({
        type: "fee",
        amount: fee,
        balanceAfter: this.balance,
        at: new Date().toISOString(),
      });
    }
    return fee;
  }

  // Default no-op; subclasses override to clear monthly counters
  resetMonthlyTrackers() {
    /* no-op */
  }

  toSummary() {
    return {
      accountId: this.accountId,
      owner: this.owner,
      accountType: this.accountType,
      balance: this.balance,
      monthlyFee: this.calculateMonthlyFee(),
    };
  }
}

module.exports = BankAccount;
