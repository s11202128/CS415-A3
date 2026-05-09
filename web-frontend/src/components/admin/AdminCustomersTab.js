import { useMemo, useState } from "react";
import DataTable, { StatusPill, TableButton } from "../ui/DataTable";

export default function AdminCustomersTab({ customers = [], accounts = [], onAdminUpdateCustomer }) {
  const [tinInputs, setTinInputs] = useState({});

  const customerAccountData = useMemo(() => {
    return accounts.reduce((map, account) => {
      const customerId = String(account.customerId || "");
      if (!customerId) return map;
      if (!map[customerId]) map[customerId] = { numbers: [], ids: [], types: [], balances: [], totalBalance: 0 };
      if (account.accountNumber) map[customerId].numbers.push(String(account.accountNumber));
      if (account.id != null)    map[customerId].ids.push(String(account.id));
      if (account.type)          map[customerId].types.push(String(account.type));
      const bal = Number(account.balance);
      if (Number.isFinite(bal)) {
        map[customerId].balances.push(`FJD ${bal.toFixed(2)}`);
        map[customerId].totalBalance += bal;
      }
      return map;
    }, {});
  }, [accounts]);

  const enriched = useMemo(() => customers.map((c) => {
    const ae = customerAccountData[String(c.id)] || { numbers: [], ids: [], types: [], balances: [], totalBalance: 0 };
    return {
      ...c,
      _accountNumbers: ae.numbers.join(", ") || "—",
      _accountIds:     ae.ids.join(", ")     || "—",
      _accountTypes:   ae.types.join(", ")   || "—",
      _balancesText:   ae.balances.join(", ") || "—",
      _totalBalance:   ae.totalBalance,
      _accountCount:   ae.ids.length,
    };
  }), [customers, customerAccountData]);

  function statusTone(status) {
    const s = String(status || "active").toLowerCase();
    if (s === "active") return "success";
    if (s === "locked") return "warning";
    if (s === "disabled") return "danger";
    return "slate";
  }

  function verificationLabel(c) {
    if (c.identityVerified) return { text: "Verified",       tone: "success" };
    if (c.emailVerified)    return { text: "Email Verified", tone: "info" };
    return { text: "Pending", tone: "warning" };
  }

  const columns = [
    { key: "id", header: "Customer", width: "200px",
      cell: (r) => (
        <div className="min-w-0">
          <div className="font-semibold text-navy-900 truncate">{r.fullName}</div>
          <div className="font-mono text-[11px] text-slate-500">#{r.id}</div>
        </div>
      ) },
    { key: "_accountIds", header: "Accounts",
      accessor: (r) => r._accountCount,
      cell: (r) => (
        <div className="text-xs">
          <div className="font-semibold text-navy-900">{r._accountCount} account(s)</div>
          <div className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]" title={r._accountNumbers}>
            {r._accountNumbers}
          </div>
        </div>
      ) },
    { key: "_totalBalance", header: "Total Balance", align: "right",
      cell: (r) => <span className="font-bold tabular-nums text-navy-900">FJD {r._totalBalance.toFixed(2)}</span> },
    { key: "email", header: "Contact",
      cell: (r) => (
        <div className="text-xs">
          <div className="text-slate-700 truncate max-w-[180px]" title={r.email}>{r.email || "—"}</div>
          <div className="font-mono text-[11px] text-slate-500">{r.mobile || "—"}</div>
        </div>
      ) },
    { key: "nationalId", header: "National ID / TIN",
      cell: (r) => (
        <div className="text-xs">
          <div className="font-mono text-navy-900">{r.nationalId || "—"}</div>
          <div className="font-mono text-[11px] text-slate-500">TIN: {r.tin || "—"}</div>
        </div>
      ) },
    { key: "residencyStatus", header: "Residency",
      accessor: (r) => r.residencyStatus || "resident",
      cell: (r) => <StatusPill tone="info">{r.residencyStatus || "resident"}</StatusPill> },
    { key: "_verification", header: "Verification",
      accessor: (r) => verificationLabel(r).text,
      cell: (r) => { const v = verificationLabel(r); return <StatusPill tone={v.tone}>{v.text}</StatusPill>; } },
    { key: "status", header: "Status",
      accessor: (r) => r.status || "active",
      cell: (r) => <StatusPill tone={statusTone(r.status)}>{r.status || "active"}</StatusPill> },
    { key: "actions", header: "Actions", sortable: false, align: "right", width: "320px",
      cell: (r) => (
        <div className="flex flex-col items-end gap-1.5 min-w-[300px]">
          <div className="flex items-center gap-1.5 w-full">
            <input
              placeholder="TIN"
              value={tinInputs[r.id] ?? r.tin ?? ""}
              onChange={(e) => setTinInputs({ ...tinInputs, [r.id]: e.target.value })}
              className="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
            <TableButton tone="primary" onClick={() => onAdminUpdateCustomer(r.id, { tin: tinInputs[r.id] ?? r.tin ?? "" })}>
              Update TIN
            </TableButton>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            <TableButton onClick={() => onAdminUpdateCustomer(r.id, { residencyStatus: "resident" })}>Resident</TableButton>
            <TableButton onClick={() => onAdminUpdateCustomer(r.id, { residencyStatus: "non-resident" })}>Non-Res</TableButton>
            <TableButton tone="success" onClick={() => onAdminUpdateCustomer(r.id, { identityVerified: true })}>Verify ID</TableButton>
            <TableButton tone="success" onClick={() => onAdminUpdateCustomer(r.id, { emailVerified: true })}>Verify Email</TableButton>
            <TableButton tone="success" onClick={() => onAdminUpdateCustomer(r.id, { registrationStatus: "approved" })}>Approve</TableButton>
            <TableButton tone="warning" onClick={() => onAdminUpdateCustomer(r.id, { status: "locked" })}>Lock</TableButton>
            <TableButton tone="success" onClick={() => onAdminUpdateCustomer(r.id, { status: "active", failedLoginAttempts: 0, lockedUntil: null })}>Unlock</TableButton>
            <TableButton tone="danger"  onClick={() => onAdminUpdateCustomer(r.id, { status: "disabled" })}>Disable</TableButton>
          </div>
        </div>
      ) },
  ];

  return (
    <DataTable
      title="Customer Management"
      subtitle={`${customers.length} customers`}
      columns={columns}
      rows={enriched}
      searchPlaceholder="Name, email, phone, ID, account #…"
      filterFn={(r, q) =>
        [r.fullName, r.email, r.mobile, r.nationalId, r.tin, r._accountNumbers, r._accountIds, r._accountTypes]
          .some((v) => String(v || "").toLowerCase().includes(q))
      }
      defaultSort={{ key: "id", dir: "desc" }}
      pageSize={10}
    />
  );
}
