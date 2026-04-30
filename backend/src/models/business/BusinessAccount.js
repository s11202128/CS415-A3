"use strict";

const BankAccount = require("./BankAccount");

const NET_INPUT_THRESHOLD = 2000;
const FLAT_FEE = 20;

class BusinessAccount extends BankAccount {
  constructor({ accountId, owner, balance = 0 }) {
    super({ accountId, owner, accountType: "business", balance });
    this.monthlyDeposits = 0;
    this.monthlyWithdrawals = 0;
  }

  deposit(amount) {
    const newBalance = super.deposit(amount);
    this.monthlyDeposits += Number(amount);
    return newBalance;
  }

  withdraw(amount) {
    const newBalance = super.withdraw(amount);
    this.monthlyWithdrawals += Number(amount);
    return newBalance;
  }

  get monthlyNetInput() {
    return this.monthlyDeposits - this.monthlyWithdrawals;
  }

  calculateMonthlyFee() {
    return this.monthlyNetInput < NET_INPUT_THRESHOLD ? FLAT_FEE : 0;
  }

  resetMonthlyTrackers() {
    this.monthlyDeposits = 0;
    this.monthlyWithdrawals = 0;
  }

  toSummary() {
    return {
      ...super.toSummary(),
      monthlyDeposits: this.monthlyDeposits,
      monthlyWithdrawals: this.monthlyWithdrawals,
      monthlyNetInput: this.monthlyNetInput,
      netInputThreshold: NET_INPUT_THRESHOLD,
    };
  }
}

module.exports = BusinessAccount;
