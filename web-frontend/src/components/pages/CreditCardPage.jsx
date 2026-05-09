import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Snowflake, Flame, Download, ShoppingBag, Coffee, Plane,
  Award, ArrowRight, Eye, EyeOff,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import CreditCardPanel from "../CreditCardPanel";

const FJD = (n) => `FJ$${Number(n || 0).toLocaleString("en-FJ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * CreditCardPage — premium credit-card UI with 3D card visual, KPI tiles,
 * spending sparkline, recent purchases and freeze/unfreeze action.
 */
export default function CreditCardPage({ currentUser }) {
  const [hide, setHide] = useState(false);
  const [frozen, setFrozen] = useState(false);

  // Demo placeholder values — wire to real /creditcard endpoints from CreditCardPanel
  const limit = 5000;
  const outstanding = 0;
  const available = limit - outstanding;
  const minPayment = 0;
  const dueIn = 18;
  const points = 12450;

  const purchases = []; // empty until backend feed wired
  const sparkline = Array.from({ length: 14 }, (_, i) => ({ d: i + 1, v: Math.round(Math.random() * 200) }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={CreditCard}
        eyebrow="Credit Cards"
        title="Bank of Fiji Visa"
        description="Manage your credit card, track spending, view rewards and pay your balance."
        actions={
          <button onClick={() => setHide((v) => !v)} className="rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-semibold text-white inline-flex items-center gap-1.5">
            {hide ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {hide ? "Show details" : "Hide details"}
          </button>
        }
      />

      <section className="grid lg:grid-cols-[420px,1fr] gap-6">
        {/* 3D credit card */}
        <motion.div
          initial={{ opacity: 0, rotateY: -10 }} animate={{ opacity: 1, rotateY: 0 }}
          whileHover={{ rotateY: 4, rotateX: -3, y: -4 }}
          className="relative h-56 lg:h-64 rounded-3xl bg-card-credit text-white shadow-card-hover overflow-hidden p-6 [transform-style:preserve-3d]"
        >
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/70">Bank of Fiji</p>
              <p className="text-sm font-bold">VISA Platinum</p>
            </div>
            <div className="grid place-items-center h-9 w-12 rounded-md bg-gradient-to-br from-amber-300 to-amber-500/70" />
          </div>
          <p className="relative mt-6 font-mono tracking-[0.3em] text-lg text-white/90">
            {hide ? "•••• •••• •••• ••••" : "4521 8932 4567 7783"}
          </p>
          <div className="relative mt-5 flex items-end justify-between text-xs text-white/80">
            <div>
              <p className="opacity-70">Card Holder</p>
              <p className="font-semibold uppercase tracking-wide">{currentUser?.fullName || "Customer"}</p>
            </div>
            <div className="text-right">
              <p className="opacity-70">Expires</p>
              <p className="font-semibold">12/29</p>
            </div>
            <div className="text-right">
              <p className="opacity-70">CVV</p>
              <p className="font-semibold">{hide ? "•••" : "•••"}</p>
            </div>
          </div>
          {frozen && (
            <div className="absolute inset-0 grid place-items-center bg-navy-950/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-cyan-200 font-bold">
                <Snowflake className="h-5 w-5" /> Card Frozen
              </div>
            </div>
          )}
        </motion.div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Available Credit" value={hide ? "•••" : FJD(available)} color="emerald" icon={CreditCard} subtitle={`Limit ${FJD(limit)}`} />
          <StatCard label="Outstanding" value={hide ? "•••" : FJD(outstanding)} color="rose" icon={CreditCard} />
          <StatCard label="Min Payment" value={hide ? "•••" : FJD(minPayment)} color="amber" icon={CreditCard} subtitle={`Due in ${dueIn} days`} />
          <StatCard label="Reward Points" value={hide ? "•••" : points.toLocaleString()} color="cyan" icon={Award} subtitle="Redeem at 1 pt = FJ$0.01" />
        </div>
      </section>

      {/* Actions row */}
      <section className="grid sm:grid-cols-3 gap-4">
        <button className="bof-card text-left group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy-900">Pay Now</p>
              <p className="text-xs text-slate-600">Pay your balance from any account</p>
            </div>
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-emerald-500 text-white group-hover:scale-105 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </button>

        <button
          onClick={() => setFrozen((f) => !f)}
          className="bof-card text-left group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy-900">{frozen ? "Unfreeze Card" : "Freeze Card"}</p>
              <p className="text-xs text-slate-600">{frozen ? "Re-enable spending" : "Temporarily block all transactions"}</p>
            </div>
            <div className={["grid place-items-center h-10 w-10 rounded-xl text-white group-hover:scale-105 transition-transform", frozen ? "bg-rose-500" : "bg-cyan-500"].join(" ")}>
              {frozen ? <Flame className="h-5 w-5" /> : <Snowflake className="h-5 w-5" />}
            </div>
          </div>
        </button>

        <button className="bof-card text-left group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy-900">Download Statement</p>
              <p className="text-xs text-slate-600">PDF for the current cycle</p>
            </div>
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-navy-900 text-white group-hover:scale-105 transition-transform">
              <Download className="h-5 w-5" />
            </div>
          </div>
        </button>
      </section>

      {/* Spending analytics */}
      <section className="grid lg:grid-cols-[2fr,1fr] gap-4">
        <div className="bof-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-navy-900">Spending — last 14 days</h3>
            <span className="text-xs text-slate-600">Daily totals</span>
          </div>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={sparkline}>
                <XAxis dataKey="d" tickLine={false} axisLine={false} className="text-xs" />
                <Tooltip formatter={(v) => FJD(v)} contentStyle={{ borderRadius: 12 }} />
                <Line type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bof-card">
          <h3 className="font-bold text-navy-900 mb-2">Recent Purchases</h3>
          {purchases.length === 0 ? (
            <p className="text-sm text-slate-600 py-6 text-center">No purchases yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {purchases.map((p, i) => (
                <li key={i} className="py-2.5 flex items-center gap-3">
                  <div className="grid place-items-center h-9 w-9 rounded-xl bg-slate-100">
                    {p.icon === "shop" ? <ShoppingBag className="h-4 w-4 text-navy-700" /> :
                      p.icon === "coffee" ? <Coffee className="h-4 w-4 text-navy-700" /> :
                      <Plane className="h-4 w-4 text-navy-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">{p.merchant}</p>
                    <p className="text-xs text-slate-600">{p.date}</p>
                  </div>
                  <p className="text-sm font-semibold text-rose-600">−{FJD(p.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Existing functional credit card panel */}
      <section className="bof-card">
        <h3 className="font-bold text-navy-900 mb-2">Card Operations</h3>
        <p className="text-sm text-slate-600 mb-4">
          Create your card, charge purchases, view your summary and make payments via the
          existing <code>/creditcard</code> backend.
        </p>
        <CreditCardPanel />
      </section>
    </div>
  );
}
