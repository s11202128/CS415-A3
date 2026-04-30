"use strict";

const express = require("express");
const AccountFactory = require("../models/business/AccountFactory");
const { BusinessLayerAccount, Account } = require("../models");

const router = express.Router();

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

// Hydrate an in-memory account class instance from a DB row,
// so all fee logic stays inside the model classes.
function hydrate(row) {
  const account = AccountFactory.createAccount(row.accountType, row.accountId, row.owner, {
    balance: Number(row.balance),
  });
  if (row.accountType === "savings") {
    account.withdrawalCount = Number(row.withdrawalCount) || 0;
  } else if (row.accountType === "business") {
    account.monthlyDeposits = Number(row.monthlyDeposits) || 0;
    account.monthlyWithdrawals = Number(row.monthlyWithdrawals) || 0;
  }
  return account;
}

async function persist(row, account) {
  row.balance = account.balance;
  if (account.accountType === "savings") {
    row.withdrawalCount = account.withdrawalCount;
  } else if (account.accountType === "business") {
    row.monthlyDeposits = account.monthlyDeposits;
    row.monthlyWithdrawals = account.monthlyWithdrawals;
  }
  await row.save();
}

async function loadOrFail(res, id) {
  const row = await BusinessLayerAccount.findOne({ where: { accountId: String(id) } });
  if (!row) {
    sendError(res, 404, `Account not found: ${id}`);
    return null;
  }
  return row;
}

// GET /api/accounts/list
router.get("/list", async (req, res) => {
  try {
    const rows = await BusinessLayerAccount.findAll({ order: [["id", "ASC"]] });
    const items = rows.map((row) => hydrate(row).toSummary());
    res.json({ count: items.length, items });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// POST /api/accounts/create
router.post("/create", async (req, res) => {
  try {
    const { type, accountId, owner, balance } = req.body || {};
    if (!type || !accountId) {
      return sendError(res, 400, "type and accountId are required");
    }
    // accountId MUST match an existing accounts.accountNumber (12-digit) in the bank.
    const baseAccount = await Account.findOne({ where: { accountNumber: String(accountId) } });
    if (!baseAccount) {
      return sendError(res, 400, `Account number ${accountId} does not exist in the bank`);
    }
    const existing = await BusinessLayerAccount.findOne({ where: { accountId: String(accountId) } });
    if (existing) {
      return sendError(res, 409, `Account ${accountId} already exists`);
    }
    // Use the real account holder if owner not supplied.
    const ownerName = (owner && String(owner).trim()) || baseAccount.accountHolder || "Unknown";
    const account = AccountFactory.createAccount(type, accountId, ownerName, { balance });
    const row = await BusinessLayerAccount.create({
      accountId: account.accountId,
      accountType: account.accountType,
      owner: account.owner,
      balance: account.balance,
      withdrawalCount: 0,
      monthlyDeposits: 0,
      monthlyWithdrawals: 0,
    });
    res.status(201).json(hydrate(row).toSummary());
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// POST /api/accounts/apply-monthly-fees  (must come before "/:id/...")
router.post("/apply-monthly-fees", async (req, res) => {
  try {
    const rows = await BusinessLayerAccount.findAll();
    const results = [];
    for (const row of rows) {
      const account = hydrate(row);
      const fee = account.applyMonthlyFee();
      account.resetMonthlyTrackers();
      await persist(row, account);
      results.push({
        accountId: account.accountId,
        accountType: account.accountType,
        feeApplied: fee,
        balance: account.balance,
      });
    }
    res.json({ processed: results.length, results });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// POST /api/accounts/:id/deposit
router.post("/:id/deposit", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    const account = hydrate(row);
    const balance = account.deposit(req.body?.amount);
    await persist(row, account);
    res.json({ accountId: account.accountId, balance });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// POST /api/accounts/:id/withdraw
router.post("/:id/withdraw", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    const account = hydrate(row);
    const balance = account.withdraw(req.body?.amount);
    await persist(row, account);
    res.json({ accountId: account.accountId, balance });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// GET /api/accounts/:id/balance
router.get("/:id/balance", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    res.json({ accountId: row.accountId, balance: Number(row.balance) });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// GET /api/accounts/:id/fee
router.get("/:id/fee", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    const account = hydrate(row);
    res.json({ accountId: account.accountId, monthlyFee: account.calculateMonthlyFee() });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// GET /api/accounts/:id/summary
router.get("/:id/summary", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    res.json(hydrate(row).toSummary());
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

module.exports = router;
