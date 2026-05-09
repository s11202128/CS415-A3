import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowDownToLine, Plus, RefreshCw } from "lucide-react";
import PageHeader from "../ui/PageHeader";
import StatCard from "../ui/StatCard";
import AccountsTab from "../tabs/AccountsTab";

const FJD = (n) => `FJ$${Number(n || 0).toLocaleString("en-FJ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const GRAD = {
  Savings: "bg-card-savings",
  "Simple Access": "bg-card-everyday",
  Cheque: "bg-card-everyday",
  Business: "bg-card-business",
};
function gradFor(t) {
  if (!t) return "bg-card-everyday";
  if (/savings/i.test(t)) return GRAD.Savings;
  if (/business/i.test(t)) return GRAD.Business;
  return GRAD["Simple Access"];
}

export default function AccountsPage(props) {
  const { accounts = [], currentUser } = props;
  const cid = currentUser?.customerId || currentUser?.userId || currentUser?.id || "";
  const mine = useMemo(() => accounts.filter((a) => String(a.customerId) === String(cid)), [accounts, cid]);
  const totalActive = mine.filter((a) => a.status === "active").reduce((s, a) => s + Number(a.balance || 0), 0);
  const pendingCount = mine.filter((a) => a.status !== "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        eyebrow="My Accounts"
        title="Accounts"
        description="View your active accounts, balances, and request to open a new one."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Balance" value={FJD(totalActive)} icon={Wallet} color="navy" subtitle="Across active accounts" />
        <StatCard label="Active Accounts" value={mine.filter((a) => a.status === "active").length} icon={Wallet} color="emerald" />
        <StatCard label="Pending Requests" value={pendingCount} icon={Plus} color="amber" subtitle="Awaiting approval" />
        <StatCard label="Account Holder" value={(currentUser?.fullName || "—").split(" ")[0]} icon={ArrowDownToLine} color="cyan" subtitle={currentUser?.fullName} />
      </div>

      {mine.length > 0 && (
        <section>
          <h2 className="inline-block text-base font-display font-bold text-white mb-3 px-4 py-2 rounded-xl shadow-sm bg-gradient-to-br from-navy-900 via-navy-800 to-cyan-700">
            Your Cards
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {mine.map((acc, i) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4 }}
                className={["relative overflow-hidden rounded-2xl text-white shadow-card-hover p-5", gradFor(acc.type)].join(" ")}
              >
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/70">{acc.type === "Simple Access" ? "Cheque" : acc.type}</p>
                    <p className="mt-0.5 text-sm font-semibold">{acc.accountHolder || currentUser?.fullName || "Customer"}</p>
                  </div>
                  <span className={["bof-pill", acc.status === "active" ? "bof-pill-success" : "bof-pill-warn"].join(" ")}>
                    {acc.status}
                  </span>
                </div>
                <p className="relative mt-6 font-mono tracking-widest text-sm text-white/85">
                  {String(acc.accountNumber || "").replace(/(.{4})/g, "$1 ").trim() || "•••• •••• ••••"}
                </p>
                <div className="relative mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-white/70">Available</p>
                  <p className="text-2xl font-bold">{acc.status === "active" ? FJD(acc.balance) : "—"}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Existing functional tab content (table + open-account form) */}
      <section className="bof-card">
        <AccountsTab {...props} />
      </section>
    </div>
  );
}
