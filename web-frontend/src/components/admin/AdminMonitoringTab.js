import { useMemo, useState } from "react";
import { Activity, Sliders, BellRing, Bell, ShieldAlert } from "lucide-react";
import DataTable, { StatusPill, TableButton } from "../ui/DataTable";

const VIEWS = [
  { id: "transactions",  label: "Transactions",          icon: Activity },
  { id: "controls",      label: "Transfer Controls",     icon: Sliders },
  { id: "settings",      label: "Notification Settings", icon: Bell },
  { id: "notifications", label: "Notification Log",      icon: BellRing },
  { id: "logins",        label: "Login Activity",        icon: ShieldAlert },
];

function formatLogDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-FJ", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
  }).format(d);
}

export default function AdminMonitoringTab({
  accounts = [],
  transactions = [],
  selectedAccountForTx,
  setSelectedAccountForTx,
  adminTransferLimit,
  setAdminTransferLimit,
  onAdminUpdateTransferLimit,
  onAdminReverseTransaction,
  adminLoginLogs = [],
  adminNotificationLogs = [],
  adminNotificationPreferences = [],
  onAdminToggleNotificationPreference,
}) {
  const [activeView, setActiveView] = useState("transactions");

  /* ── transactions ── */
  const txColumns = useMemo(() => [
    { key: "createdAt", header: "Time",
      cell: (r) => <span className="text-slate-600 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</span> },
    { key: "kind", header: "Type",
      cell: (r) => <StatusPill tone={/deposit|credit/i.test(r.kind) ? "success" : "warning"}>{r.kind}</StatusPill> },
    { key: "amount", header: "Amount", align: "right",
      accessor: (r) => Number(r.amount || 0),
      cell: (r) => <span className="font-bold tabular-nums text-navy-900">FJD {Number(r.amount || 0).toFixed(2)}</span> },
    { key: "description", header: "Description",
      cell: (r) => <span className="truncate block max-w-xs" title={r.description}>{r.description}</span> },
    { key: "suspicious", header: "Risk",
      accessor: (r) => r.suspicious ? "Flagged" : "Normal",
      cell: (r) => <StatusPill tone={r.suspicious ? "danger" : "success"}>{r.suspicious ? "Flagged" : "Normal"}</StatusPill> },
    { key: "actions", header: "Action", sortable: false, align: "right",
      cell: (r) => (
        <TableButton tone="danger" disabled={r.status === "reversed"} onClick={() => onAdminReverseTransaction(r.id)}>
          {r.status === "reversed" ? "Reversed" : "Reverse"}
        </TableButton>
      ) },
  ], [onAdminReverseTransaction]);

  const prefColumns = [
    { key: "eventLabel", header: "Event",
      cell: (r) => <span className="font-semibold text-navy-900">{r.eventLabel}</span> },
    { key: "isEnabled", header: "Enabled", align: "right", sortable: false,
      cell: (r) => (
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={Boolean(r.isEnabled)}
            onChange={(e) => onAdminToggleNotificationPreference(r.eventKey, e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
          <StatusPill tone={r.isEnabled ? "success" : "slate"}>{r.isEnabled ? "Enabled" : "Disabled"}</StatusPill>
        </label>
      ) },
  ];

  const loginColumns = [
    { key: "createdAt", header: "Time",
      cell: (r) => <span className="text-slate-600 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</span> },
    { key: "userType", header: "User Type",
      cell: (r) => <StatusPill tone={r.userType === "admin" ? "navy" : "info"}>{r.userType}</StatusPill> },
    { key: "email", header: "Email",
      cell: (r) => <span className="truncate block max-w-[260px]" title={r.email}>{r.email}</span> },
    { key: "success", header: "Result",
      accessor: (r) => r.success ? "Success" : "Failed",
      cell: (r) => <StatusPill tone={r.success ? "success" : "danger"}>{r.success ? "Success" : "Failed"}</StatusPill> },
    { key: "failureReason", header: "Reason",
      cell: (r) => r.failureReason || <span className="text-slate-300">—</span> },
  ];

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";

  return (
    <div className="space-y-6">
      {/* Sub-view tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
        {VIEWS.map((v) => {
          const Icon = v.icon;
          const active = activeView === v.id;
          return (
            <button key={v.id} type="button" onClick={() => setActiveView(v.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                active
                  ? "bg-gradient-to-r from-navy-900 to-cyan-600 text-white shadow-card"
                  : "text-slate-600 hover:bg-slate-100 hover:text-navy-900"
              }`}>
              <Icon className="h-4 w-4" /> {v.label}
            </button>
          );
        })}
      </div>

      {activeView === "transactions" && (
        <DataTable
          title="Transaction Monitoring"
          subtitle={`${transactions.length} transactions`}
          columns={txColumns}
          rows={transactions}
          searchPlaceholder="Search by description, type, amount…"
          defaultSort={{ key: "createdAt", dir: "desc" }}
          toolbar={
            <select value={selectedAccountForTx} onChange={(e) => setSelectedAccountForTx(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.id} · {a.accountNumber || "N/A"}</option>
              ))}
            </select>
          }
        />
      )}

      {activeView === "controls" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4">
            <h3 className="font-display text-base font-bold text-navy-900">Transfer Controls</h3>
            <p className="text-xs text-slate-500 mt-0.5">Transfers at or above this threshold require OTP verification.</p>
          </div>
          <form onSubmit={onAdminUpdateTransferLimit} className="px-5 py-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="md:col-span-2 block text-xs font-semibold text-slate-700">
              High-value transfer limit (FJD)
              <input type="number" min="1" value={adminTransferLimit}
                onChange={(e) => setAdminTransferLimit(e.target.value)}
                className={`${inputCls} mt-1.5`} />
            </label>
            <button type="submit"
              className="rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-card hover:shadow-card-hover transition-all">
              Update Limit
            </button>
          </form>
        </div>
      )}

      {activeView === "settings" && (
        <DataTable
          title="Notification Settings"
          subtitle="Enable or disable customer notification services per event."
          columns={prefColumns}
          rows={adminNotificationPreferences}
          rowKey={(r) => r.eventKey}
          searchPlaceholder="Search events…"
          pageSize={25}
        />
      )}

      {activeView === "notifications" && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-navy-900">Notification Log</h3>
              <p className="text-xs text-slate-500 mt-0.5">Most recent customer notifications dispatched by the system.</p>
            </div>
            <StatusPill tone="info">{adminNotificationLogs.length} entries</StatusPill>
          </div>
          {adminNotificationLogs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No notifications yet.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {adminNotificationLogs.slice(0, 25).map((log) => (
                <li key={log.id} className="px-5 py-3 hover:bg-cyan-50/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <BellRing className="h-4 w-4 text-cyan-600 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">{formatLogDate(log.timestamp || log.createdAt || log.updatedAt)}</p>
                      <p className="text-sm text-navy-900 mt-0.5">{log.message}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeView === "logins" && (
        <DataTable
          title="Login Activity"
          subtitle={`${adminLoginLogs.length} login attempts logged`}
          columns={loginColumns}
          rows={adminLoginLogs}
          searchPlaceholder="Search by email, result, reason…"
          defaultSort={{ key: "createdAt", dir: "desc" }}
        />
      )}
    </div>
  );
}
