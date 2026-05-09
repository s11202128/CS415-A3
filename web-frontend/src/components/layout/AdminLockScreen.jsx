import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";

/**
 * AdminLockScreen — premium centered card on dark navy backdrop.
 * Replaces the legacy /tabs/AdminLockScreen.js form.
 */
export default function AdminLockScreen({
  adminAuthForm,
  setAdminAuthForm,
  onVerifyAdminAccess,
  adminAuthMessage,
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-navy-950 via-navy-900 to-cyan-900 p-4 relative overflow-hidden">
      <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl bg-white shadow-card-hover border border-white/10 p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-navy-900 to-cyan-700 text-white shadow-glow">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-cyan-700 font-semibold">Restricted</p>
            <h1 className="text-2xl font-display font-bold text-navy-900 leading-tight">Admin Access</h1>
          </div>
        </div>

        <p className="text-sm text-slate-700 mb-6">
          Enter your admin credentials to unlock the administration dashboard.
        </p>

        <form onSubmit={onVerifyAdminAccess} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={adminAuthForm.email}
                onChange={(e) => setAdminAuthForm({ ...adminAuthForm, email: e.target.value })}
                required
                placeholder="admin@bof.fj"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:bg-white focus:border-navy-500 focus:ring-2 focus:ring-navy-200 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={adminAuthForm.password}
                onChange={(e) => setAdminAuthForm({ ...adminAuthForm, password: e.target.value })}
                required
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:bg-white focus:border-navy-500 focus:ring-2 focus:ring-navy-200 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy-900 to-cyan-700 px-4 py-2.5 text-sm font-bold text-white shadow-card hover:shadow-card-hover transition-shadow"
          >
            Unlock Admin Page <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {adminAuthMessage && (
          <p className="mt-4 text-sm font-medium text-rose-600 text-center">{adminAuthMessage}</p>
        )}
      </motion.div>
    </div>
  );
}
