import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Download, ShoppingBag, Coffee, Plane,
  Award, ArrowRight, Eye, EyeOff,
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";
import { api } from "../../api";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";

const FJD = (n) => `FJ$${Number(n || 0).toLocaleString("en-FJ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * CreditCardPage — premium credit-card UI with 3D card visual, KPI tiles,
 * spending sparkline and recent purchases.
 */
export default function CreditCardPage({ currentUser, creditCards = [], onSelectTab, onPayNow }) {
  const [hide, setHide] = useState(false);
  const [downloadingStatement, setDownloadingStatement] = useState(false);
  const [statementError, setStatementError] = useState("");

  const primaryCard = Array.isArray(creditCards) && creditCards.length > 0 ? creditCards[0] : null;
  const limit = Number(primaryCard?.creditLimit || 0);
  const outstanding = Number(primaryCard?.currentBalance || 0);
  const available = limit - outstanding;
  const minPayment = outstanding > 0 ? Math.max(20, outstanding * 0.05) : 0;
  const dueIn = primaryCard?.statementDue
    ? Math.max(
        0,
        Math.ceil((new Date(primaryCard.statementDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : null;
  const points = 12450;

  const maskedCardNumber = primaryCard?.cardNumber
    ? `${String(primaryCard.cardNumber).slice(0, 4)} ${String(primaryCard.cardNumber).slice(4, 8)} •••• ${String(primaryCard.cardNumber).slice(-4)}`
    : "•••• •••• •••• ••••";

  const purchases = []; // empty until backend feed wired
  const sparkline = Array.from({ length: 14 }, (_, i) => ({ d: i + 1, v: Math.round(Math.random() * 200) }));

  async function handleDownloadStatement() {
    setStatementError("");
    setDownloadingStatement(true);
    try {
      const { blob, contentDisposition } = await api.downloadMyStatement({});
      const filenameMatch = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(contentDisposition || "");
      const encodedName = filenameMatch?.[1] || filenameMatch?.[2] || "bank-statement.pdf";
      const filename = decodeURIComponent(encodedName);

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setStatementError(err?.message || "Unable to download statement right now.");
    } finally {
      setDownloadingStatement(false);
    }
  }

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
      <section className="grid sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            if (onPayNow) {
              onPayNow();
              return;
            }
            onSelectTab?.("Bill Payments");
          }}
          className="bof-card text-left group"
        >
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
          type="button"
          onClick={handleDownloadStatement}
          disabled={downloadingStatement}
          className="bof-card text-left group disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-navy-900">Download Statement</p>
              <p className="text-xs text-slate-600">
                {downloadingStatement ? "Preparing PDF..." : "PDF for the current cycle"}
              </p>
            </div>
            <div className="grid place-items-center h-10 w-10 rounded-xl bg-navy-900 text-white group-hover:scale-105 transition-transform">
              <Download className="h-5 w-5" />
            </div>
          </div>
        </button>
      </section>

      {statementError && (
        <p className="text-sm text-rose-600">{statementError}</p>
      )}

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

    </div>
  );
}
