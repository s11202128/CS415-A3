"use strict";

const AccessAccount = require("./AccessAccount");
const SavingsAccount = require("./SavingsAccount");
const BusinessAccount = require("./BusinessAccount");

class AccountFactory {
  static createAccount(type, accountId, owner, opts = {}) {
    const normalized = String(type || "").toLowerCase().trim();
    const payload = { accountId, owner, balance: opts.balance || 0 };
    switch (normalized) {
      case "access":
        return new AccessAccount(payload);
      case "savings":
        return new SavingsAccount(payload);
      case "business":
        return new BusinessAccount(payload);
      default:
        throw new Error(`Unsupported account type: ${type}`);
    }
  }
}

module.exports = AccountFactory;
