"use strict";

const express = require("express");
const CreditCardAccount = require("../models/business/CreditCardAccount");
const { BusinessLayerCard, Customer } = require("../models");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}

function hydrate(row) {
  return new CreditCardAccount({
    cardNumber: row.cardNumber,
    customerId: row.customerId,
    creditLimit: Number(row.creditLimit),
    currentBalance: Number(row.currentBalance),
    statementDue: row.statementDue,
  });
}

async function persist(row, card) {
  row.currentBalance = card.currentBalance;
  await row.save();
}

async function loadOrFail(res, id) {
  const row = await BusinessLayerCard.findOne({ where: { cardNumber: String(id) } });
  if (!row) {
    sendError(res, 404, `Credit card not found: ${id}`);
    return null;
  }
  return row;
}

// GET /api/creditcard/list — admin-friendly listing with customer name + available credit.
router.get("/list", async (req, res) => {
  try {
    const rows = await BusinessLayerCard.findAll({ order: [["id", "ASC"]] });
    const customerIds = [
      ...new Set(
        rows
          .map((r) => Number(r.customerId))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    ];
    const customers = customerIds.length
      ? await Customer.findAll({ where: { id: customerIds } })
      : [];
    const nameMap = new Map(
      customers.map((c) => [String(c.id), c.fullName || c.email || ""]),
    );

    const items = rows.map((row) => {
      const card = hydrate(row);
      return {
        ...card.toSummary(),
        id: row.id,
        customerName: nameMap.get(String(row.customerId)) || "",
        availableCredit: card.getAvailableCredit(),
        frozen: Boolean(row.frozen),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
    res.json({ count: items.length, items });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// GET /api/creditcard/my-cards — customer-scoped listing of own credit cards.
router.get("/my-cards", requireAuth, async (req, res) => {
  try {
    const customerId = String(req.auth?.customerId);
    if (!customerId || customerId === "undefined") {
      return sendError(res, 401, "Authentication required");
    }

    const rows = await BusinessLayerCard.findAll({
      where: { customerId },
      order: [["id", "ASC"]],
    });

    const items = rows.map((row) => {
      const card = hydrate(row);
      return {
        cardNumber: card.cardNumber,
        creditLimit: Number(card.creditLimit),
        currentBalance: Number(card.currentBalance),
        availableCredit: card.getAvailableCredit(),
        statementDue: card.statementDue,
        frozen: Boolean(row.frozen),
      };
    });
    res.json({ count: items.length, items });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// POST /api/creditcard/create
router.post("/create", async (req, res) => {
  try {
    const { cardNumber, customerId, creditLimit, currentBalance, statementDue } = req.body || {};
    if (!customerId) {
      return sendError(res, 400, "customerId is required");
    }
    // customerId MUST match an existing customer in the bank.
    const numericCustomerId = Number(customerId);
    if (!Number.isInteger(numericCustomerId) || numericCustomerId <= 0) {
      return sendError(res, 400, "customerId must be a positive integer matching an existing customer");
    }
    const customer = await Customer.findByPk(numericCustomerId);
    if (!customer) {
      return sendError(res, 400, `Customer ${customerId} does not exist in the bank`);
    }
    const existing = await BusinessLayerCard.findOne({ where: { cardNumber: String(cardNumber) } });
    if (existing) {
      return sendError(res, 409, `Card ${cardNumber} already exists`);
    }
    const card = new CreditCardAccount({
      cardNumber,
      customerId: String(customer.id),
      creditLimit,
      currentBalance,
      statementDue,
    });
    const row = await BusinessLayerCard.create({
      cardNumber: card.cardNumber,
      customerId: card.customerId,
      creditLimit: card.creditLimit,
      currentBalance: card.currentBalance,
      statementDue: card.statementDue,
    });
    res.status(201).json(hydrate(row).toSummary());
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// POST /api/creditcard/:id/charge
router.post("/:id/charge", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    if (row.frozen) {
      return sendError(res, 423, "Card is frozen. Unfreeze before posting a charge.");
    }
    const card = hydrate(row);
    card.charge(req.body?.amount);
    await persist(row, card);
    res.json({
      cardNumber: card.cardNumber,
      currentBalance: card.currentBalance,
      availableCredit: card.getAvailableCredit(),
    });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// POST /api/creditcard/:id/payment
router.post("/:id/payment", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    if (row.frozen) {
      return sendError(res, 423, "Card is frozen. Unfreeze before posting a payment.");
    }
    const card = hydrate(row);
    card.makePayment(req.body?.amount);
    await persist(row, card);
    res.json({
      cardNumber: card.cardNumber,
      currentBalance: card.currentBalance,
      availableCredit: card.getAvailableCredit(),
    });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// GET /api/creditcard/:id/summary
router.get("/:id/summary", async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    res.json(hydrate(row).toSummary());
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

/* ────────────────────────── Admin-only routes ──────────────────────────
 * Manage card metadata (limit, statement due, owning customer) and close
 * cards. The customer-facing charge/payment routes above stay open as
 * before — these are the admin extensions for the management UI.
 * ─────────────────────────────────────────────────────────────────────── */

// PATCH /api/creditcard/:id — update creditLimit / statementDue / customerId.
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;

    const updates = {};
    if (req.body?.creditLimit !== undefined) {
      const limit = Number(req.body.creditLimit);
      if (!Number.isFinite(limit) || limit < 0) {
        return sendError(res, 400, "creditLimit must be a non-negative number");
      }
      if (limit < Number(row.currentBalance || 0)) {
        return sendError(
          res,
          400,
          "creditLimit cannot be lower than the current balance",
        );
      }
      updates.creditLimit = limit;
    }
    if (req.body?.statementDue !== undefined) {
      if (req.body.statementDue === null || req.body.statementDue === "") {
        updates.statementDue = null;
      } else {
        const d = new Date(req.body.statementDue);
        if (Number.isNaN(d.getTime())) {
          return sendError(res, 400, "statementDue must be a valid date");
        }
        updates.statementDue = d;
      }
    }
    if (req.body?.customerId !== undefined) {
      const cid = Number(req.body.customerId);
      if (!Number.isInteger(cid) || cid <= 0) {
        return sendError(res, 400, "customerId must be a positive integer");
      }
      const customer = await Customer.findByPk(cid);
      if (!customer) {
        return sendError(res, 400, `Customer ${cid} does not exist`);
      }
      updates.customerId = String(customer.id);
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, "No updatable fields provided");
    }

    await row.update(updates);
    const card = hydrate(row);
    res.json({
      ...card.toSummary(),
      id: row.id,
      availableCredit: card.getAvailableCredit(),
    });
  } catch (err) {
    sendError(res, 400, err.message);
  }
});

// POST /api/creditcard/:id/freeze — admin freeze.
router.post("/:id/freeze", requireAuth, requireAdmin, async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    await row.update({ frozen: true });
    res.json({ ok: true, cardNumber: row.cardNumber, frozen: true });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// POST /api/creditcard/:id/unfreeze — admin unfreeze.
router.post("/:id/unfreeze", requireAuth, requireAdmin, async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    await row.update({ frozen: false });
    res.json({ ok: true, cardNumber: row.cardNumber, frozen: false });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// DELETE /api/creditcard/:id — close a card. Refuses if there is an outstanding balance.
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const row = await loadOrFail(res, req.params.id);
    if (!row) return;
    if (Number(row.currentBalance || 0) > 0) {
      return sendError(
        res,
        409,
        "Cannot delete card with outstanding balance. Settle the balance first.",
      );
    }
    await row.destroy();
    res.json({ ok: true, cardNumber: row.cardNumber });
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

module.exports = router;
