"use strict";

const PDFDocument = require("pdfkit");

/**
 * Renders a NetIncomeReport into a polished, well-structured A4 PDF.
 * Pure presentation — receives a computed report and pipes to a stream.
 */
class NetIncomePdfRenderer {
  static BRAND_NAVY = "#0a1733";
  static BRAND_AZURE = "#1e7bff";
  static BRAND_EMERALD = "#14b88a";
  static BRAND_ROSE = "#ef4f6b";
  static BRAND_MUTED = "#5b6a85";
  static BRAND_LINE = "#dbe3f0";

  constructor(report) {
    this.report = report;
    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: 56, bottom: 56, left: 48, right: 48 },
      bufferPages: true,
      info: {
        Title: "Bank of Fiji — Net Income Report",
        Author: "Bank of Fiji",
        Subject: `Net Income ${report.fromDate.toISOString().slice(0, 10)} → ${report.toDate.toISOString().slice(0, 10)}`,
      },
    });
  }

  pipe(stream) {
    this.doc.pipe(stream);
    this._render();
    this.doc.end();
  }

  // ---------- formatting helpers ----------
  _money(n) {
    const v = Number(n) || 0;
    const sign = v < 0 ? "-" : "";
    return `${sign}${this.report.currency} ${Math.abs(v)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
  _date(d) { return new Date(d).toISOString().slice(0, 10); }

  // ---------- layout primitives ----------
  _hr(y, color = NetIncomePdfRenderer.BRAND_LINE) {
    const { left, right } = this.doc.page.margins;
    const x1 = left;
    const x2 = this.doc.page.width - right;
    this.doc.save().lineWidth(0.5).strokeColor(color).moveTo(x1, y).lineTo(x2, y).stroke().restore();
  }

  _sectionTitle(text) {
    this.doc.moveDown(0.6);
    this.doc
      .fillColor(NetIncomePdfRenderer.BRAND_NAVY)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text(text.toUpperCase(), { characterSpacing: 1.2 });
    this._hr(this.doc.y + 2, NetIncomePdfRenderer.BRAND_AZURE);
    this.doc.moveDown(0.5);
  }

  _kvRow(label, value, opts = {}) {
    const startY = this.doc.y;
    const { left, right } = this.doc.page.margins;
    const pageWidth = this.doc.page.width - left - right;
    this.doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(NetIncomePdfRenderer.BRAND_MUTED)
      .text(label, left, startY, { width: pageWidth * 0.55 });
    this.doc
      .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
      .fillColor(opts.color || NetIncomePdfRenderer.BRAND_NAVY)
      .fontSize(opts.fontSize || 10)
      .text(value, left + pageWidth * 0.55, startY, {
        width: pageWidth * 0.45,
        align: "right",
      });
    this.doc.moveDown(0.25);
  }

  _table(headers, rows, columnWeights) {
    const { left, right } = this.doc.page.margins;
    const pageWidth = this.doc.page.width - left - right;
    const totalWeight = columnWeights.reduce((a, b) => a + b, 0);
    const colWidths = columnWeights.map((w) => (w / totalWeight) * pageWidth);
    const rowH = 18;

    const drawHeader = () => {
      const y = this.doc.y;
      this.doc.save();
      this.doc.rect(left, y, pageWidth, rowH).fill("#eef4ff").restore();
      let x = left;
      this.doc.font("Helvetica-Bold").fontSize(9).fillColor(NetIncomePdfRenderer.BRAND_NAVY);
      headers.forEach((h, i) => {
        const align = i === 0 ? "left" : "right";
        this.doc.text(String(h).toUpperCase(), x + 6, y + 5, {
          width: colWidths[i] - 12,
          align,
          characterSpacing: 0.6,
        });
        x += colWidths[i];
      });
      this.doc.y = y + rowH;
    };

    drawHeader();

    if (!rows.length) {
      this.doc
        .font("Helvetica-Oblique")
        .fontSize(9.5)
        .fillColor(NetIncomePdfRenderer.BRAND_MUTED)
        .text("No data for this period.", left + 6, this.doc.y + 4);
      this.doc.moveDown(1);
      return;
    }

    rows.forEach((row, rowIdx) => {
      // page break
      if (this.doc.y + rowH > this.doc.page.height - this.doc.page.margins.bottom - 30) {
        this.doc.addPage();
        drawHeader();
      }
      const y = this.doc.y;
      if (rowIdx % 2 === 0) {
        this.doc.save().rect(left, y, pageWidth, rowH).fill("#fafcff").restore();
      }
      let x = left;
      this.doc.font("Helvetica").fontSize(9.5).fillColor(NetIncomePdfRenderer.BRAND_NAVY);
      row.forEach((cell, i) => {
        const align = i === 0 ? "left" : "right";
        this.doc.text(String(cell), x + 6, y + 5, {
          width: colWidths[i] - 12,
          align,
        });
        x += colWidths[i];
      });
      this.doc.y = y + rowH;
    });
    this.doc.moveDown(0.5);
  }

  _footerOnPage() {
    const { left, right } = this.doc.page.margins;
    const y = this.doc.page.height - 40;
    this._hr(y - 6, NetIncomePdfRenderer.BRAND_LINE);
    this.doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(NetIncomePdfRenderer.BRAND_MUTED)
      .text("Bank of Fiji • Confidential — Management Use Only", left, y, {
        width: this.doc.page.width - left - right,
        align: "left",
      });
    this.doc.text(
      `Generated ${this.report.generatedAt.toISOString().replace("T", " ").slice(0, 19)} UTC`,
      left,
      y,
      { width: this.doc.page.width - left - right, align: "right" }
    );
  }

  // ---------- main render ----------
  _render() {
    const r = this.report;
    const { left, right } = this.doc.page.margins;
    const pageWidth = this.doc.page.width - left - right;

    // === Header bar ===
    this.doc
      .save()
      .rect(0, 0, this.doc.page.width, 12)
      .fill(NetIncomePdfRenderer.BRAND_AZURE)
      .restore();

    this.doc
      .fillColor(NetIncomePdfRenderer.BRAND_NAVY)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Bank of Fiji", left, 30);
    this.doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(NetIncomePdfRenderer.BRAND_MUTED)
      .text("Management Financial Report", left, 56);

    this.doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(NetIncomePdfRenderer.BRAND_NAVY)
      .text("Net Income Statement", left, 88);

    this.doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(NetIncomePdfRenderer.BRAND_MUTED)
      .text(
        `Period: ${this._date(r.fromDate)}  to  ${this._date(r.toDate)}   •   ${r.periodDays} day${r.periodDays === 1 ? "" : "s"}   •   Currency: ${r.currency}`,
        left,
        116
      );

    this.doc.moveDown(2);

    // === Headline KPI box ===
    const kpiY = 150;
    const kpiH = 78;
    this.doc
      .save()
      .roundedRect(left, kpiY, pageWidth, kpiH, 8)
      .fill("#0a1733")
      .restore();

    const colW = pageWidth / 3;
    const drawKpi = (i, label, value, accent) => {
      const x = left + i * colW;
      this.doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#9bb0d4")
        .text(label.toUpperCase(), x + 18, kpiY + 14, { characterSpacing: 1.2 });
      this.doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .fillColor(accent)
        .text(value, x + 18, kpiY + 32, { width: colW - 24 });
    };
    drawKpi(0, "Total Revenue", this._money(r.totalRevenue), NetIncomePdfRenderer.BRAND_EMERALD);
    drawKpi(1, "Total Expenses", this._money(r.totalExpenses), NetIncomePdfRenderer.BRAND_ROSE);
    drawKpi(
      2,
      "Net Income",
      this._money(r.netIncome),
      r.netIncome >= 0 ? NetIncomePdfRenderer.BRAND_EMERALD : NetIncomePdfRenderer.BRAND_ROSE
    );

    this.doc.y = kpiY + kpiH + 18;

    // === Income statement summary ===
    this._sectionTitle("Income Statement Summary");
    this._kvRow("Fees collected", this._money(r.feesCollected));
    this._kvRow("Loan interest accrued", this._money(r.loanInterestAccrued));
    this._kvRow("Total revenue", this._money(r.totalRevenue), { bold: true, color: NetIncomePdfRenderer.BRAND_EMERALD });
    this.doc.moveDown(0.4);
    this._kvRow("Interest paid to depositors", this._money(r.interestPaid));
    this._kvRow("Total expenses", this._money(r.totalExpenses), { bold: true, color: NetIncomePdfRenderer.BRAND_ROSE });
    this.doc.moveDown(0.4);
    this._hr(this.doc.y);
    this.doc.moveDown(0.3);
    this._kvRow("NET INCOME", this._money(r.netIncome), {
      bold: true,
      fontSize: 12,
      color: r.netIncome >= 0 ? NetIncomePdfRenderer.BRAND_EMERALD : NetIncomePdfRenderer.BRAND_ROSE,
    });
    this._kvRow("Margin", `${r.marginPct.toFixed(2)} %`, { bold: true });

    // === Fee breakdown ===
    this._sectionTitle("Fee Revenue Breakdown");
    this._table(
      ["Category", "Count", "Total"],
      r.feeBreakdown.map((f) => [f.category, f.count, this._money(f.total)]),
      [3, 1, 2]
    );

    // === Interest breakdown ===
    this._sectionTitle("Interest Paid Breakdown");
    this._table(
      ["Category", "Count", "Total"],
      r.interestBreakdown.map((f) => [f.category, f.count, this._money(f.total)]),
      [3, 1, 2]
    );

    // === Loan accruals ===
    this._sectionTitle("Loan Interest Accrued (Active Loans)");
    this._table(
      ["Loan ID", "Principal", "Rate %", "Accrued"],
      r.loanBreakdown.map((l) => [
        `#${l.loanId}`,
        this._money(l.principal),
        l.rate.toFixed(2),
        this._money(l.accrued),
      ]),
      [2, 2, 1, 2]
    );

    // === Notes ===
    if (r.notes) {
      this._sectionTitle("Notes");
      this.doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(NetIncomePdfRenderer.BRAND_NAVY)
        .text(r.notes, { width: pageWidth, align: "left" });
    }

    // === Footer on every page ===
    const range = this.doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      this.doc.switchToPage(i);
      this._footerOnPage();
    }
  }
}

module.exports = NetIncomePdfRenderer;
