import { motion } from "framer-motion";

/**
 * StatCard — KPI tile used across pages (Business, Investments, etc.)
 */
export default function StatCard({ label, value, change, changeType = "up", icon: Icon, color = "navy", subtitle }) {
  const colorMap = {
    navy: "from-navy-50 to-white text-navy-900",
    cyan: "from-cyan-50 to-white text-cyan-900",
    emerald: "from-emerald-50 to-white text-emerald-900",
    rose: "from-rose-50 to-white text-rose-900",
    amber: "from-amber-50 to-white text-amber-900",
  };
  const iconBgMap = {
    navy: "bg-navy-900 text-white",
    cyan: "bg-cyan-500 text-white",
    emerald: "bg-emerald-500 text-white",
    rose: "bg-rose-500 text-white",
    amber: "bg-amber-500 text-white",
  };
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={["relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br p-5 shadow-card", colorMap[color]].join(" ")}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest font-semibold opacity-70">{label}</p>
          <p className="mt-1 text-2xl lg:text-3xl font-display font-bold truncate">{value}</p>
          {subtitle && <p className="mt-1 text-xs opacity-70">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={["grid place-items-center h-10 w-10 rounded-xl shrink-0 shadow-sm", iconBgMap[color]].join(" ")}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {change && (
        <p className={["mt-3 inline-flex items-center gap-1 text-xs font-semibold", changeType === "up" ? "text-emerald-600" : "text-rose-600"].join(" ")}>
          <span>{changeType === "up" ? "▲" : "▼"}</span> {change}
        </p>
      )}
    </motion.div>
  );
}
