"use strict";

const BankAccount = require("./BankAccount");

class AccessAccount extends BankAccount {
  static MONTHLY_FEE = 0.9;

  constructor({ accountId, owner, balance = 0 }) {
    super({ accountId, owner, accountType: "access", balance });
  }

  calculateMonthlyFee() {
    return AccessAccount.MONTHLY_FEE;
  }
}

module.exports = AccessAccount;
