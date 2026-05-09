import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  X,
  Snowflake,
  Sun,
  Download,
} from "lucide-react";
import { api } from "../../api";
import DataTable, { StatusPill, TableButton } from "../ui/DataTable";

const FJD = (n) =>
  `FJ$${Number(n || 0).toLocaleString("en-FJ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const maskCard = (n = "") => {
  const s = String(n);
  if (s.length <= 4) return s;
  return `•••• •••• •••• ${s.slice(-4)}`;
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";
const labelCls = "block text-xs font-semibold text-slate-700";
const primaryBtnCls =
  "inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-card hover:shadow-card-hover transition-all disabled:opacity-50";

export default function AdminCreditCardsTab({ customers = [] }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { tone: 'success'|'danger', text }
  const [createForm, setCreateForm] = useState({
    cardNumber: "",
    customerId: "",
    creditLimit: "",
    currentBalance: "0",
    statementDue: "",
  });
  const [editing, setEditing] = useState(null);
  const [txForm, setTxForm] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.listCreditCards();
      setCards(Array.isArray(data?.items) ? data.items : []);
    } catch (e) {
      setMessage({ tone: "danger", text: e.message || "Failed to load cards" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.createCreditCard({
        cardNumber: createForm.cardNumber.trim(),
        customerId: Number(createForm.customerId),
        creditLimit: Number(createForm.creditLimit),
        currentBalance: Number(createForm.currentBalance || 0),
        statementDue: createForm.statementDue || null,
      });
      setMessage({ tone: "success", text: "Card issued successfully." });
      setCreateForm({
        cardNumber: "",
        customerId: "",
        creditLimit: "",
        currentBalance: "0",
        statementDue: "",
      });
      refresh();
    } catch (err) {
      setMessage({ tone: "danger", text: err.message });
    }
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api.updateCreditCard(editing.cardNumber, {
        creditLimit: Number(editing.creditLimit),
        statementDue: editing.statementDue || null,
      });
      setMessage({ tone: "success", text: "Card updated." });
      setEditing(null);
      refresh();
    } catch (err) {
      setMessage({ tone: "danger", text: err.message });
    }
  };

  const onDelete = async (cardNumber) => {
    if (
      !window.confirm(
        `Close card ${maskCard(cardNumber)}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setMessage(null);
    try {
      await api.deleteCreditCard(cardNumber);
      setMessage({ tone: "success", text: "Card closed." });
      refresh();
    } catch (err) {
      setMessage({ tone: "danger", text: err.message });
    }
  };

  const onToggleFreeze = async (card) => {
    setMessage(null);
    try {
      if (card.frozen) {
        await api.unfreezeCreditCard(card.cardNumber);
        setMessage({ tone: "success", text: `Card ${maskCard(card.cardNumber)} unfrozen.` });
      } else {
        if (
          !window.confirm(
            `Freeze card ${maskCard(card.cardNumber)}? Charges and payments will be blocked until unfrozen.`,
          )
        ) {
          return;
        }
        await api.freezeCreditCard(card.cardNumber);
        setMessage({ tone: "success", text: `Card ${maskCard(card.cardNumber)} frozen.` });
      }
      refresh();
    } catch (err) {
      setMessage({ tone: "danger", text: err.message });
    }
  };

  const onDownloadStatement = (card) => {
    const lines = [
      "BANK OF FIJI \u2014 CREDIT CARD STATEMENT",
      "=".repeat(48),
      `Generated:        ${new Date().toLocaleString()}`,
      "",
      "CARDHOLDER",
      "-".repeat(48),
      `Customer:         ${card.customerName || "\u2014"}`,
      `Customer ID:      ${card.customerId}`,
      "",
      "CARD",
      "-".repeat(48),
      `Card Number:      ${maskCard(card.cardNumber)}`,
      `Status:           ${card.frozen ? "FROZEN" : "ACTIVE"}`,
      `Statement Due:    ${card.statementDue ? new Date(card.statementDue).toLocaleDateString() : "\u2014"}`,
      "",
      "BALANCE SUMMARY",
      "-".repeat(48),
      `Credit Limit:     ${FJD(card.creditLimit)}`,
      `Current Balance:  ${FJD(card.currentBalance)}`,
      `Available Credit: ${FJD(card.availableCredit)}`,
      `Utilisation:      ${
        card.creditLimit > 0
          ? `${((Number(card.currentBalance || 0) / Number(card.creditLimit)) * 100).toFixed(1)}%`
          : "\u2014"
      }`,
      "",
      "=".repeat(48),
      "This statement is generated by Bank of Fiji admin console.",
      "For account enquiries, contact support@bof.fj.",
      "",
    ];
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safe = String(card.cardNumber).replace(/\D/g, "").slice(-4) || "card";
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `statement-${safe}-${stamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onTx = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const fn =
        txForm.kind === "charge" ? api.chargeCreditCard : api.payCreditCard;
      await fn(txForm.cardNumber, Number(txForm.amount));
      setMessage({
        tone: "success",
        text: `${txForm.kind === "charge" ? "Charge" : "Payment"} posted successfully.`,
      });
      setTxForm(null);
      refresh();
    } catch (err) {
      setMessage({ tone: "danger", text: err.message });
    }
  };

  const totals = useMemo(() => {
    const limit = cards.reduce((s, c) => s + Number(c.creditLimit || 0), 0);
    const balance = cards.reduce((s, c) => s + Number(c.currentBalance || 0), 0);
    return { count: cards.length, limit, balance, available: limit - balance };
  }, [cards]);

  const columns = useMemo(
    () => [
      {
        key: "cardNumber",
        header: "Card",
        cell: (r) => (
          <span className="font-mono text-xs text-navy-900">
            {maskCard(r.cardNumber)}
          </span>
        ),
      },
      {
        key: "customerName",
        header: "Customer",
        accessor: (r) => r.customerName || "",
        cell: (r) => (
          <div className="flex flex-col">
            <span className="font-semibold text-navy-900">
              {r.customerName || `Customer #${r.customerId}`}
            </span>
            <span className="text-[11px] text-slate-500">ID {r.customerId}</span>
          </div>
        ),
      },
      {
        key: "frozen",
        header: "Status",
        accessor: (r) => (r.frozen ? 1 : 0),
        cell: (r) =>
          r.frozen ? (
            <StatusPill tone="info">Frozen</StatusPill>
          ) : (
            <StatusPill tone="success">Active</StatusPill>
          ),
      },
      {
        key: "creditLimit",
        header: "Limit",
        align: "right",
        accessor: (r) => Number(r.creditLimit || 0),
        cell: (r) => (
          <span className="tabular-nums font-semibold text-navy-900">
            {FJD(r.creditLimit)}
          </span>
        ),
      },
      {
        key: "currentBalance",
        header: "Balance",
        align: "right",
        accessor: (r) => Number(r.currentBalance || 0),
        cell: (r) => (
          <span className="tabular-nums">{FJD(r.currentBalance)}</span>
        ),
      },
      {
        key: "availableCredit",
        header: "Available",
        align: "right",
        accessor: (r) => Number(r.availableCredit || 0),
        cell: (r) => {
          const avail = Number(r.availableCredit || 0);
          const limit = Number(r.creditLimit || 0);
          const tone =
            avail <= 0
              ? "danger"
              : limit > 0 && avail < limit * 0.2
              ? "warning"
              : "success";
          return <StatusPill tone={tone}>{FJD(avail)}</StatusPill>;
        },
      },
      {
        key: "statementDue",
        header: "Statement Due",
        accessor: (r) => (r.statementDue ? new Date(r.statementDue).getTime() : 0),
        cell: (r) =>
          r.statementDue ? (
            <span className="text-xs">
              {new Date(r.statementDue).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        key: "actions",
        header: "Actions",
        sortable: false,
        sticky: true,
        align: "right",
        cell: (r) => (
          <div className="inline-flex gap-1.5 justify-end flex-wrap">
            <TableButton
              onClick={() =>
                setTxForm({
                  cardNumber: r.cardNumber,
                  kind: "charge",
                  amount: "",
                })
              }
              disabled={r.frozen}
            >
              <ArrowUpRight className="h-3 w-3" /> Charge
            </TableButton>
            <TableButton
              tone="success"
              onClick={() =>
                setTxForm({
                  cardNumber: r.cardNumber,
                  kind: "payment",
                  amount: "",
                })
              }
              disabled={r.frozen}
            >
              <ArrowDownLeft className="h-3 w-3" /> Pay
            </TableButton>
            <TableButton
              tone={r.frozen ? "warning" : "info"}
              onClick={() => onToggleFreeze(r)}
            >
              {r.frozen ? (
                <>
                  <Sun className="h-3 w-3" /> Unfreeze
                </>
              ) : (
                <>
                  <Snowflake className="h-3 w-3" /> Freeze
                </>
              )}
            </TableButton>
            <TableButton onClick={() => onDownloadStatement(r)}>
              <Download className="h-3 w-3" /> Statement
            </TableButton>
            <TableButton
              onClick={() =>
                setEditing({
                  cardNumber: r.cardNumber,
                  creditLimit: r.creditLimit,
                  statementDue: r.statementDue
                    ? String(new Date(r.statementDue).toISOString()).slice(0, 10)
                    : "",
                })
              }
            >
              <Pencil className="h-3 w-3" /> Edit
            </TableButton>
            <TableButton
              tone="danger"
              onClick={() => onDelete(r.cardNumber)}
            >
              <Trash2 className="h-3 w-3" /> Close
            </TableButton>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Active cards" value={totals.count} />
        <KpiCard label="Total limit" value={FJD(totals.limit)} />
        <KpiCard label="Outstanding" value={FJD(totals.balance)} />
        <KpiCard label="Available credit" value={FJD(totals.available)} tone="success" />
      </div>

      {/* Issue new card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-cyan-600" />
          <div>
            <h3 className="font-display text-base font-bold text-navy-900">
              Issue a new credit card
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Bind a card number to an existing customer with a credit limit.
            </p>
          </div>
        </div>
        <form
          onSubmit={onCreate}
          className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <label className={labelCls}>
            Card Number
            <input
              className={`${inputCls} mt-1.5 font-mono`}
              placeholder="e.g. 4242 4242 4242 4242"
              value={createForm.cardNumber}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, cardNumber: e.target.value }))
              }
              required
            />
          </label>
          <label className={labelCls}>
            Customer
            <select
              className={`${inputCls} mt-1.5`}
              value={createForm.customerId}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, customerId: e.target.value }))
              }
              required
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.fullName || c.email || `#${c.id}`)} (#{c.id})
                </option>
              ))}
            </select>
          </label>
          <label className={labelCls}>
            Credit Limit (FJD)
            <input
              type="number"
              min="0"
              step="0.01"
              className={`${inputCls} mt-1.5`}
              value={createForm.creditLimit}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, creditLimit: e.target.value }))
              }
              required
            />
          </label>
          <label className={labelCls}>
            Opening Balance
            <input
              type="number"
              min="0"
              step="0.01"
              className={`${inputCls} mt-1.5`}
              value={createForm.currentBalance}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, currentBalance: e.target.value }))
              }
            />
          </label>
          <label className={labelCls}>
            Statement Due
            <input
              type="date"
              className={`${inputCls} mt-1.5`}
              value={createForm.statementDue}
              onChange={(e) =>
                setCreateForm((f) => ({ ...f, statementDue: e.target.value }))
              }
            />
          </label>
          <div className="md:col-span-2 lg:col-span-5 flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {message ? (
              <p
                className={`text-xs ${
                  message.tone === "danger"
                    ? "text-rose-600"
                    : "text-emerald-600"
                }`}
              >
                {message.text}
              </p>
            ) : (
              <span />
            )}
            <button type="submit" className={primaryBtnCls}>
              <Plus className="h-4 w-4" /> Issue Card
            </button>
          </div>
        </form>
      </div>

      <DataTable
        title="All credit cards"
        subtitle={`${cards.length} card${cards.length === 1 ? "" : "s"} on file`}
        columns={columns}
        rows={cards}
        rowKey={(r) => r.cardNumber}
        searchKeys={["cardNumber", "customerName", "customerId"]}
        searchPlaceholder="Search by card #, customer name or ID…"
        defaultSort={{ key: "cardNumber", dir: "asc" }}
        toolbar={
          <TableButton onClick={refresh} disabled={loading}>
            <RefreshCw
              className={`h-3 w-3 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </TableButton>
        }
      />

      {/* Edit modal */}
      {editing && (
        <Modal
          title={`Edit card ${maskCard(editing.cardNumber)}`}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={onSaveEdit} className="space-y-3">
            <label className={labelCls}>
              Credit Limit (FJD)
              <input
                type="number"
                min="0"
                step="0.01"
                className={`${inputCls} mt-1.5`}
                value={editing.creditLimit}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, creditLimit: e.target.value }))
                }
                required
              />
            </label>
            <label className={labelCls}>
              Statement Due
              <input
                type="date"
                className={`${inputCls} mt-1.5`}
                value={editing.statementDue}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, statementDue: e.target.value }))
                }
              />
            </label>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <TableButton onClick={() => setEditing(null)}>Cancel</TableButton>
              <button type="submit" className={primaryBtnCls}>
                Save changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Charge / Payment modal */}
      {txForm && (
        <Modal
          title={`${
            txForm.kind === "charge" ? "Post Charge" : "Post Payment"
          } · ${maskCard(txForm.cardNumber)}`}
          onClose={() => setTxForm(null)}
        >
          <form onSubmit={onTx} className="space-y-3">
            <label className={labelCls}>
              Amount (FJD)
              <input
                type="number"
                min="0.01"
                step="0.01"
                className={`${inputCls} mt-1.5`}
                value={txForm.amount}
                onChange={(e) =>
                  setTxForm((s) => ({ ...s, amount: e.target.value }))
                }
                required
              />
            </label>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <TableButton onClick={() => setTxForm(null)}>Cancel</TableButton>
              <button type="submit" className={primaryBtnCls}>
                Post {txForm.kind}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function KpiCard({ label, value, tone = "default" }) {
  const accent =
    tone === "success" ? "text-emerald-600" : "text-navy-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-[11px] uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className={`mt-1 font-display text-xl font-bold ${accent}`}>
        {value}
      </p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display text-base font-bold text-navy-900">
            {title}
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
