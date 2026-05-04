"use strict";

/**
 * Unit tests for NetIncomeReport calculation logic (no DB).
 * Run with:  npm run test:reports
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const NetIncomeReport = require("../NetIncomeReport");

test("constructor validates dates", () => {
  assert.throws(() => new NetIncomeReport({ fromDate: "", toDate: "2025-01-01" }), /fromDate/);
  assert.throws(() => new NetIncomeReport({ fromDate: "bogus", toDate: "2025-01-01" }), /not a valid date/);
  assert.throws(
    () => new NetIncomeReport({ fromDate: "2025-02-01", toDate: "2025-01-01" }),
    /on or before/
  );
});

test("currency normalised + period days inclusive", () => {
  const r = new NetIncomeReport({ fromDate: "2025-01-01", toDate: "2025-01-31", currency: "usd" });
  assert.equal(r.currency, "USD");
  assert.equal(r.periodDays, 31);
});

test("revenue / expense / netIncome / margin computed correctly", () => {
  const r = new NetIncomeReport({ fromDate: "2025-01-01", toDate: "2025-01-31" });
  r.feesCollected = 1000;
  r.loanInterestAccrued = 500;
  r.interestPaid = 200;
  assert.equal(r.totalRevenue, 1500);
  assert.equal(r.totalExpenses, 200);
  assert.equal(r.netIncome, 1300);
  assert.equal(r.marginPct, 86.67);
});

test("margin is 0 when no revenue", () => {
  const r = new NetIncomeReport({ fromDate: "2025-01-01", toDate: "2025-01-31" });
  r.interestPaid = 50;
  assert.equal(r.marginPct, 0);
});

test("toJSON shape contains required management fields", () => {
  const r = new NetIncomeReport({ fromDate: "2025-01-01", toDate: "2025-01-31", notes: "ok" });
  r.feesCollected = 100;
  const json = r.toJSON();
  assert.equal(json.bankName, "Bank of Fiji");
  assert.equal(json.reportTitle, "Net Income Statement");
  assert.equal(json.period.fromDate, "2025-01-01");
  assert.equal(json.period.toDate, "2025-01-31");
  assert.equal(json.period.days, 31);
  assert.equal(json.currency, "FJD");
  assert.equal(json.revenue.feesCollected, 100);
  assert.equal(json.netIncome, 100);
  assert.equal(json.notes, "ok");
});

test("round2 financial rounding", () => {
  assert.equal(NetIncomeReport.round2(1.234), 1.23);
  assert.equal(NetIncomeReport.round2(1.235), 1.24);
});
