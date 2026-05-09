import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  Landmark,
  TrendingUp,
  Briefcase,
  FileText,
  BellRing,
  UserCog,
  LifeBuoy,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

/**
 * Navigation items map to existing top-level tabs in constants/tabs.js so the
 * legacy content keeps rendering. Items without a `tab` are placeholders for
 * future pages — clicking them shows a "coming soon" toast.
 */
export const SIDEBAR_ITEMS = [
  { id: "Overview",      label: "Dashboard",           icon: LayoutDashboard, tab: "Overview" },
  { id: "Accounts",      label: "Accounts",            icon: Wallet,          tab: "Accounts" },
  { id: "Transfers",     label: "Transfers",           icon: ArrowLeftRight,  tab: "Transfers" },
  { id: "Bill Payments", label: "Bill Payments",       icon: Receipt,         tab: "Bill Payments" },
  { id: "CreditCards",   label: "Credit Cards",        icon: CreditCard,      tab: "Business", sub: "cards" },
  { id: "Loans",         label: "Loans",               icon: Landmark,        tab: "Loans" },
  { id: "Investments",   label: "Investments",         icon: TrendingUp,      tab: "Investments" },
  { id: "Business",      label: "Business Banking",    icon: Briefcase,       tab: "Business", sub: "accounts" },
  { id: "Statements",    label: "Statements",          icon: FileText,        tab: "Statements" },
  { id: "Alerts",        label: "Alerts & Messages",   icon: BellRing,        tab: "Alerts" },
  { id: "Profile",       label: "Profile & Settings",  icon: UserCog,         tab: "Profile" },
  { id: "Support",       label: "Support Center",      icon: LifeBuoy,        tab: "Support" },
];

export default function Sidebar({
  activeTab,
  onSelectTab,
  onSelectBusinessSub,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) {
  function handleClick(item) {
    if (!item.tab) {
      // Placeholder — flash a non-blocking visual hint
      onSelectTab(activeTab); // no-op
      return;
    }
    onSelectTab(item.tab);
    if (item.sub) onSelectBusinessSub?.(item.sub);
    onCloseMobile?.();
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
          />
        )}
      </AnimatePresence>

      <aside
        className={[
          "fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col",
          "bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white",
          "shadow-2xl transition-[width,transform] duration-300",
          collapsed ? "lg:w-20" : "lg:w-64",
          "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
        aria-label="Primary navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-navy-950 font-extrabold shadow-glow shrink-0">
              BF
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight truncate">Bank of Fiji</p>
                <p className="text-[10px] uppercase tracking-widest text-cyan-300/80">Online Banking</p>
              </div>
            )}
          </div>
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.tab === activeTab ||
              (item.id === "Overview" && activeTab === "Overview");
            const disabled = !item.tab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleClick(item)}
                disabled={disabled}
                title={collapsed ? item.label : undefined}
                className={[
                  "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-transparent text-white border-l-2 border-cyan-400 pl-[10px]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                  disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-slate-300",
                ].join(" ")}
              >
                <Icon className={["h-5 w-5 shrink-0", isActive && "text-cyan-300"].join(" ")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && disabled && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-slate-300">soon</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: collapse + logout */}
        <div className="border-t border-white/10 p-2 space-y-1">
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-rose-500/15 hover:text-rose-200 transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
