import { useMemo } from "react";
import {
  Users, Wallet, PiggyBank, Landmark, Activity, Snowflake,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Clock, Sparkles, RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

/* ────────────────────────────────────────────────────────────────────────────
 * Premium Admin Overview
 *  - KPI cards with gradient icons + delta indicators
 *  - Area chart: 14-day transaction activity (deposits vs withdrawals)
 *  - Donut: Account type distribution
 *  - Horizontal bar: Top 5 accounts by balance
 *  - Restyled recent transactions + account snapshot tables
 * ──────────────────────────────────────────────────────────────────────────── */

const FJ = (n) =>
  `FJD ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PIE_COLORS = ["#0e7490", "#0891b2", "#22d3ee", "#67e8f9", "#a5f3fc", "#155e75"];

function KpiCard({ icon: Icon, label, value, delta, deltaLabel, accent = "navy", caption }) {
  const accents = {
    navy:  "from-navy-900 to-navy-700",
    cyan:  "from-cyan-600 to-cyan-400",
    teal:  "from-teal-600 to-teal-400",
    rose:  "from-rose-600 to-rose-400",
    amber: "from-amber-600 to-amber-400",
    royal: "from-royal-600 to-royal-400",
  };
  const trendUp = typeof delta === "number" ? delta >= 0 : null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card hover:shadow-card-hover transition-all">
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-[0.08] blur-2xl"
           style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-navy-900 tabular-nums leading-tight truncate">{value}</p>
          {caption && <p className="mt-1 text-xs text-slate-500">{caption}</p>}
        </div>
        <div className={`grid place-items-center h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${accents[accent]} text-white shadow-glow`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {typeof delta === "number" && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
            trendUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}>
            {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendUp ? "+" : ""}{delta}%
          </span>
          {deltaLabel && <span className="text-[11px] text-slate-500">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-card overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-display text-base font-bold text-navy-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-card text-xs">
      {label && <p className="font-semibold text-navy-900 mb-1">{label}</p>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-slate-600">{p.name}:</span>
          <span className="font-bold text-navy-900 tabular-nums">
            {valueFormatter ? valueFormatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminOverviewTab({
  customers = [],
  accounts = [],
  transactions = [],
  loanApplications = [],
  adminReport,
  adminLastUpdated,
  adminMessage,
}) {
  const customerMap = useMemo(
    () => customers.reduce((m, c) => ((m[c.id] = c), m), {}),
    [customers],
  );

  const metrics = adminReport?.metrics || {
    totalCustomers: customers.length,
    totalAccounts: accounts.length,
    totalDeposits: accounts.reduce((s, a) => s + Number(a.balance || 0), 0),
    pendingLoans: loanApplications.filter((l) => /pending|review/i.test(l.status || "")).length,
    frozenAccounts: accounts.filter((a) => /freeze|suspend|frozen/i.test(a.status || "")).length,
    todaysTransactions: 0,
  };

  /* ── 14-day activity series ── */
  const activitySeries = useMemo(() => {
    const days = 14;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      return {
        key: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        deposits: 0,
        withdrawals: 0,
        count: 0,
      };
    });
    const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
    const src =
      (transactions && transactions.length ? transactions : adminReport?.recentTransactions) || [];
    src.forEach((t) => {
      const d = new Date(t.createdAt || t.created_at || t.date || Date.now());
      const k = d.toISOString().slice(0, 10);
      if (k in idx) {
        const amt = Math.abs(Number(t.amount || 0));
        const kind = String(t.kind || t.type || "").toLowerCase();
        if (/(deposit|credit|in|received)/.test(kind)) buckets[idx[k]].deposits += amt;
        else if (/(withdraw|debit|out|fee|payment|transfer)/.test(kind)) buckets[idx[k]].withdrawals += amt;
        else buckets[idx[k]].deposits += amt;
        buckets[idx[k]].count += 1;
      }
    });
    return buckets;
  }, [transactions, adminReport]);

  const totals14 = useMemo(() => {
    const dep = activitySeries.reduce((s, b) => s + b.deposits, 0);
    const wd = activitySeries.reduce((s, b) => s + b.withdrawals, 0);
    const cnt = activitySeries.reduce((s, b) => s + b.count, 0);
    return { dep, wd, cnt, net: dep - wd };
  }, [activitySeries]);

  /* ── account-type donut ── */
  const accountTypeData = useMemo(() => {
    const groups = {};
    accounts.forEach((a) => {
      const key = (a.type || "Other").toString();
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [accounts]);

  /* ── top accounts by balance ── */
  const topAccounts = useMemo(() => {
    return [...accounts]
      .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
      .slice(0, 5)
      .map((a) => ({
        name: customerMap[a.customerId]?.fullName?.split(" ")[0] || `#${a.id}`,
        balance: Number(a.balance || 0),
        type: a.type,
        id: a.id,
      }));
  }, [accounts, customerMap]);

  const recentTx = (adminReport?.recentTransactions || transactions || []).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {(adminMessage || adminLastUpdated) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-100 bg-gradient-to-r from-cyan-50 via-white to-white px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-navy-900">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            <span className="font-semibold">{adminMessage || "Operations console live"}</span>
          </div>
          {adminLastUpdated && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Last updated {new Date(adminLastUpdated).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard icon={Users}      label="Customers"      value={metrics.totalCustomers}              accent="navy"  caption="All registered users" />
        <KpiCard icon={Wallet}     label="Accounts"       value={metrics.totalAccounts}               accent="cyan"  caption="Across all products" />
        <KpiCard icon={PiggyBank}  label="Total Deposits" value={FJ(metrics.totalDeposits)}           accent="teal"  caption="Aggregate balance held" />
        <KpiCard icon={Activity}   label="Today's Tx"     value={metrics.todaysTransactions}          accent="royal" caption="Transactions in 24h" />
        <KpiCard icon={Landmark}   label="Pending Loans"  value={metrics.pendingLoans}                accent="amber" caption="Awaiting decision" />
        <KpiCard icon={Snowflake}  label="Frozen / Suspended" value={metrics.frozenAccounts}          accent="rose"  caption="Action may be required" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity area */}
        <SectionCard
          className="xl:col-span-2"
          title="Transaction Activity"
          subtitle="Last 14 days · deposits vs withdrawals"
          action={
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-cyan-500" /> Deposits
                <strong className="text-navy-900 tabular-nums ml-1">{FJ(totals14.dep)}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Withdrawals
                <strong className="text-navy-900 tabular-nums ml-1">{FJ(totals14.wd)}</strong>
              </span>
            </div>
          }
        >
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <AreaChart data={activitySeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false}
                       tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<ChartTooltip valueFormatter={FJ} />} />
                <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#06b6d4" strokeWidth={2.5} fill="url(#depGrad)" />
                <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#f43f5e" strokeWidth={2.5} fill="url(#wdGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="text-slate-500">{totals14.cnt} transactions in window</span>
            <span className={`inline-flex items-center gap-1 font-bold ${totals14.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {totals14.net >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              Net flow {FJ(totals14.net)}
            </span>
          </div>
        </SectionCard>

        {/* Account type donut */}
        <SectionCard title="Account Mix" subtitle="Distribution by product type">
          {accountTypeData.length === 0 ? (
            <div className="h-72 grid place-items-center text-sm text-slate-400">No accounts yet</div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={accountTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                       innerRadius={55} outerRadius={90} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                    {accountTypeData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="bottom" height={32}
                          iconType="circle"
                          formatter={(v) => <span className="text-xs text-slate-700">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Top accounts bar + recent transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard
          title="Top Accounts"
          subtitle="Highest balances · top 5"
          className="xl:col-span-1"
        >
          {topAccounts.length === 0 ? (
            <div className="h-64 grid place-items-center text-sm text-slate-400">No data</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <BarChart data={topAccounts} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false}
                         tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#0f172a", fontWeight: 600 }}
                         axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<ChartTooltip valueFormatter={FJ} />} />
                  <Bar dataKey="balance" name="Balance" radius={[0, 8, 8, 0]} fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Recent Transactions"
          subtitle={`${recentTx.length} most recent activities`}
          className="xl:col-span-2"
          action={
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-semibold text-cyan-700">
              <RefreshCw className="h-3 w-3" /> Live
            </span>
          }
        >
          <div className="overflow-x-auto -mx-5">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-2 font-semibold">Time</th>
                  <th className="px-5 py-2 font-semibold">Account</th>
                  <th className="px-5 py-2 font-semibold">Type</th>
                  <th className="px-5 py-2 font-semibold text-right">Amount</th>
                  <th className="px-5 py-2 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No recent transactions</td></tr>
                ) : recentTx.map((t) => {
                  const kind = String(t.kind || t.type || "").toLowerCase();
                  const isCredit = /(deposit|credit|in|received)/.test(kind);
                  return (
                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-2.5 text-slate-600 whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-2.5 font-mono text-xs text-navy-900">{t.accountId}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          isCredit ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          {isCredit ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {t.kind || t.type || "tx"}
                        </span>
                      </td>
                      <td className={`px-5 py-2.5 text-right font-bold tabular-nums ${isCredit ? "text-emerald-700" : "text-rose-700"}`}>
                        {isCredit ? "+" : "−"} {FJ(t.amount)}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600 truncate max-w-xs">{t.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Account snapshot */}
      <SectionCard
        title="Account Snapshot"
        subtitle={`${accounts.length} accounts · sorted by balance`}
      >
        <div className="overflow-x-auto -mx-5">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-5 py-2 font-semibold">Account</th>
                <th className="px-5 py-2 font-semibold">Customer</th>
                <th className="px-5 py-2 font-semibold">Type</th>
                <th className="px-5 py-2 font-semibold text-right">Balance</th>
                <th className="px-5 py-2 font-semibold text-right">Monthly Fee</th>
                <th className="px-5 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...accounts]
                .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
                .map((a) => {
                  const status = (a.status || "active").toString();
                  const frozen = /freeze|suspend|frozen/i.test(status);
                  return (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-2.5 font-mono text-xs text-navy-900">{a.id}</td>
                      <td className="px-5 py-2.5 text-navy-900 font-semibold">
                        {customerMap[a.customerId]?.fullName || a.customerId}
                      </td>
                      <td className="px-5 py-2.5 text-slate-600">{a.type}</td>
                      <td className="px-5 py-2.5 text-right font-bold tabular-nums text-navy-900">{FJ(a.balance)}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-600">{FJ(a.maintenanceFee)}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          frozen ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${frozen ? "bg-rose-500" : "bg-emerald-500"}`} />
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              {accounts.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No accounts on file</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
