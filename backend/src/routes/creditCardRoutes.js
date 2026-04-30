"use strict";

const express = require("express");
const CreditCardAccount = require("../models/business/CreditCardAccount");
const { BusinessLayerCard, Customer } = require("../models");

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

// GET /api/creditcard/list
router.get("/list", async (req, res) => {
  try {
    const rows = await BusinessLayerCard.findAll({ order: [["id", "ASC"]] });
    const items = rows.map((row) => hydrate(row).toSummary());
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

module.exports = router;
