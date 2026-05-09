import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PiggyBank, Wallet, Briefcase, Landmark, CreditCard } from "lucide-react";

const TYPE_ICONS = {
  "Savings": PiggyBank,
  "Simple Access": Wallet,
  "Cheque": Wallet,
  "Business": Briefcase,
  "Loan": Landmark,
  "Credit": CreditCard,
};

function iconFor(type) {
  const key = Object.keys(TYPE_ICONS).find((k) => k.toLowerCase() === String(type || "").toLowerCase());
  return TYPE_ICONS[key] || Wallet;
}

export default function AdminDepositsTab({
  accounts = [],
  adminDepositForm,
  setAdminDepositForm,
  onAdminDeposit,
  adminDepositMessage,
  setAdminDepositMessage,
}) {
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [submittedDeposit, setSubmittedDeposit] = useState(null);
  const [accountType, setAccountType] = useState("All");

  const eligibleAccounts = useMemo(
    () => (accounts || []).filter(
      (a) => !["frozen", "suspended", "closed", "rejected"].includes(String(a.status || "").toLowerCase()),
    ),
    [accounts],
  );

  // Distinct, sorted account types present in the dataset.
  const accountTypes = useMemo(() => {
    const set = new Set();
    eligibleAccounts.forEach((a) => a.type && set.add(String(a.type)));
    return ["All", ...Array.from(set).sort()];
  }, [eligibleAccounts]);

  const filteredAccounts = useMemo(() => {
    if (accountType === "All") return eligibleAccounts;
    return eligibleAccounts.filter((a) => String(a.type) === accountType);
  }, [eligibleAccounts, accountType]);

  // Reset selected account when the type filter changes and current selection is no longer in scope.
  useEffect(() => {
    if (!adminDepositForm?.accountId) return;
    const stillVisible = filteredAccounts.some((a) => String(a.id) === String(adminDepositForm.accountId));
    if (!stillVisible) setAdminDepositForm({ ...adminDepositForm, accountId: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountType, filteredAccounts]);

  useEffect(() => {
    if (adminDepositMessage && adminDepositMessage.includes("Deposit completed successfully")) {
      setDepositSuccess(true);
    }
  }, [adminDepositMessage]);

  const selectedAccount = eligibleAccounts.find(
    (a) => String(a.id) === String(adminDepositForm.accountId),
  );

  function handleSubmit(event) {
    setSubmittedDeposit({
      accountId: selectedAccount?.id || adminDepositForm.accountId,
      accountHolder: selectedAccount?.accountHolder || "Unknown Holder",
      accountNumber: selectedAccount?.accountNumber || "-",
      accountType: selectedAccount?.type || "-",
      amount: Number(adminDepositForm.amount || 0),
      description: adminDepositForm.description || "Admin deposit",
      submittedAt: new Date().toLocaleString(),
    });
    onAdminDeposit(event);
  }

  function handleAnotherDeposit() {
    setDepositSuccess(false);
    setSubmittedDeposit(null);
    if (setAdminDepositMessage) setAdminDepositMessage("");
  }

  /* Premium success card */
  if (depositSuccess) {
    const Icon = iconFor(submittedDeposit?.accountType);
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 via-white to-white px-6 py-5 border-b border-emerald-100 flex items-center gap-3">
          <div className="grid place-items-center h-11 w-11 rounded-xl bg-emerald-500 text-white shadow-glow">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-navy-900">Deposit Completed Successfully</h3>
            <p className="text-xs text-slate-500 mt-0.5">The customer account has been credited.</p>
          </div>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DetailRow label="Account Type" value={
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-cyan-600" />
              <span className="font-semibold text-navy-900">{submittedDeposit?.accountType || "-"}</span>
            </span>
          } />
          <DetailRow label="Account Holder" value={submittedDeposit?.accountHolder || "Unknown Holder"} />
          <DetailRow label="Account Number" mono value={submittedDeposit?.accountNumber || "-"} />
          <DetailRow label="Account ID" mono value={`#${submittedDeposit?.accountId}`} />
          <DetailRow label="Deposit Amount" value={
            <span className="font-display text-2xl font-extrabold text-emerald-700 tabular-nums">
              FJD {Number(submittedDeposit?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          } />
          <DetailRow label="Description" value={submittedDeposit?.description || "Admin deposit"} />
          <DetailRow label="Submitted" value={submittedDeposit?.submittedAt || "N/A"} />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button type="button" onClick={handleAnotherDeposit}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-4 py-2 text-sm font-bold text-white shadow-card hover:shadow-card-hover">
            Make Another Deposit
          </button>
        </div>
      </div>
    );
  }

  /* Form */
  const labelCls  = "block text-xs font-semibold text-slate-700";
  const inputCls  = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-display text-base font-bold text-navy-900">Deposit for Customer</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Choose an account type, then pick the specific account to credit.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
        {/* Account type chips */}
        <div>
          <p className={labelCls}>Account Type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {accountTypes.map((t) => {
              const Icon = t === "All" ? Wallet : iconFor(t);
              const active = accountType === t;
              const count = t === "All"
                ? eligibleAccounts.length
                : eligibleAccounts.filter((a) => String(a.type) === t).length;
              return (
                <button key={t} type="button" onClick={() => setAccountType(t)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-gradient-to-r from-navy-900 to-cyan-600 text-white border-transparent shadow-card"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}>
                  <Icon className="h-4 w-4" />
                  <span>{t}</span>
                  <span className={`ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Account selector */}
        <label className={labelCls}>
          Customer Account
          <select
            value={adminDepositForm.accountId}
            onChange={(e) => setAdminDepositForm({ ...adminDepositForm, accountId: e.target.value })}
            required
            className={`${inputCls} mt-1.5`}
          >
            <option value="">
              {filteredAccounts.length === 0
                ? `No ${accountType === "All" ? "" : accountType + " "}accounts available`
                : `Select account (${filteredAccounts.length} available)`}
            </option>
            {filteredAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.type}] #{a.id} · {a.accountHolder || "Unknown Holder"} · {a.accountNumber || "-"} · FJD {Number(a.balance || 0).toFixed(2)}
              </option>
            ))}
          </select>
        </label>

        {/* Selected account preview */}
        {selectedAccount && (() => {
          const Icon = iconFor(selectedAccount.type);
          return (
            <div className="rounded-xl border border-cyan-100 bg-cyan-50/40 px-4 py-3 flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-400 text-white shadow-glow">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Depositing into</p>
                <p className="text-sm font-bold text-navy-900 truncate">
                  {selectedAccount.accountHolder || "Unknown Holder"} · <span className="text-cyan-700">{selectedAccount.type}</span>
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Account #{selectedAccount.accountNumber || selectedAccount.id} · Current balance FJD {Number(selectedAccount.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={labelCls}>
            Deposit Amount (FJD)
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
              <input type="number" min="0.01" step="0.01" required
                value={adminDepositForm.amount}
                onChange={(e) => setAdminDepositForm({ ...adminDepositForm, amount: e.target.value })}
                className={`${inputCls} pl-7`} placeholder="0.00" />
            </div>
          </label>
          <label className={labelCls}>
            Description
            <input value={adminDepositForm.description}
              onChange={(e) => setAdminDepositForm({ ...adminDepositForm, description: e.target.value })}
              placeholder="Admin cash deposit" className={`${inputCls} mt-1.5`} />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {adminDepositMessage
            ? <p className="text-xs text-slate-600">{adminDepositMessage}</p>
            : <span />}
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-card hover:shadow-card-hover disabled:opacity-60"
            disabled={!adminDepositForm.accountId || !adminDepositForm.amount}>
            Deposit Now
          </button>
        </div>
      </form>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm text-navy-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
