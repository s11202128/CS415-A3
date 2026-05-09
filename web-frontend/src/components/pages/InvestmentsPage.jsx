import { TrendingUp, Sparkles, PieChart as PieIcon, BarChart3 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";

const FJD = (n) => `FJ$${Number(n || 0).toLocaleString("en-FJ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const COLORS = ["#06b6d4", "#1e3a8a", "#22d3ee", "#14b8a6", "#a855f7"];

const PORTFOLIO = [
  { name: "Term Deposit · 12mo", value: 5000, return: 4.2 },
  { name: "Government Bond", value: 3500, return: 3.5 },
  { name: "Equity Fund", value: 2200, return: 7.8 },
  { name: "Money Market", value: 1300, return: 2.1 },
];

const HISTORY = Array.from({ length: 12 }, (_, i) => ({
  m: new Date(2025, i, 1).toLocaleString("en", { month: "short" }),
  v: 10000 + i * 280 + Math.round(Math.random() * 200),
}));

export default function InvestmentsPage() {
  const total = PORTFOLIO.reduce((s, p) => s + p.value, 0);
  const weightedReturn = PORTFOLIO.reduce((s, p) => s + p.value * p.return, 0) / total;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        eyebrow="Wealth"
        title="Investments"
        description="Grow your wealth with term deposits, bonds and managed funds backed by Bank of Fiji."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={FJD(total)} icon={TrendingUp} color="navy" />
        <StatCard label="Avg. Return p.a." value={`${weightedReturn.toFixed(2)}%`} color="emerald" change="vs last quarter" changeType="up" />
        <StatCard label="Monthly Income" value={FJD(total * weightedReturn / 100 / 12)} color="cyan" />
        <StatCard label="Open Positions" value={PORTFOLIO.length} color="amber" subtitle="Actively managed" />
      </div>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="bof-card lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-navy-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-cyan-600" /> Portfolio Performance
            </h3>
            <span className="text-xs text-slate-500">Last 12 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={HISTORY}>
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip formatter={(v) => FJD(v)} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="v" stroke="#06b6d4" fill="url(#ig)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bof-card">
          <h3 className="font-bold text-navy-900 mb-2 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-navy-700" /> Allocation
          </h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={PORTFOLIO} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {PORTFOLIO.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => FJD(v)} contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="bof-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy-900">Holdings</h3>
          <button className="bof-btn bof-btn-cyan text-xs px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5" /> New investment
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2">Product</th>
              <th className="py-2">Allocation</th>
              <th className="py-2 text-right">Value</th>
              <th className="py-2 text-right">Return p.a.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PORTFOLIO.map((p, i) => {
              const pct = (p.value / total) * 100;
              return (
                <tr key={p.name} className="hover:bg-slate-50/60">
                  <td className="py-3 font-semibold text-navy-900">{p.name}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs text-slate-500">{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-semibold">{FJD(p.value)}</td>
                  <td className="py-3 text-right text-emerald-600 font-semibold">{p.return.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-slate-500 text-center">
        Investments are subject to market risk. Past performance is not indicative of future results.
      </p>
    </div>
  );
}
