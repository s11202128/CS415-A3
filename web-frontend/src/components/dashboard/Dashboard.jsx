import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft,
  ArrowLeftRight, Receipt, Smartphone, ScanLine, HandCoins, Users,
  Sparkles, ShieldCheck, Bell, Calendar, RefreshCw,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import AccountCardsRow from "../account/AccountCardsRow";

const FJD = (n) => `FJ$${Number(n || 0).toLocaleString("en-FJ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const mask = (s, hidden) => (hidden ? "•••• ••••" : s);

const ACCOUNT_GRADIENTS = {
  Savings: "bg-card-savings",
  "Simple Access": "bg-card-everyday",
  Business: "bg-card-business",
  Credit: "bg-card-credit",
};

function gradientFor(type) {
  if (!type) return "bg-card-everyday";
  if (/credit/i.test(type)) return ACCOUNT_GRADIENTS.Credit;
  if (/savings/i.test(type)) return ACCOUNT_GRADIENTS.Savings;
  if (/business/i.test(type)) return ACCOUNT_GRADIENTS.Business;
  return ACCOUNT_GRADIENTS["Simple Access"];
}

const QUICK_ACTIONS = [
  { id: "transfer",  label: "Transfer",     icon: ArrowLeftRight, tab: "Transfers" },
  { id: "bills",     label: "Pay Bills",    icon: Receipt,        tab: "Bill Payments" },
  { id: "topup",     label: "Top Up",       icon: Smartphone,     tab: "Transfers" },
  { id: "scan",      label: "Scan & Pay",   icon: ScanLine,       tab: "Transfers" },
  { id: "request",   label: "Request",      icon: HandCoins,      tab: "Transfers" },
  { id: "payees",    label: "Beneficiaries",icon: Users,          tab: "Transfers" },
];

const SPEND_COLORS = ["#0891b2", "#1e3a8a", "#22d3ee", "#14b8a6", "#a855f7", "#f59e0b"];

export default function Dashboard({
  currentUser,
  accounts = [],
  transactions = [],
  lastUpdatedAt,
  isRefreshing,
  onRefresh,
  onSelectTab,
  onSelectBusinessSub,
}) {
  const [hideBalance, setHideBalance] = useState(false);

  const totalBalance = useMemo(
    () => accounts.reduce((s, a) => s + Number(a.balance || 0), 0),
    [accounts]
  );

  // Derive simple monthly in/out from transactions if available
  const { income, expense, byCategory, monthly } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let inc = 0, exp = 0;
    const cats = {};
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 5 + i, 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-FJ", { month: "short" }), in: 0, out: 0 };
    });
    transactions.forEach((t) => {
      const amt = Number(t.amount || 0);
      const d = t.createdAt ? new Date(t.createdAt) : null;
      const key = d ? `${d.getFullYear()}-${d.getMonth()}` : null;
      const bucket = months.find((m) => m.key === key);
      const isCredit = /deposit|credit|in/i.test(t.type || "") || amt > 0;
      if (d && d.getMonth() === month && d.getFullYear() === year) {
        if (isCredit) inc += Math.abs(amt); else exp += Math.abs(amt);
      }
      if (bucket) {
        if (isCredit) bucket.in += Math.abs(amt); else bucket.out += Math.abs(amt);
      }
      const cat = (t.category || t.type || "Other").toString();
      cats[cat] = (cats[cat] || 0) + Math.abs(amt);
    });
    const byCategory = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
    return { income: inc, expense: exp, byCategory, monthly: months };
  }, [transactions]);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 6),
    [transactions]
  );

  const firstName = (currentUser?.fullName || "Customer").split(" ")[0];

  return (
    <div className="space-y-6">
      {/* ===== My Accounts switcher ===== */}
      <AccountCardsRow />

      {/* ===== Hero / Balance Summary ===== */}
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-brand-gradient text-white shadow-card-hover"
      >
        <div className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-teal-300/15 blur-3xl" />
        <div className="relative px-6 lg:px-8 py-7 grid lg:grid-cols-[1.4fr,1fr] gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-200/90">Total balance · FJD</p>
            <div className="mt-2 flex items-end gap-3">
              <h1 className="text-4xl lg:text-5xl font-display font-bold tracking-tight !text-white">
                {hideBalance ? "•••••••" : FJD(totalBalance)}
              </h1>
              <button
                type="button"
                onClick={() => setHideBalance((v) => !v)}
                className="mb-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={hideBalance ? "Show balance" : "Hide balance"}
              >
                {hideBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-cyan-100/80">
              Welcome back, {firstName}. Here's your money at a glance.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 max-w-md">
              <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <TrendingUp className="h-4 w-4" /> Income (this month)
                </div>
                <p className="mt-1 text-xl font-bold">{hideBalance ? "•••" : FJD(income)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 backdrop-blur p-4">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                  <TrendingDown className="h-4 w-4" /> Spending (this month)
                </div>
                <p className="mt-1 text-xl font-bold">{hideBalance ? "•••" : FJD(expense)}</p>
              </div>
            </div>
          </div>

          <div className="flex lg:justify-end">
            <div className="self-start lg:self-end flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur px-4 py-3">
              <Calendar className="h-4 w-4 text-cyan-200" />
              <div className="text-xs">
                <p className="text-cyan-100/80">Last updated</p>
                <p className="font-semibold">
                  {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("en-FJ", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 text-navy-950 px-3 py-1.5 text-xs font-bold hover:bg-cyan-300 disabled:opacity-60"
              >
                <RefreshCw className={["h-3.5 w-3.5", isRefreshing && "animate-spin"].join(" ")} />
                {isRefreshing ? "Updating…" : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== Account Cards ===== */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-navy-900">My Accounts</h2>
          <button onClick={() => onSelectTab?.("Accounts")} className="text-sm font-bold text-navy-900 underline decoration-cyan-500 decoration-2 underline-offset-4 hover:decoration-cyan-700">View all →</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {(accounts.length ? accounts.slice(0, 3) : []).map((acc, i) => (
            <motion.article
              key={acc.id || i}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className={["relative overflow-hidden rounded-2xl text-white shadow-card-hover p-5", gradientFor(acc.accountType)].join(" ")}
            >
              <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/70">{acc.accountType || "Account"}</p>
                  <p className="mt-0.5 text-sm font-semibold">{currentUser?.fullName || "Customer"}</p>
                </div>
                <span className={["bof-pill", acc.status === "ACTIVE" || !acc.status ? "bof-pill-success" : "bof-pill-warn"].join(" ")}>
                  {acc.status || "ACTIVE"}
                </span>
              </div>
              <p className="relative mt-6 font-mono tracking-widest text-sm text-white/85">
                {mask((acc.accountNumber || "•••• •••• ••••").replace(/(.{4})/g, "$1 ").trim(), hideBalance)}
              </p>
              <div className="relative mt-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/70">Available</p>
                  <p className="text-2xl font-bold">{hideBalance ? "•••••" : FJD(acc.balance)}</p>
                </div>
                <button
                  onClick={() => onSelectTab?.("Accounts")}
                  className="text-xs font-semibold rounded-full bg-white/15 hover:bg-white/25 px-3 py-1.5 transition-colors"
                >
                  Manage
                </button>
              </div>
            </motion.article>
          ))}

          {/* Credit card teaser */}
          <motion.article
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl text-white shadow-card-hover p-5 bg-card-credit"
          >
            <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/70">Credit Card</p>
                <p className="mt-0.5 text-sm font-semibold">Bank of Fiji Visa</p>
              </div>
              <span className="bof-pill bof-pill-info">PREMIUM</span>
            </div>
            <p className="relative mt-6 font-mono tracking-widest text-sm text-white/85">
              {mask("4521 8932 •••• 7783", hideBalance)}
            </p>
            <div className="relative mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/70">Available credit</p>
                <p className="text-2xl font-bold">{hideBalance ? "•••••" : FJD(0)}</p>
              </div>
              <button
                onClick={() => { onSelectTab?.("Business"); onSelectBusinessSub?.("cards"); }}
                className="text-xs font-semibold rounded-full bg-cyan-400 text-navy-950 hover:bg-cyan-300 px-3 py-1.5 transition-colors"
              >
                Manage card
              </button>
            </div>
          </motion.article>
        </div>
      </section>

      {/* ===== Quick Actions ===== */}
      <section className="bof-card">
        <h2 className="text-lg font-bold text-navy-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.id}
              type="button"
              onClick={() => qa.tab && onSelectTab?.(qa.tab)}
              className="group flex flex-col items-center gap-2 rounded-2xl p-3 hover:bg-slate-50 transition-colors"
            >
              <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-50 to-navy-50 text-navy-900 group-hover:from-cyan-500 group-hover:to-teal-400 group-hover:text-white transition-all shadow-sm">
                <qa.icon className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-semibold text-navy-900 text-center">{qa.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ===== Charts row ===== */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="bof-card lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-navy-900">Income vs. Expenses</h3>
            <span className="text-xs text-slate-600">Last 6 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
                  formatter={(v) => FJD(v)}
                />
                <Bar dataKey="in" name="Income" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                <Bar dataKey="out" name="Spending" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bof-card">
          <h3 className="font-bold text-navy-900 mb-2">Spending Summary</h3>
          {byCategory.length === 0 ? (
            <div className="h-64 grid place-items-center text-sm text-slate-600">No transactions yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={SPEND_COLORS[i % SPEND_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => FJD(v)} contentStyle={{ borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* ===== Recent transactions + Side widgets ===== */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="bof-card lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-navy-900">Recent Transactions</h3>
            <button onClick={() => onSelectTab?.("Statements")} className="text-sm font-bold text-navy-900 underline decoration-cyan-500 decoration-2 underline-offset-4 hover:decoration-cyan-700">View statements →</button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-600 py-6 text-center">No recent transactions to show.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-slate-700">
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent.map((t, i) => {
                    const amt = Number(t.amount || 0);
                    const isCredit = /deposit|credit|in/i.test(t.type || "") || amt > 0;
                    return (
                      <tr key={t.id || i} className="hover:bg-slate-50/60">
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={[
                              "grid place-items-center h-8 w-8 rounded-xl",
                              isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
                            ].join(" ")}>
                              {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-navy-900 truncate">{t.description || t.payee || "Transaction"}</p>
                              <p className="text-xs text-slate-600 truncate">{t.merchant || t.accountNumber || "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-slate-600">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-FJ") : "—"}
                        </td>
                        <td className="px-2 py-3 text-slate-600">{t.type || "—"}</td>
                        <td className={["px-2 py-3 text-right font-semibold", isCredit ? "text-emerald-600" : "text-rose-600"].join(" ")}>
                          {isCredit ? "+" : "−"} {FJD(Math.abs(amt))}
                        </td>
                        <td className="px-2 py-3">
                          <span className="bof-pill bof-pill-success">{t.status || "Completed"}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* AI insights */}
          <div className="bof-card bg-gradient-to-br from-navy-900 to-cyan-700 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <h3 className="font-bold">AI Financial Insight</h3>
            </div>
            <p className="text-sm text-cyan-50/90">
              {expense > income && income > 0
                ? `You've spent ${FJD(expense - income)} more than you earned this month. Consider reviewing your top categories.`
                : "Your spending is within your typical range this month — nice work staying on budget."}
            </p>
          </div>

          {/* Security */}
          <div className="bof-card">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-navy-900">Account Security</h3>
            </div>
            <ul className="text-sm space-y-1.5 text-slate-700">
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> 2-factor authentication enabled</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Fraud monitoring active</li>
              <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Last login from this device</li>
            </ul>
          </div>

          {/* Exchange rates (sample) */}
          <div className="bof-card">
            <h3 className="font-bold text-navy-900 mb-2">Exchange Rates · 1 FJD</h3>
            <div className="text-sm divide-y divide-slate-100">
              {[
                { c: "USD", r: "0.4452" },
                { c: "AUD", r: "0.6731" },
                { c: "NZD", r: "0.7402" },
                { c: "EUR", r: "0.4108" },
              ].map((x) => (
                <div key={x.c} className="flex items-center justify-between py-1.5">
                  <span className="font-semibold text-navy-900">{x.c}</span>
                  <span className="font-mono text-slate-700">{x.r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bof-card">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-navy-900">Alerts & Reminders</h3>
            </div>
            <ul className="text-sm space-y-2 text-slate-700">
              <li>📅 Electricity bill due in 3 days</li>
              <li>💳 Credit card statement available</li>
              <li>🔔 New eStatement ready to download</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
