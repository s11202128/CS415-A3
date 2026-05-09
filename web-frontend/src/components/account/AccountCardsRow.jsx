import { useEffect, useRef, useState } from "react";
import { Briefcase, Check, PiggyBank, Pencil, Star, Wallet, X } from "lucide-react";
import { useAccount } from "../../context/AccountContext";

function iconForType(type = "") {
  if (/savings/i.test(type)) return PiggyBank;
  if (/business|current/i.test(type)) return Briefcase;
  return Wallet;
}

function maskAccountNumber(num = "") {
  const s = String(num);
  if (s.length <= 4) return `•••• ${s}`;
  return `•••• •••• •••• ${s.slice(-4)}`;
}

function formatBalance(value, currency = "FJD") {
  const n = Number(value || 0);
  return `${currency} ${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusPill(status = "active") {
  const s = String(status).toLowerCase();
  const styles =
    s === "active"
      ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30"
      : s === "frozen"
      ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30"
      : s === "pending_approval"
      ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30"
      : s === "rejected"
      ? "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30"
      : "bg-slate-500/20 text-slate-200 ring-1 ring-slate-400/30";
  const label = s.replace("_", " ");
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles}`}
    >
      {label}
    </span>
  );
}

function AccountCard({ account, isActive, onSelect, onMakeDefault, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(account.nickname || "");
  const [saving, setSaving] = useState(false);
  const [busyDefault, setBusyDefault] = useState(false);
  const inputRef = useRef(null);
  const Icon = iconForType(account.accountType);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(account.nickname || "");
  }, [account.nickname, editing]);

  const commitRename = async () => {
    setSaving(true);
    try {
      await onRename(account.id, draft.trim());
      setEditing(false);
    } catch (err) {
      // Show error inline; keep input open
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const cancelRename = () => {
    setDraft(account.nickname || "");
    setEditing(false);
  };

  const handleMakeDefault = async (e) => {
    e.stopPropagation();
    if (account.isDefault || busyDefault) return;
    setBusyDefault(true);
    try {
      await onMakeDefault(account.id);
    } finally {
      setBusyDefault(false);
    }
  };

  const ringClasses = isActive
    ? "ring-2 ring-cyan-400 shadow-[0_0_0_4px_rgba(34,211,238,0.15)] bg-gradient-to-br from-navy-900 via-navy-800 to-cyan-900"
    : "ring-1 ring-white/10 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 hover:ring-white/25";

  const label = account.nickname || account.accountType;

  return (
    <button
      type="button"
      onClick={() => onSelect(account.id)}
      className={`relative flex min-w-[260px] max-w-[280px] shrink-0 flex-col gap-3 rounded-2xl p-4 text-left text-white transition-all duration-200 ${ringClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
            <Icon className="h-4 w-4 text-cyan-200" />
          </span>
          <div className="flex flex-col">
            {editing ? (
              <div className="flex items-center gap-1">
                <input
                  ref={inputRef}
                  value={draft}
                  maxLength={40}
                  onChange={(e) => setDraft(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") cancelRename();
                  }}
                  className="w-32 rounded-md bg-white/10 px-2 py-0.5 text-sm font-semibold text-white outline-none ring-1 ring-white/20 focus:ring-cyan-300"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    commitRename();
                  }}
                  disabled={saving}
                  className="rounded-md bg-cyan-400 p-1 text-navy-950 hover:bg-cyan-300 disabled:opacity-60"
                  aria-label="Save nickname"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelRename();
                  }}
                  className="rounded-md bg-white/10 p-1 text-white hover:bg-white/20"
                  aria-label="Cancel rename"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold leading-tight">{label}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                  }}
                  className="rounded p-0.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                  aria-label="Rename account"
                  title="Rename account"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <p className="text-[11px] uppercase tracking-wider text-cyan-200/70">
              {account.accountType}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleMakeDefault}
          disabled={account.isDefault || busyDefault}
          className={`rounded-full p-1.5 transition ${
            account.isDefault
              ? "bg-amber-400/20 text-amber-300 ring-1 ring-amber-300/40"
              : "text-white/40 hover:bg-white/10 hover:text-amber-200"
          } disabled:cursor-default`}
          aria-label={account.isDefault ? "Default account" : "Make default"}
          title={account.isDefault ? "Default account" : "Make default"}
        >
          <Star className={`h-4 w-4 ${account.isDefault ? "fill-amber-300" : ""}`} />
        </button>
      </div>

      <p className="font-mono text-xs tracking-widest text-cyan-100/80">
        {maskAccountNumber(account.accountNumber)}
      </p>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-cyan-200/70">Balance</p>
          <p className="text-lg font-bold leading-tight">
            {formatBalance(account.balance, account.currency)}
          </p>
        </div>
        {statusPill(account.status)}
      </div>
    </button>
  );
}

export default function AccountCardsRow({ className = "" }) {
  const {
    accounts,
    activeAccountId,
    setActiveAccountId,
    renameAccount,
    setDefaultAccount,
    loading,
  } = useAccount();

  if (loading && accounts.length === 0) {
    return (
      <div className={`flex gap-3 overflow-x-auto pb-2 ${className}`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[148px] min-w-[260px] shrink-0 animate-pulse rounded-2xl bg-white/5 ring-1 ring-white/10"
          />
        ))}
      </div>
    );
  }

  if (!accounts || accounts.length === 0) return null;

  return (
    <div
      className={`-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] ${className}`}
    >
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          isActive={account.id === activeAccountId}
          onSelect={setActiveAccountId}
          onMakeDefault={setDefaultAccount}
          onRename={renameAccount}
        />
      ))}
    </div>
  );
}
