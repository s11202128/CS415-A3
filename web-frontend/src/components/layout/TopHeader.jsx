import { useEffect, useState } from "react";
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  ShieldCheck,
  Plus,
  ArrowLeftRight,
  Receipt,
  CreditCard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function TopHeader({
  currentUser,
  notificationsCount = 0,
  onOpenMobileNav,
  onQuickAction,
  isAdminUser,
  onOpenAdmin,
}) {
  const [dark, setDark] = useState(false);
  const [showQuick, setShowQuick] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const now = useClock();

  const firstName = (currentUser?.fullName || "Customer").split(" ")[0];
  const initials = (currentUser?.fullName || "C")
    .split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        {/* Mobile menu */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100"
          onClick={onOpenMobileNav}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Greeting (hidden on small) */}
        <div className="hidden md:block min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-slate-600">
            {now.toLocaleDateString("en-FJ", { weekday: "long", day: "numeric", month: "short" })} ·{" "}
            {now.toLocaleTimeString("en-FJ", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-sm font-semibold text-navy-900 truncate">
            {getGreeting()}, {firstName} <span className="ml-1">👋</span>
          </p>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl ml-auto md:ml-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search transactions, payees, accounts…"
              className="w-full rounded-xl border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:bg-white focus:border-navy-400 focus:ring-2 focus:ring-navy-200"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            className="bof-btn bof-btn-cyan px-3 py-2 text-xs"
            onClick={() => setShowQuick((v) => !v)}
          >
            <Plus className="h-4 w-4" /> Quick
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <AnimatePresence>
            {showQuick && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-slate-100 p-2 z-40"
              >
                {[
                  { icon: ArrowLeftRight, label: "Transfer Money", tab: "Transfers" },
                  { icon: Receipt,        label: "Pay Bills",      tab: "Bill Payments" },
                  { icon: CreditCard,     label: "Manage Cards",   tab: "Business", sub: "cards" },
                ].map((qa) => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => { onQuickAction?.(qa); setShowQuick(false); }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
                  >
                    <qa.icon className="h-4 w-4 text-cyan-600" /> {qa.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
          aria-label="Toggle theme"
          title="Theme (visual toggle)"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button type="button" className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-700" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {notificationsCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center text-[10px] font-bold rounded-full bg-rose-500 text-white">
              {notificationsCount > 9 ? "9+" : notificationsCount}
            </span>
          )}
        </button>

        {/* User */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfile((v) => !v)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-100"
          >
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-navy-700 to-cyan-600 text-white font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-navy-900 leading-tight">{currentUser?.fullName || "Customer"}</p>
              <p className="text-[10px] text-slate-600 leading-tight flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Last login today
              </p>
            </div>
            <ChevronDown className="hidden md:block h-4 w-4 text-slate-500" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-slate-100 p-2 z-40"
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-semibold text-navy-900">{currentUser?.fullName}</p>
                  <p className="text-xs text-slate-600 truncate">{currentUser?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { onQuickAction?.({ tab: "Profile" }); setShowProfile(false); }}
                  className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Profile & Settings
                </button>
                {!isAdminUser && (
                  <button
                    type="button"
                    onClick={() => { onOpenAdmin?.(); setShowProfile(false); }}
                    className="w-full text-left rounded-xl px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    Admin Console
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
