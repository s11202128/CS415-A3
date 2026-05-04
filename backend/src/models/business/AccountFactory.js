"use strict";

const AccessAccount = require("./AccessAccount");
const SavingsAccount = require("./SavingsAccount");
const BusinessAccount = require("./BusinessAccount");

class AccountFactory {
  static SUPPORTED_TYPES = Object.freeze(["access", "savings", "business"]);

  static normalizeType(type) {
    return String(type || "").toLowerCase().trim();
  }

  static isSupported(type) {
    return AccountFactory.SUPPORTED_TYPES.includes(AccountFactory.normalizeType(type));
  }

  static createAccount(type, accountId, owner, opts = {}) {
    const normalized = AccountFactory.normalizeType(type);
    const payload = { accountId, owner, balance: opts.balance || 0 };
    switch (normalized) {
      case "access":
        return new AccessAccount(payload);
      case "savings":
        return new SavingsAccount(payload);
      case "business":
        return new BusinessAccount(payload);
      default:
        throw new Error(
          `Unsupported account type: ${type}. Expected one of: ${AccountFactory.SUPPORTED_TYPES.join(", ")}`
        );
    }
  }
}

module.exports = AccountFactory;
