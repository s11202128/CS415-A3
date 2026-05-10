import { useEffect, useMemo, useState } from "react";
import {
  Briefcase, TrendingUp, TrendingDown, AlertTriangle, FileSignature,
  Users, Receipt, Wallet, BarChart3,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import { api } from "../../api";

const FJD = (n) => `FJ$${Number(n || 0).toLocaleString("en-FJ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * BusinessPage — premium business banking dashboard with KPI tiles, cash-flow
 * chart, fee tracker, payroll/invoice/tax widgets, and the existing
 * AccountManager for actual business-layer account CRUD.
 */
export default function BusinessPage({ accounts = [], transactions = [] }) {
  const [businessLayerAccounts, setBusinessLayerAccounts] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await api.listBusinessLayerAccounts();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (active) setBusinessLayerAccounts(items);
      } catch {
        if (active) setBusinessLayerAccounts([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const ownedAccountIds = useMemo(
    () => new Set(accounts.map((a) => String(a.accountNumber || "")).filter(Boolean)),
    [accounts],
  );

  const businessAccounts = useMemo(() => {
    const linkedBusinessLayer = businessLayerAccounts.filter(
      (a) => /business/i.test(a.accountType || "") && ownedAccountIds.has(String(a.accountId || "")),
    );
    if (linkedBusinessLayer.length > 0) return linkedBusinessLayer;
    return accounts.filter((a) => /business/i.test(a.accountType || a.type || ""));
  }, [accounts, businessLayerAccounts, ownedAccountIds]);

  const balance = businessAccounts.reduce((s, a) => s + Number(a.balance || 0), 0);

  const { netInput, netOutput, cashflow } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let inc = 0, exp = 0;
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return { day: d.getDate(), in: 0, out: 0 };
    });
    transactions.forEach((t) => {
      const d = t.createdAt ? new Date(t.createdAt) : null;
      if (!d || d.getMonth() !== month || d.getFullYear() !== year) return;
      const amt = Math.abs(Number(t.amount || 0));
      const isCredit = /deposit|credit|in/i.test(t.type || "") || Number(t.amount) > 0;
      const bucket = days[d.getDate() - 1];
      if (isCredit) { inc += amt; if (bucket) bucket.in += amt; }
      else          { exp += amt; if (bucket) bucket.out += amt; }
    });
    return { netInput: inc, netOutput: exp, cashflow: days };
  }, [transactions]);

  const feeWaived = netInput >= 2000;
  const monthlyFee = 25.0;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        eyebrow="Business Banking"
        title="Business Dashboard"
        description="Track your business accounts, cash flow, payroll and tax obligations in one place."
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Business Balance" value={FJD(balance)} icon={Wallet} color="navy" subtitle={`${businessAccounts.length} account${businessAccounts.length === 1 ? "" : "s"}`} />
        <StatCard label="Net Input (MTD)" value={FJD(netInput)} icon={TrendingUp} color="emerald" change="vs last month" changeType="up" />
        <StatCard label="Net Output (MTD)" value={FJD(netOutput)} icon={TrendingDown} color="rose" change="vs last month" changeType="down" />
        <StatCard
          label={feeWaived ? "Maintenance Fee" : "Maintenance Fee Due"}
          value={feeWaived ? "Waived" : FJD(monthlyFee)}
          icon={AlertTriangle}
          color={feeWaived ? "emerald" : "amber"}
          subtitle={feeWaived ? "Net input ≥ FJ$2,000" : "Top up to FJ$2,000 to waive"}
        />
      </div>

      {/* Fee warning banner */}
      {!feeWaived && netInput < 2000 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Maintenance fee may apply this month</p>
            <p className="text-sm text-amber-800">
              Your current monthly net input is <strong>{FJD(netInput)}</strong>. Maintain at least
              <strong> FJ$2,000</strong> to have the <strong>{FJD(monthlyFee)}</strong> maintenance fee waived.
            </p>
          </div>
        </div>
      )}

      {/* Cash flow chart */}
      <section className="bof-card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-navy-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-600" /> Daily Cash Flow
          </h3>
          <span className="text-xs text-slate-600">Current month</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="bofIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bofOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1e3a8a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <Tooltip formatter={(v) => FJD(v)} contentStyle={{ borderRadius: 12 }} />
              <Area type="monotone" dataKey="in" name="Income" stroke="#06b6d4" fill="url(#bofIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="out" name="Outflow" stroke="#1e3a8a" fill="url(#bofOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Three-column widgets */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="bof-card">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-5 w-5 text-navy-700" />
            <h3 className="font-bold text-navy-900">Payroll</h3>
          </div>
          <p className="text-xs text-slate-600">Next pay run</p>
          <p className="mt-1 text-2xl font-display font-bold text-navy-900">15 days</p>
          <p className="text-xs text-slate-600 mt-2">Estimated total</p>
          <p className="text-lg font-semibold text-navy-900">{FJD(0)}</p>
          <button className="bof-btn bof-btn-primary mt-4 w-full">Set up payroll</button>
        </div>

        <div className="bof-card">
          <div className="flex items-center gap-2 mb-3">
            <FileSignature className="h-5 w-5 text-cyan-600" />
            <h3 className="font-bold text-navy-900">Invoices</h3>
          </div>
          <p className="text-xs text-slate-600">Outstanding</p>
          <p className="mt-1 text-2xl font-display font-bold text-navy-900">{FJD(0)}</p>
          <p className="text-xs text-slate-600 mt-2">0 invoices awaiting payment</p>
          <button className="bof-btn bof-btn-cyan mt-4 w-full">Create invoice</button>
        </div>

        <div className="bof-card">
          <div className="flex items-center gap-2 mb-3">
            <Receipt className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-navy-900">Tax (FRCS)</h3>
          </div>
          <p className="text-xs text-slate-600">Next VAT return</p>
          <p className="mt-1 text-2xl font-display font-bold text-navy-900">28 days</p>
          <p className="text-xs text-slate-600 mt-2">Estimated due</p>
          <p className="text-lg font-semibold text-navy-900">{FJD(0)}</p>
          <button className="bof-btn bof-btn-ghost mt-4 w-full border border-slate-200">Pay tax</button>
        </div>
      </section>

    </div>
  );
}
