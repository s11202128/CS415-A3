"use strict";

const BankAccount = require("./BankAccount");

class SavingsAccount extends BankAccount {
  static FREE_WITHDRAWALS_PER_MONTH = 1;
  static FEE_PER_EXTRA_WITHDRAWAL = 5;

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
    const chargeable = Math.max(
      0,
      this.withdrawalCount - SavingsAccount.FREE_WITHDRAWALS_PER_MONTH
    );
    return chargeable * SavingsAccount.FEE_PER_EXTRA_WITHDRAWAL;
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
