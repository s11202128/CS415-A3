import { useMemo } from "react";
import { Plus } from "lucide-react";
import DataTable, { StatusPill, TableButton } from "../ui/DataTable";

export default function AdminAccountsTab({
  accounts = [],
  adminAccountForm,
  setAdminAccountForm,
  onCreateAdminAccount,
  adminAccountMessage,
  onAdminUpdateAccount,
  onAdminFreezeAccount,
}) {
  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)),
    [accounts],
  );

  function statusTone(status) {
    const s = String(status || "").toLowerCase();
    if (s === "active") return "success";
    if (s === "frozen") return "info";
    if (s === "pending_approval") return "warning";
    if (s === "rejected" || s === "closed") return "danger";
    return "slate";
  }

  function renderActions(a) {
    const s = String(a.status || "").toLowerCase();
    if (s === "pending_approval") return (
      <div className="inline-flex gap-1.5 justify-end">
        <TableButton tone="success" onClick={() => onAdminUpdateAccount(a.id, { status: "active" })}>Approve</TableButton>
        <TableButton tone="danger"  onClick={() => onAdminUpdateAccount(a.id, { status: "rejected" })}>Reject</TableButton>
      </div>
    );
    if (s === "frozen") return <TableButton tone="primary" onClick={() => onAdminUpdateAccount(a.id, { status: "active" })}>Unfreeze</TableButton>;
    if (s === "active") return <TableButton tone="warning" onClick={() => onAdminFreezeAccount(a.id)}>Freeze</TableButton>;
    return <TableButton tone="primary" onClick={() => onAdminUpdateAccount(a.id, { status: "active" })}>Set Active</TableButton>;
  }

  const columns = [
    { key: "id", header: "Account ID", width: "100px",
      cell: (r) => <span className="font-mono text-xs text-navy-900">{r.id}</span> },
    { key: "accountNumber", header: "Account #",
      cell: (r) => <span className="font-mono text-xs">{r.accountNumber || "—"}</span> },
    { key: "customerId", header: "Customer ID", width: "110px",
      cell: (r) => <span className="font-mono text-xs">{r.customerId}</span> },
    { key: "accountHolder", header: "Holder",
      cell: (r) => <span className="font-semibold text-navy-900">{r.accountHolder || "—"}</span> },
    { key: "type", header: "Type" },
    { key: "status", header: "Status",
      cell: (r) => <StatusPill tone={statusTone(r.status)}>{r.status || "—"}</StatusPill> },
    { key: "balance", header: "Balance", align: "right",
      accessor: (r) => Number(r.balance || 0),
      cell: (r) => <span className="font-bold tabular-nums text-navy-900">FJD {Number(r.balance || 0).toFixed(2)}</span> },
    { key: "actions", header: "Actions", sortable: false, align: "right", cell: renderActions },
  ];

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";
  const labelCls = "block text-xs font-semibold text-slate-700";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-display text-base font-bold text-navy-900">Open New Account</h3>
          <p className="text-xs text-slate-500 mt-0.5">Create an account on behalf of a customer.</p>
        </div>
        <form onSubmit={onCreateAdminAccount} className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className={labelCls}>
            Customer Name
            <input className={`${inputCls} mt-1.5`}
              value={adminAccountForm.customerName}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, customerName: e.target.value })}
              placeholder="Existing or new customer" required />
          </label>
          <label className={labelCls}>
            Account Type
            <select className={`${inputCls} mt-1.5`}
              value={adminAccountForm.type}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, type: e.target.value })} required>
              <option value="Simple Access">Cheque</option>
              <option value="Savings">Savings</option>
            </select>
          </label>
          <label className={labelCls}>
            Opening Balance
            <input type="number" min="0" step="0.01" className={`${inputCls} mt-1.5`}
              value={adminAccountForm.openingBalance}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, openingBalance: e.target.value })} />
          </label>
          <label className={labelCls}>
            Account # (optional · 12 digits)
            <input className={`${inputCls} mt-1.5`}
              value={adminAccountForm.accountNumber}
              onChange={(e) => setAdminAccountForm({ ...adminAccountForm, accountNumber: e.target.value })}
              placeholder="Leave blank to auto-generate" />
          </label>
          <div className="md:col-span-2 lg:col-span-4 flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {adminAccountMessage
              ? <p className="text-xs text-slate-600">{adminAccountMessage}</p>
              : <span />}
            <button type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-card hover:shadow-card-hover transition-all">
              <Plus className="h-4 w-4" /> Create Account
            </button>
          </div>
        </form>
      </div>

      <DataTable
        title="Manage Account Requests"
        subtitle={`${sortedAccounts.length} accounts`}
        columns={columns}
        rows={sortedAccounts}
        searchPlaceholder="Search by holder, ID, account #, type, status…"
        defaultSort={{ key: "id", dir: "desc" }}
      />
    </div>
  );
}
