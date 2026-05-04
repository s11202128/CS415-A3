import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const fmtMoney = (currency, n) => {
  const v = Number(n) || 0;
  return `${currency} ${Math.abs(v)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${v < 0 ? " (-)" : ""}`;
};

export default function AdminNetIncomeTab({ authToken }) {
  const [fromDate, setFromDate] = useState(monthStartISO());
  const [toDate, setToDate] = useState(todayISO());
  const [currency, setCurrency] = useState("FJD");
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const buildBody = () => ({ fromDate, toDate, currency, notes });

  const headers = () => ({
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  });

  const handlePreview = async () => {
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/net-income`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(buildBody()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setReport(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setError("");
    setDownloading(true);
    try {
      const res = await fetch(`${API_BASE}/reports/net-income/download`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(buildBody()),
      });
      if (!res.ok) {
        let msg = "Failed to download PDF";
        try {
          const j = await res.json();
          msg = j.error || msg;
        } catch (_e) { /* non-JSON */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `net-income-${fromDate}_to_${toDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="panel-grid">
      <article className="panel wide">
        <h2>Management Report — Net Income</h2>
        <p className="hint">
          Generate a net-income statement (fees collected + loan interest accrued − interest paid)
          for any date range. Preview on screen or download a polished PDF.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginTop: 14,
          }}
        >
          <label>
            From date
            <input
              type="date"
              value={fromDate}
              max={toDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label>
            To date
            <input
              type="date"
              value={toDate}
              min={fromDate}
              max={todayISO()}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <label>
            Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="FJD">FJD</option>
              <option value="USD">USD</option>
              <option value="AUD">AUD</option>
              <option value="NZD">NZD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Notes (optional)
            <textarea
              rows={2}
              value={notes}
              maxLength={500}
              placeholder="e.g. Q1 management review, board pack reference…"
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            className="primary"
            onClick={handlePreview}
            disabled={loading || !fromDate || !toDate}
          >
            {loading ? "Generating…" : "Preview report"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || !fromDate || !toDate}
          >
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </button>
        </div>

        {error && (
          <p className="status danger" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
      </article>

      {report && (
        <>
          <article className="panel kpi" style={{ gridColumn: "span 4" }}>
            <p className="hint">Total revenue</p>
            <div className="metric-xl">{fmtMoney(report.currency, report.revenue.total)}</div>
            <p className="hint" style={{ marginTop: 6 }}>Fees + loan interest accrued</p>
          </article>
          <article className="panel kpi" style={{ gridColumn: "span 4" }}>
            <p className="hint">Total expenses</p>
            <div
              className="metric-xl"
              style={{
                background: "linear-gradient(135deg,#0a1733,#ef4f6b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {fmtMoney(report.currency, report.expenses.total)}
            </div>
            <p className="hint" style={{ marginTop: 6 }}>Interest paid to depositors</p>
          </article>
          <article className="panel kpi" style={{ gridColumn: "span 4" }}>
            <p className="hint">Net income</p>
            <div
              className="metric-xl"
              style={{
                background:
                  report.netIncome >= 0
                    ? "linear-gradient(135deg,#0a1733,#14b88a)"
                    : "linear-gradient(135deg,#0a1733,#ef4f6b)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {fmtMoney(report.currency, report.netIncome)}
            </div>
            <span className={report.netIncome >= 0 ? "delta-up" : "delta-down"}>
              {report.marginPct.toFixed(2)}% margin
            </span>
          </article>

          <article className="panel wide">
            <h3>Period summary</h3>
            <p className="hint">
              {report.period.fromDate} → {report.period.toDate} • {report.period.days} day
              {report.period.days === 1 ? "" : "s"} • Generated{" "}
              {new Date(report.generatedAt).toLocaleString()}
            </p>
          </article>

          <article className="panel" style={{ gridColumn: "span 6" }}>
            <h3>Fee revenue breakdown</h3>
            {report.breakdown.fees.length === 0 ? (
              <div className="empty-state">No fee transactions in this period</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Count</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.fees.map((f) => (
                    <tr key={f.category}>
                      <td>{f.category}</td>
                      <td style={{ textAlign: "right" }} className="amount">{f.count}</td>
                      <td style={{ textAlign: "right" }} className="amount credit">
                        {fmtMoney(report.currency, f.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>

          <article className="panel" style={{ gridColumn: "span 6" }}>
            <h3>Interest paid breakdown</h3>
            {report.breakdown.interestPaid.length === 0 ? (
              <div className="empty-state">No interest payments in this period</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Count</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.interestPaid.map((f) => (
                    <tr key={f.category}>
                      <td>{f.category}</td>
                      <td style={{ textAlign: "right" }} className="amount">{f.count}</td>
                      <td style={{ textAlign: "right" }} className="amount debit">
                        {fmtMoney(report.currency, f.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>

          <article className="panel wide">
            <h3>Loan interest accrued (active loans)</h3>
            {report.breakdown.loanAccruals.length === 0 ? (
              <div className="empty-state">No active loans accruing interest in this period</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th style={{ textAlign: "right" }}>Principal</th>
                    <th style={{ textAlign: "right" }}>Rate %</th>
                    <th style={{ textAlign: "right" }}>Accrued</th>
                  </tr>
                </thead>
                <tbody>
                  {report.breakdown.loanAccruals.map((l) => (
                    <tr key={l.loanId}>
                      <td>#{l.loanId}</td>
                      <td style={{ textAlign: "right" }} className="amount">
                        {fmtMoney(report.currency, l.principal)}
                      </td>
                      <td style={{ textAlign: "right" }} className="amount">
                        {Number(l.rate).toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right" }} className="amount credit">
                        {fmtMoney(report.currency, l.accrued)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        </>
      )}
    </section>
  );
}
