"use strict";

const BankAccount = require("./BankAccount");

class AccessAccount extends BankAccount {
  constructor({ accountId, owner, balance = 0 }) {
    super({ accountId, owner, accountType: "access", balance });
  }

  calculateMonthlyFee() {
    return 0.9;
  }
}

module.exports = AccessAccount;
