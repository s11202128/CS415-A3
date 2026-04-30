"use strict";

const BankAccount = require("./BankAccount");

class SavingsAccount extends BankAccount {
  constructor({ accountId, owner, balance = 0 }) {
    super({ accountId, owner, accountType: "savings", balance });
    this.withdrawalCount = 0;
  }

  withdraw(amount) {
    const newBalance = super.withdraw(amount);
    this.withdrawalCount += 1;
    return newBalance;
  }

  calculateMonthlyFee() {
    return Math.max(0, this.withdrawalCount - 1) * 5;
  }

  resetMonthlyTrackers() {
    this.withdrawalCount = 0;
  }

  toSummary() {
    return {
      ...super.toSummary(),
      withdrawalCount: this.withdrawalCount,
      freeWithdrawalsRemaining: Math.max(0, 1 - this.withdrawalCount),
    };
  }
}

module.exports = SavingsAccount;
