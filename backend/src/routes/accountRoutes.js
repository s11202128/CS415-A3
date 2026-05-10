"use strict";

const express = require("express");
const AccountFactory = require("../models/business/AccountFactory");
const { BusinessLayerAccount, Account, sequelize } = require("../models");
const { requireAuth } = require("../middleware/auth");

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
  // Keep the canonical accounts table in sync so Dashboard and AccountCardsRow
  // always show the correct balance for Savings / Simple Access / Business accounts.
  await Account.update(
    { balance: account.balance },
    { where: { accountNumber: String(account.accountId) } }
  );
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
    const { type, accountId, owner, balance, customerId } = req.body || {};
    if (!type || !accountId) {
      return sendError(res, 400, "type and accountId are required");
    }
    const normalizedAccountId = String(accountId).trim();
    const normalizedCustomerId = Number(customerId);
    if (!Number.isFinite(normalizedCustomerId) || normalizedCustomerId <= 0) {
      return sendError(res, 400, "customerId is required and must be a positive number");
    }
    // accountId MUST match an existing accounts.accountNumber (12-digit) in the bank.
    const baseAccount = await Account.findOne({ where: { accountNumber: normalizedAccountId } });
    if (!baseAccount) {
      return sendError(res, 400, `Account number ${normalizedAccountId} does not exist in the bank`);
    }
    if (Number(baseAccount.customerId) !== normalizedCustomerId) {
      return sendError(
        res,
        400,
        `Account ${normalizedAccountId} belongs to customer ${baseAccount.customerId}, not customer ${normalizedCustomerId}`,
      );
    }
    const existing = await BusinessLayerAccount.findOne({ where: { accountId: normalizedAccountId } });
    if (existing) {
      return sendError(res, 409, `Account ${normalizedAccountId} already exists`);
    }
    // Business owner can be a business label and does not need to match accountHolder.
    const ownerName = (owner && String(owner).trim()) || baseAccount.accountHolder || "Unknown";
    const account = AccountFactory.createAccount(type, normalizedAccountId, ownerName, { balance });
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

/* ─────────────────────────── Customer-scoped routes ───────────────────────────
 * These are owned by the authenticated customer. Ownership is enforced by
 * matching the row's customerId against req.auth.customerId. They operate on
 * the canonical `accounts` table (Account model) — not BusinessLayerAccount.
 * ─────────────────────────────────────────────────────────────────────────── */

function serializeAccount(row) {
  return {
    id: row.id,
    customerId: row.customerId,
    accountNumber: row.accountNumber,
    accountHolder: row.accountHolder,
    accountType: row.accountType,
    nickname: row.nickname || null,
    isDefault: Boolean(row.isDefault),
    balance: Number(row.balance || 0),
    currency: row.currency || "FJD",
    status: row.status || "active",
  };
}

// GET /api/accounts/mine — list accounts owned by the authenticated customer.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const customerId = req.auth?.customerId;
    if (!customerId) return sendError(res, 401, "Authenticated customer required");
    const rows = await Account.findAll({
      where: { customerId },
      order: [
        ["isDefault", "DESC"],
        ["id", "ASC"],
      ],
    });

    // Overlay business-layer balances so Savings / Simple Access / Business
    // accounts always reflect the authoritative business-layer balance.
    const accountNumbers = rows.map((r) => r.accountNumber);
    const blRows = accountNumbers.length
      ? await BusinessLayerAccount.findAll({ where: { accountId: accountNumbers } })
      : [];
    const blMap = {};
    blRows.forEach((bl) => { blMap[bl.accountId] = Number(bl.balance); });

    const serialized = rows.map((r) => {
      const s = serializeAccount(r);
      if (Object.prototype.hasOwnProperty.call(blMap, r.accountNumber)) {
        s.balance = blMap[r.accountNumber];
      }
      return s;
    });

    res.json({ count: serialized.length, items: serialized });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// PATCH /api/accounts/:id/nickname — update nickname for an owned account.
router.patch("/:id/nickname", requireAuth, async (req, res) => {
  try {
    const customerId = req.auth?.customerId;
    if (!customerId) return sendError(res, 401, "Authenticated customer required");

    const raw = typeof req.body?.nickname === "string" ? req.body.nickname : "";
    const nickname = raw.trim().slice(0, 40);

    const row = await Account.findOne({ where: { id: req.params.id, customerId } });
    if (!row) return sendError(res, 404, "Account not found");

    row.nickname = nickname || null;
    await row.save();
    res.json(serializeAccount(row));
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// PATCH /api/accounts/:id/default — mark this account as default for the customer.
router.patch("/:id/default", requireAuth, async (req, res) => {
  const customerId = req.auth?.customerId;
  if (!customerId) return sendError(res, 401, "Authenticated customer required");

  const t = await sequelize.transaction();
  try {
    const row = await Account.findOne({
      where: { id: req.params.id, customerId },
      transaction: t,
    });
    if (!row) {
      await t.rollback();
      return sendError(res, 404, "Account not found");
    }
    await Account.update(
      { isDefault: false },
      { where: { customerId }, transaction: t },
    );
    row.isDefault = true;
    await row.save({ transaction: t });
    await t.commit();
    res.json(serializeAccount(row));
  } catch (err) {
    await t.rollback();
    sendError(res, 500, err.message);
  }
});

module.exports = router;
