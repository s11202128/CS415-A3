import { useState } from "react";
import DataTable, { StatusPill } from "../ui/DataTable";

function ComplianceSummariesTable({ summaries = [] }) {
  const columns = [
    { key: "accountId", header: "Account ID",
      cell: (r) => <span className="font-mono text-xs text-navy-900">{r.accountId}</span> },
    { key: "customerName", header: "Customer Name",
      cell: (r) => <span className="font-semibold text-navy-900">{r.customerName}</span> },
    { key: "year", header: "Year", align: "right", width: "80px" },
    { key: "grossInterest", header: "Gross Interest", align: "right",
      accessor: (r) => Number(r.grossInterest || 0),
      cell: (r) => <span className="font-bold tabular-nums text-navy-900">FJD {Number(r.grossInterest || 0).toFixed(2)}</span> },
    { key: "withholdingTax", header: "Withholding (15%)", align: "right",
      accessor: (r) => Number(r.withholdingTax || 0),
      cell: (r) => <span className="font-bold tabular-nums text-amber-700">FJD {Number(r.withholdingTax || 0).toFixed(2)}</span> },
    { key: "netInterest", header: "Net Interest", align: "right",
      accessor: (r) => Number(r.netInterest || 0),
      cell: (r) => <span className="font-bold tabular-nums text-emerald-700">FJD {Number(r.netInterest || 0).toFixed(2)}</span> },
    { key: "status", header: "Status",
      cell: (r) => <StatusPill tone="success">{r.status === "submitted_to_frcs" ? "✓ Submitted" : r.status}</StatusPill> },
    { key: "submittedAt", header: "Submitted",
      accessor: (r) => r.submittedAt,
      cell: (r) => <span className="text-slate-600">{new Date(r.submittedAt).toLocaleDateString()}</span> },
  ];
  return (
    <DataTable
      title="Tax Summaries"
      subtitle={`${summaries.length} records · withholding @ 15% applied to non-residents`}
      columns={columns}
      rows={summaries}
      searchPlaceholder="Search by customer, account, year…"
      defaultSort={{ key: "submittedAt", dir: "desc" }}
      emptyText='Generate tax reports first to see summaries here.'
    />
  );
}

export default function ComplianceTab({
  interestRate,
  setInterestRate,
  onUpdateRate,
  summaryYear,
  setSummaryYear,
  onGenerateSummaries,
  summaries,
  complianceMessage,
}) {
  // Calculate total interest and withholding from summaries
  const totals = summaries.reduce(
    (acc, s) => ({
      gross: acc.gross + (s.grossInterest || 0),
      withholding: acc.withholding + (s.withholdingTax || 0),
      net: acc.net + (s.netInterest || 0),
    }),
    { gross: 0, withholding: 0, net: 0 }
  );

  const residenceStatus = (status) => status === "resident" ? "🏠 Resident" : "🌍 Non-Resident";
  const [activeSection, setActiveSection] = useState("Interest Rate");
  const parsedInterestRate = Number(interestRate);
  const safeInterestRate = Number.isFinite(parsedInterestRate) ? parsedInterestRate : 0;

  return (
    <section className="panel-grid">
      <article className="panel wide compliance-dashboard">
        <nav className="acct-tab-bar">
          {["Interest Rate", "Tax Reports", "Tax Info", "Year Summary", "Tax Table", "Guidelines"].map((s) => (
            <button key={s} type="button" className={`acct-tab-btn${activeSection === s ? " active" : ""}`} onClick={() => setActiveSection(s)}>{s}</button>
          ))}
        </nav>
        <div className="acct-tab-body">

          {activeSection === "Interest Rate" && (
            <>
              <h2>📊 Reserve Bank Interest Rate</h2>
        <form onSubmit={onUpdateRate}>
          <label>
            Minimum Savings Interest Rate (decimal)
            <input
              type="number"
              step="0.0001"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              required
            />
          </label>
          <p className="hint">
            ℹ️ Currently: <strong>{(safeInterestRate * 100).toFixed(3)}%</strong> p.a. for Savings accounts
          </p>
          <button type="submit">✓ Update Rate</button>
        </form>
            </>
          )}

          {activeSection === "Tax Reports" && (
            <>
              <h2>📋 Generate Tax Reports</h2>
        <label>
          Fiscal Year
          <input type="number" value={summaryYear} onChange={(e) => setSummaryYear(e.target.value)} />
        </label>
        <p className="hint">
          Generate year-end interest summaries and submit to FRCS for tax compliance.
        </p>
        <button onClick={onGenerateSummaries} className="success-btn">
          📤 Generate + Submit to FRCS
        </button>
        {complianceMessage && (
          <p className={`status ${complianceMessage.includes("error") ? "error" : "ok"}`}>
            {complianceMessage}
          </p>
        )}
            </>
          )}

          {activeSection === "Tax Info" && (
            <>
              <h2>🧮 Tax Calculation Info</h2>
        <div className="tax-info">
          <div className="tax-rule">
            <strong>Withholding Tax Rate:</strong> 15% of gross interest
          </div>
          <div className="tax-rule">
            <strong>Applies To:</strong> All interest-earning accounts (Savings)
          </div>
          <div className="tax-rule">
            <strong>Submitted To:</strong> FRCS (Fiji Revenue & Customs Service)
          </div>
          <div className="tax-rule">
            <strong>Calculation:</strong> Gross Interest × 15% = Withholding Tax
          </div>
        </div>
            </>
          )}

          {activeSection === "Year Summary" && (
            <>
              <h2>💰 Year {summaryYear} Summary</h2>
              {summaries.length > 0 ? (
          <div className="summary-container">
            <div className="summary-stat">
              <span className="stat-label">Total Gross Interest:</span>
              <span className="stat-value">FJD {totals.gross.toFixed(2)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Total Withholding Tax (15%):</span>
              <span className="stat-value text-warning">FJD {totals.withholding.toFixed(2)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Net Interest (After Tax):</span>
              <span className="stat-value text-success">FJD {totals.net.toFixed(2)}</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Accounts with Interest:</span>
              <span className="stat-value">{summaries.length}</span>
            </div>
          </div>
              ) : (
                <p className="no-data">Generate tax reports first to see the year summary.</p>
              )}
            </>
          )}

          {activeSection === "Tax Table" && (
            <>
              <h2>📊 Interest Summaries & Tax Reports</h2>
              <ComplianceSummariesTable summaries={summaries} />
            </>
          )}

          {activeSection === "Guidelines" && (
            <>
              <h2>📖 Tax Compliance Guidelines</h2>
        <div className="compliance-guide">
          <section className="guide-section">
            <h3>Non-Resident Withholding Tax</h3>
            <ul>
              <li>
                <strong>Definition:</strong> A tax deducted at source from interest payments to non-resident customers
              </li>
              <li>
                <strong>Rate:</strong> 15% of gross interest earned
              </li>
              <li>
                <strong>Application:</strong> Automatically calculated when interest is credited to accounts
              </li>
              <li>
                <strong>Residency Check:</strong> Based on customer's TIN (Taxpayer Identification Number) status
              </li>
              <li>
                <strong>Adjustment:</strong> Tax can be recalculated if TIN status is updated
              </li>
            </ul>
          </section>

          <section className="guide-section">
            <h3>Savings Interest Calculation</h3>
            <ul>
              <li>
                <strong>Account Type:</strong> Applies to "Savings" type accounts only
              </li>
              <li>
                <strong>Rate:</strong> {(safeInterestRate * 100).toFixed(3)}% per annum (Reserve Bank minimum)
              </li>
              <li>
                <strong>Calculation:</strong> Balance × Annual Interest Rate
              </li>
              <li>
                <strong>Frequency:</strong> Calculated at year-end for annual tax reporting
              </li>
              <li>
                <strong>Account Type "Simple Access":</strong> No interest earned, only monthly maintenance fee
              </li>
            </ul>
          </section>

          <section className="guide-section">
            <h3>FRCS Submission Process</h3>
            <ul>
              <li>
                <strong>1. Generate:</strong> Click "Generate + Submit to FRCS" to create interest summaries
              </li>
              <li>
                <strong>2. Validation:</strong> System verifies all accounts and calculates tax obligations
              </li>
              <li>
                <strong>3. Submission:</strong> Interest summaries are submitted to FRCS API
              </li>
              <li>
                <strong>4. Confirmation:</strong> Status is marked as "submitted_to_frcs" once acknowledged
              </li>
              <li>
                <strong>5. Record Keeping:</strong> All submissions and calculations are retained for audit
              </li>
            </ul>
          </section>
        </div>
            </>
          )}

        </div>
      </article>
    </section>
  );
}
