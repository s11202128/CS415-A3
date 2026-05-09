import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Filter,
  Landmark,
  Search,
  Repeat,
  Receipt,
  Wallet,
} from "lucide-react";
import AccountCardsRow from "../account/AccountCardsRow";

export default function BillPaymentsTab({
  accounts,
  manualBillForm,
  setManualBillForm,
  onManualBill,
  scheduleBillForm,
  setScheduleBillForm,
  onScheduleBill,
  billHistory,
  runScheduledBill,
  billMessage,
}) {
  const FJD = (n) =>
    `FJ$${Number(n || 0).toLocaleString("en-FJ", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const toneFromMessage = (msg) => {
    if (!msg) return "idle";
    return /error|failed|invalid|cannot|insufficient/i.test(String(msg))
      ? "danger"
      : "success";
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
  };

  const statusTone = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("sched")) return "warning";
    if (s.includes("complete") || s.includes("paid") || s.includes("success")) return "success";
    if (s.includes("fail") || s.includes("error")) return "danger";
    return "default";
  };

  const manualPayeeOptions = [
    "EFL Electricity",
    "Water Authority Fiji",
    "Vodafone Fiji",
    "Digicel Fiji",
    "FNPF Contribution",
    "Municipal Rates",
  ];

  const [activeBillTab, setActiveBillTab] = useState("pay");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const hasAccounts = (accounts || []).length > 0;
  const recurrence = String(scheduleBillForm.frequency || "once").toLowerCase();

  const hasSharedBillDetails = Boolean(
    manualBillForm.accountId && manualBillForm.payee && manualBillForm.amount,
  );

  const historyRows = Array.isArray(billHistory) ? billHistory : [];

  const stats = useMemo(() => {
    const totalPaid = historyRows
      .filter((row) => !/scheduled/i.test(String(row.status || "")))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const scheduledCount = historyRows.filter((row) => /scheduled/i.test(String(row.status || ""))).length;
    return {
      totalBills: historyRows.length,
      scheduledBills: scheduledCount,
      completedBills: Math.max(0, historyRows.length - scheduledCount),
      totalPaid,
    };
  }, [historyRows]);

  const selectedAccount =
    (accounts || []).find((account) => String(account.id) === String(manualBillForm.accountId || "")) ||
    null;

  const filteredHistoryRows = useMemo(() => {
    const q = String(historySearch || "").trim().toLowerCase();
    const fromTs = historyDateFrom ? new Date(`${historyDateFrom}T00:00:00`).getTime() : null;
    const toTs = historyDateTo ? new Date(`${historyDateTo}T23:59:59`).getTime() : null;

    return historyRows.filter((row) => {
      const payee = String(row.payee || "").toLowerCase();
      const status = String(row.status || "").toLowerCase();
      const account = String(row.accountId || "").toLowerCase();
      const dtValue = row.scheduledDate || row.createdAt;
      const dtTs = dtValue ? new Date(dtValue).getTime() : null;

      if (q && !payee.includes(q) && !status.includes(q) && !account.includes(q) && !String(row.id || "").includes(q)) {
        return false;
      }
      if (historyStatus !== "all" && status !== historyStatus) {
        return false;
      }
      if (fromTs && Number.isFinite(dtTs) && dtTs < fromTs) {
        return false;
      }
      if (toTs && Number.isFinite(dtTs) && dtTs > toTs) {
        return false;
      }
      return true;
    });
  }, [historyRows, historySearch, historyStatus, historyDateFrom, historyDateTo]);

  function exportHistoryCsv() {
    const header = ["ID", "Payee", "Account", "Amount", "Date", "Status"];
    const rows = filteredHistoryRows.map((row) => [
      row.id,
      row.payee || "",
      row.accountId || "",
      Number(row.amount || 0).toFixed(2),
      formatDate(row.scheduledDate || row.createdAt),
      row.status || "",
    ]);

    const csv = [header, ...rows]
      .map((r) =>
        r
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bill-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportHistoryPrintView() {
    const win = window.open("", "_blank", "width=980,height=740");
    if (!win) return;
    const rows = filteredHistoryRows
      .map(
        (row) => `
          <tr>
            <td>${row.id ?? ""}</td>
            <td>${row.payee ?? ""}</td>
            <td>${row.accountId ?? ""}</td>
            <td>${FJD(row.amount)}</td>
            <td>${formatDate(row.scheduledDate || row.createdAt)}</td>
            <td>${row.status ?? ""}</td>
          </tr>
        `,
      )
      .join("");
    win.document.write(`
      <html>
        <head>
          <title>Bill Payment History</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 4px; }
            p { margin: 0 0 16px; color: #475569; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Bill Payment History</h1>
          <p>Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Payee</th><th>Account</th><th>Amount</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">No rows</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  }

  function updateSharedBillDetails(field, value) {
    setManualBillForm({ ...manualBillForm, [field]: value });
    setScheduleBillForm({ ...scheduleBillForm, [field]: value });
  }

  function handleBillSubmit(e) {
    if (scheduleEnabled) {
      onScheduleBill(e);
      return;
    }
    onManualBill(e);
  }

  return (
    <section className="space-y-6">
      <div>
        <AccountCardsRow />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Bill Records" value={stats.totalBills} icon={FileText} />
        <MetricCard label="Scheduled" value={stats.scheduledBills} icon={CalendarClock} tone="warning" />
        <MetricCard label="Completed" value={stats.completedBills} icon={CheckCircle2} tone="success" />
        <MetricCard label="Paid Value" value={FJD(stats.totalPaid)} icon={Wallet} tone="info" />
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <nav className="flex flex-wrap gap-2 border-b border-slate-100 px-5 py-4">
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeBillTab === "pay"
                ? "bg-gradient-to-r from-navy-900 to-cyan-600 text-white"
                : "bg-slate-100 text-navy-900 hover:bg-slate-200"
            }`}
            onClick={() => setActiveBillTab("pay")}
          >
            <span className="inline-flex items-center gap-2"><Receipt className="h-4 w-4" /> Pay Bill</span>
          </button>
          <button
            type="button"
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeBillTab === "history"
                ? "bg-gradient-to-r from-navy-900 to-cyan-600 text-white"
                : "bg-slate-100 text-navy-900 hover:bg-slate-200"
            }`}
            onClick={() => setActiveBillTab("history")}
          >
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> History</span>
          </button>
        </nav>

        <div className="p-5">
        {!hasAccounts && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            No account found. Open an account before using bill payment services.
          </p>
        )}
        {activeBillTab === "pay" ? (
          <>
          <div className="grid gap-6 lg:grid-cols-[1.35fr,0.9fr]">
            <form onSubmit={handleBillSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Debit Account
                  <select
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                    value={manualBillForm.accountId || ""}
                    onChange={(e) => updateSharedBillDetails("accountId", e.target.value)}
                    required
                  >
                    <option value="">Select account</option>
                    {(accounts || []).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} (#{account.id})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Payment Type
                  <select
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                    value={scheduleEnabled ? "on" : "off"}
                    onChange={(e) => setScheduleEnabled(e.target.value === "on")}
                  >
                    <option value="off">Instant Payment</option>
                    <option value="on">Scheduled Payment</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Payee
                  <select
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                    value={manualBillForm.payee}
                    onChange={(e) => updateSharedBillDetails("payee", e.target.value)}
                    required
                  >
                    <option value="">Select biller</option>
                    {manualPayeeOptions.map((payee) => (
                      <option key={payee} value={payee}>{payee}</option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Amount (FJD)
                  <input
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                    type="number"
                    min="1"
                    step="0.01"
                    value={manualBillForm.amount}
                    onChange={(e) => updateSharedBillDetails("amount", e.target.value)}
                    required
                  />
                </label>
              </div>

              {scheduleEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Scheduled Date
                    <input
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={scheduleBillForm.scheduledDate}
                      onChange={(e) =>
                        setScheduleBillForm({ ...scheduleBillForm, scheduledDate: e.target.value })
                      }
                      required
                    />
                  </label>

                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Recurrence
                    <select
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                      value={recurrence}
                      onChange={(e) =>
                        setScheduleBillForm({
                          ...scheduleBillForm,
                          frequency: e.target.value,
                        })
                      }
                    >
                      <option value="once">One-time</option>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </label>
                </div>
              )}

              {scheduleEnabled && recurrence !== "once" ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Recurring plan selected: this release schedules the first payment only. You can run or duplicate future items from History.
                </p>
              ) : null}

              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Submission Mode</p>
                  <p className="text-sm font-semibold text-navy-900">
                    {scheduleEnabled ? "Scheduled processing" : "Immediate payment"}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={
                    !hasAccounts ||
                    !hasSharedBillDetails ||
                    (scheduleEnabled && !scheduleBillForm.scheduledDate)
                  }
                  className="rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-card disabled:opacity-50"
                >
                  {scheduleEnabled ? "Schedule Bill" : "Pay Bill Now"}
                </button>
              </div>
            </form>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Selected Account</p>
                <p className="mt-1 text-sm font-semibold text-navy-900">
                  {selectedAccount ? selectedAccount.accountNumber : "No account selected"}
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  Balance: {selectedAccount ? FJD(selectedAccount.balance) : "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Quick Amounts</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[25, 50, 100, 250].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateSharedBillDetails("amount", String(value))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-slate-50"
                    >
                      {FJD(value)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Processing Notes</p>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  <li className="inline-flex items-center gap-2"><Landmark className="h-3.5 w-3.5 text-cyan-600" /> Instant bills post immediately.</li>
                  <li className="inline-flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5 text-cyan-600" /> Scheduled bills run on selected date.</li>
                  <li className="inline-flex items-center gap-2"><Repeat className="h-3.5 w-3.5 text-cyan-600" /> History tab lets you trigger pending items.</li>
                </ul>
              </div>
            </aside>
          </div>

          {billMessage ? (
            <p
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                toneFromMessage(billMessage) === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {billMessage}
            </p>
          ) : null}
          </>
        ) : (
          <>
          <div className="mb-4 grid gap-3 lg:grid-cols-[2fr,1fr,1fr,1fr,auto]">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Search
              <div className="relative mt-1.5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-navy-900"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Payee, status, account, ID"
                />
              </div>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Status
              <div className="relative mt-1.5">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-navy-900"
                  value={historyStatus}
                  onChange={(e) => setHistoryStatus(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="paid">Paid</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Date From
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                type="date"
                value={historyDateFrom}
                onChange={(e) => setHistoryDateFrom(e.target.value)}
              />
            </label>

            <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Date To
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900"
                type="date"
                value={historyDateTo}
                onChange={(e) => setHistoryDateTo(e.target.value)}
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={exportHistoryCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                type="button"
                onClick={exportHistoryPrintView}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5" /> PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">ID</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Payee</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Account</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Amount</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredHistoryRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-3 py-8 text-center text-slate-500">
                      No bill history matches your filters.
                    </td>
                  </tr>
                ) : (
                  filteredHistoryRows.map((b) => {
                    const scheduled = String(b.status || "").toLowerCase() === "scheduled";
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 font-semibold text-navy-900">#{b.id}</td>
                        <td className="px-3 py-2 text-slate-700">{b.payee || "-"}</td>
                        <td className="px-3 py-2 text-slate-700">{b.accountId || "-"}</td>
                        <td className="px-3 py-2 text-right font-semibold text-navy-900">{FJD(b.amount)}</td>
                        <td className="px-3 py-2 text-slate-700">{formatDate(b.scheduledDate || b.createdAt)}</td>
                        <td className="px-3 py-2">
                          <StatusPill tone={statusTone(b.status)}>{b.status || "unknown"}</StatusPill>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            disabled={!scheduled}
                            onClick={() => runScheduledBill(b.id)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-navy-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Run Now
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {billMessage ? (
            <p
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                toneFromMessage(billMessage) === "danger"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {billMessage}
            </p>
          ) : null}
          </>
        )}
        </div>
      </article>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon, tone = "default" }) {
  const color =
    tone === "success"
      ? "text-emerald-600"
      : tone === "warning"
      ? "text-amber-600"
      : tone === "info"
      ? "text-cyan-600"
      : "text-navy-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatusPill({ tone = "default", children }) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {children}
    </span>
  );
}
