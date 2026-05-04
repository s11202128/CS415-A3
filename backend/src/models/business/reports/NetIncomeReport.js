"use strict";

const { Op } = require("sequelize");
const { Transaction, Loan } = require("../../index");

/**
 * NetIncomeReport — encapsulates the query, classification, and
 * aggregation logic for the management Net-Income report.
 *
 *   Net Income = (Fees Collected + Loan Interest Accrued) − Interest Paid
 *
 * Fees collected: any Transaction whose `type` or `transactionType`
 *                 matches /fee/i within the period (revenue to bank).
 * Interest paid : any Transaction matching /interest/i flagged as paid
 *                 to the customer (expense for the bank).
 * Loan interest : prorated simple-interest accrual on each active loan
 *                 over the date range.
 */
class NetIncomeReport {
  constructor({ fromDate, toDate, currency = "FJD", notes = "" }) {
    this.fromDate = NetIncomeReport._parseDate(fromDate, "fromDate");
    this.toDate = NetIncomeReport._parseDate(toDate, "toDate");
    if (this.fromDate > this.toDate) {
      throw new Error("fromDate must be on or before toDate");
    }
    this.currency = String(currency || "FJD").toUpperCase().slice(0, 6);
    this.notes = String(notes || "").trim().slice(0, 500);

    this.feesCollected = 0;
    this.interestPaid = 0;
    this.loanInterestAccrued = 0;
    this.feeBreakdown = [];      // [{ category, count, total }]
    this.interestBreakdown = []; // [{ category, count, total }]
    this.loanBreakdown = [];     // [{ loanId, principal, rate, accrued }]
    this.generatedAt = new Date();
  }

  static _parseDate(value, label) {
    if (!value) throw new Error(`${label} is required`);
    const d = new Date(value);
    if (isNaN(d.getTime())) throw new Error(`${label} is not a valid date`);
    return d;
  }

  static round2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  }

  get totalRevenue() {
    return NetIncomeReport.round2(this.feesCollected + this.loanInterestAccrued);
  }
  get totalExpenses() {
    return NetIncomeReport.round2(this.interestPaid);
  }
  get netIncome() {
    return NetIncomeReport.round2(this.totalRevenue - this.totalExpenses);
  }
  get marginPct() {
    if (this.totalRevenue <= 0) return 0;
    return NetIncomeReport.round2((this.netIncome / this.totalRevenue) * 100);
  }
  get periodDays() {
    return Math.max(
      1,
      Math.round((this.toDate - this.fromDate) / (1000 * 60 * 60 * 24)) + 1
    );
  }

  /** Run the queries and aggregate. Returns this for chaining. */
  async compute() {
    const range = {
      [Op.between]: [this.fromDate, this._endOfDay(this.toDate)],
    };

    // ---- Pull every transaction in the range once, then classify ----
    const txs = await Transaction.findAll({
      where: { createdAt: range },
      attributes: ["id", "type", "transactionType", "amount", "createdAt"],
    });

    const feeBuckets = new Map();
    const interestBuckets = new Map();

    for (const tx of txs) {
      const label = String(tx.transactionType || tx.type || "other").toLowerCase();
      const amount = Math.abs(Number(tx.amount) || 0);
      if (/fee|charge|maintenance/.test(label)) {
        this.feesCollected += amount;
        const b = feeBuckets.get(label) || { category: label, count: 0, total: 0 };
        b.count += 1;
        b.total = NetIncomeReport.round2(b.total + amount);
        feeBuckets.set(label, b);
      } else if (/interest/.test(label)) {
        this.interestPaid += amount;
        const b = interestBuckets.get(label) || { category: label, count: 0, total: 0 };
        b.count += 1;
        b.total = NetIncomeReport.round2(b.total + amount);
        interestBuckets.set(label, b);
      }
    }

    this.feesCollected = NetIncomeReport.round2(this.feesCollected);
    this.interestPaid = NetIncomeReport.round2(this.interestPaid);
    this.feeBreakdown = [...feeBuckets.values()].sort((a, b) => b.total - a.total);
    this.interestBreakdown = [...interestBuckets.values()].sort((a, b) => b.total - a.total);

    // ---- Loan interest accrued (prorated simple interest) ----
    const activeLoans = await Loan.findAll({
      where: {
        createdAt: { [Op.lte]: this._endOfDay(this.toDate) },
        status: { [Op.notIn]: ["closed", "rejected", "cancelled"] },
      },
      attributes: ["id", "principal", "interestRate", "createdAt", "maturityDate", "status"],
    });

    const yearMs = 365 * 24 * 60 * 60 * 1000;
    for (const loan of activeLoans) {
      const principal = Number(loan.principal) || 0;
      const rate = Number(loan.interestRate) || 0;
      if (principal <= 0 || rate <= 0) continue;

      // Effective date range = intersection of [fromDate, toDate] with loan lifetime
      const loanStart = new Date(loan.createdAt);
      const loanEnd = loan.maturityDate ? new Date(loan.maturityDate) : this._endOfDay(this.toDate);
      const start = new Date(Math.max(loanStart.getTime(), this.fromDate.getTime()));
      const end = new Date(Math.min(loanEnd.getTime(), this._endOfDay(this.toDate).getTime()));
      const overlapMs = end - start;
      if (overlapMs <= 0) continue;

      const accrued = NetIncomeReport.round2(principal * (rate / 100) * (overlapMs / yearMs));
      if (accrued > 0) {
        this.loanInterestAccrued = NetIncomeReport.round2(this.loanInterestAccrued + accrued);
        this.loanBreakdown.push({
          loanId: loan.id,
          principal: NetIncomeReport.round2(principal),
          rate,
          accrued,
        });
      }
    }
    this.loanBreakdown.sort((a, b) => b.accrued - a.accrued);

    return this;
  }

  _endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  }

  toJSON() {
    return {
      bankName: "Bank of Fiji",
      reportTitle: "Net Income Statement",
      generatedAt: this.generatedAt.toISOString(),
      currency: this.currency,
      period: {
        fromDate: this.fromDate.toISOString().slice(0, 10),
        toDate: this.toDate.toISOString().slice(0, 10),
        days: this.periodDays,
      },
      revenue: {
        feesCollected: this.feesCollected,
        loanInterestAccrued: this.loanInterestAccrued,
        total: this.totalRevenue,
      },
      expenses: {
        interestPaid: this.interestPaid,
        total: this.totalExpenses,
      },
      netIncome: this.netIncome,
      marginPct: this.marginPct,
      breakdown: {
        fees: this.feeBreakdown,
        interestPaid: this.interestBreakdown,
        loanAccruals: this.loanBreakdown,
      },
      notes: this.notes,
    };
  }
}

module.exports = NetIncomeReport;
