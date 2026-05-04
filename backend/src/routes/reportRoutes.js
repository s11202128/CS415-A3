"use strict";

const express = require("express");
const NetIncomeReport = require("../models/business/reports/NetIncomeReport");
const NetIncomePdfRenderer = require("../models/business/reports/NetIncomePdfRenderer");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// All report endpoints are management-only
router.use(requireAuth, requireAdmin);

function readParams(req) {
  const src = req.method === "GET" ? req.query : req.body || {};
  return {
    fromDate: src.fromDate || src.from || src.startDate,
    toDate: src.toDate || src.to || src.endDate,
    currency: src.currency,
    notes: src.notes,
  };
}

/**
 * POST /api/reports/net-income            (or GET — same params)
 * Body/Query: { fromDate, toDate, currency?, notes? }
 * Returns JSON of the computed report.
 */
async function jsonHandler(req, res) {
  try {
    const params = readParams(req);
    const report = new NetIncomeReport(params);
    await report.compute();
    res.json(report.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
router.post("/net-income", jsonHandler);
router.get("/net-income", jsonHandler);

/**
 * POST /api/reports/net-income/download   (or GET — same params)
 * Streams a polished PDF report.
 */
async function pdfHandler(req, res) {
  try {
    const params = readParams(req);
    const report = new NetIncomeReport(params);
    await report.compute();

    const filename = `net-income-${report.fromDate.toISOString().slice(0, 10)}_to_${report.toDate.toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    new NetIncomePdfRenderer(report).pipe(res);
  } catch (err) {
    if (!res.headersSent) {
      res.status(400).json({ error: err.message });
    } else {
      res.end();
    }
  }
}
router.post("/net-income/download", pdfHandler);
router.get("/net-income/download", pdfHandler);

module.exports = router;
