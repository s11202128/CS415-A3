import { useMemo } from "react";
import DataTable, { StatusPill, TableButton } from "../ui/DataTable";

function formatLoanDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export default function AdminLoansTab({ loanApplications = [], onAdminUpdateLoanStatus }) {
  const rows = useMemo(
    () => loanApplications.map((l, i) => ({ ...l, _seq: i + 1 })),
    [loanApplications],
  );

  const columns = [
    { key: "_seq", header: "#", width: "60px", align: "right" },
    { key: "customerId", header: "Customer",
      cell: (r) => <span className="font-mono text-xs text-navy-900">{r.customerId}</span> },
    { key: "requestedAmount", header: "Amount", align: "right",
      accessor: (r) => Number(r.requestedAmount || 0),
      cell: (r) => <span className="font-bold tabular-nums text-navy-900">FJD {Number(r.requestedAmount || 0).toFixed(2)}</span> },
    { key: "status", header: "Status",
      cell: (r) => {
        const s = String(r.status || "").toLowerCase();
        const tone = s === "approved" ? "success" : s === "rejected" ? "danger" : ["submitted","pending"].includes(s) ? "warning" : "slate";
        return <StatusPill tone={tone}>{r.status || "—"}</StatusPill>;
      } },
    { key: "submittedAt", header: "Sent At",
      accessor: (r) => r.submittedAt || r.createdAt,
      cell: (r) => formatLoanDate(r.submittedAt || r.createdAt) || <span className="text-slate-300">—</span> },
    { key: "reviewedAt", header: "Decision At",
      accessor: (r) => r.reviewedAt,
      cell: (r) => formatLoanDate(r.reviewedAt) || <span className="text-slate-300">—</span> },
    { key: "actions", header: "Actions", sortable: false, align: "right",
      cell: (r) => {
        const s = String(r.status || "").toLowerCase();
        if (["submitted","pending"].includes(s)) {
          return (
            <div className="inline-flex gap-1.5 justify-end">
              <TableButton tone="success" onClick={() => onAdminUpdateLoanStatus(r.id, "approved")}>Approve</TableButton>
              <TableButton tone="danger"  onClick={() => onAdminUpdateLoanStatus(r.id, "rejected")}>Reject</TableButton>
            </div>
          );
        }
        return <span className="text-xs text-slate-400">Finalized</span>;
      } },
  ];

  return (
    <DataTable
      title="Loan Application Management"
      subtitle={`${loanApplications.length} applications on file`}
      columns={columns}
      rows={rows}
      searchPlaceholder="Search by customer or status…"
      defaultSort={{ key: "submittedAt", dir: "desc" }}
    />
  );
}
