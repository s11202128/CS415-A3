import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Lock, Mail, Phone, User as UserIcon, Eye, EyeOff,
  ArrowRight, KeyRound, Sparkles, CheckCircle2, AlertCircle, Globe2, Check,
} from "lucide-react";
import { api, setToken } from "../api";

// ----- field helpers (module scope so inputs don't remount per keystroke) -----
const inputBase =
  "w-full rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm text-navy-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500";

function Field({ icon: Icon, label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{hint && <span className="text-slate-400 font-normal"> · {hint}</span>}
      </span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
        {children}
      </div>
    </label>
  );
}

function TextField({ icon, label, hint, ...rest }) {
  return (
    <Field icon={icon} label={label} hint={hint}>
      <input {...rest} className={`${inputBase} border-slate-200`} />
    </Field>
  );
}

function PasswordField({
  id, label, value, onChange, autoComplete, required = true, minLength,
  error, hint, showPw, togglePw,
}) {
  const visible = !!(showPw && showPw[id]);
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{hint && <span className="text-slate-400 font-normal"> · {hint}</span>}
      </span>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className={`${inputBase} pr-11 ${error ? "border-rose-300" : "border-slate-200"}`}
        />
        <button type="button" onClick={() => togglePw && togglePw(id)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 focus:outline-none"
          aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </label>
  );
}

function SubmitButton({ children, submitting }) {
  return (
    <button type="submit" disabled={submitting}
      className="group relative w-full rounded-xl bg-gradient-to-r from-navy-900 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:shadow-card-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed">
      <span className="inline-flex items-center justify-center gap-2">
        {submitting ? "Please wait…" : children}
        {!submitting && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
      </span>
    </button>
  );
}

/**
 * Premium AuthPage — split-screen sign-in/up/forgot/reset experience.
 * Functionality (api.login / api.register / requestPasswordReset / resetPassword)
 * is preserved exactly; only the presentation changes.
 */
export default function AuthPage({ onLoginSuccess, currentYear }) {
  const [authView, setAuthView] = useState("login");
  const [authForm, setAuthForm] = useState({
    fullName: "", mobile: "", email: "", password: "", confirmPassword: "",
  });
  const [resetForm, setResetForm] = useState({
    email: "", resetId: "", code: "", newPassword: "", confirmPassword: "",
  });
  const [authMessage, setAuthMessage] = useState("");
  const [authHint, setAuthHint] = useState("");
  const [showPw, setShowPw] = useState({});
  const [loginPasswordError, setLoginPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const togglePw = (k) => setShowPw((p) => ({ ...p, [k]: !p[k] }));

  function onAuthViewChange(view) {
    setAuthView(view);
    setAuthMessage("");
    setAuthHint("");
    setLoginPasswordError("");
  }

  async function onLogin(e) {
    e.preventDefault();
    setAuthMessage(""); setLoginPasswordError(""); setSubmitting(true);
    try {
      const result = await api.login({ email: authForm.email, password: authForm.password });
      setToken(result.token);
      onLoginSuccess(result.token, {
        fullName: result.fullName, userId: result.userId, customerId: result.customerId,
        email: result.email, mobile: result.mobile, nationalId: result.nationalId,
        isAdmin: Boolean(result.isAdmin),
      });
    } catch {
      const m = "Invalid email or password.";
      setLoginPasswordError(m); setAuthMessage(m);
    } finally { setSubmitting(false); }
  }

  async function onRegister(e) {
    e.preventDefault(); setAuthMessage("");
    if (authForm.password !== authForm.confirmPassword) { setAuthMessage("Passwords do not match"); return; }
    setSubmitting(true);
    try {
      const result = await api.register({
        fullName: authForm.fullName, mobile: authForm.mobile, email: authForm.email,
        password: authForm.password, confirmPassword: authForm.confirmPassword,
      });
      setAuthMessage(result.message || "Registration successful. You can now sign in.");
      setAuthHint(""); setAuthView("login");
      setAuthForm({ ...authForm, password: "", confirmPassword: "" });
    } catch (err) {
      let msg = err.message;
      if (err && err.response && err.response.error && err.response.error.message) msg = err.response.error.message;
      setAuthMessage(msg || "Registration failed. Please try again.");
    } finally { setSubmitting(false); }
  }

  async function onRequestReset(e) {
    e.preventDefault(); setAuthMessage(""); setSubmitting(true);
    try {
      const result = await api.requestPasswordReset({ email: resetForm.email });
      setAuthMessage(result.message || "Password reset code generated.");
      setAuthHint(result.simulatedResetCode ? `Reset ID: ${result.resetId} | Code: ${result.simulatedResetCode}` : "");
      setResetForm((p) => ({ ...p, resetId: result.resetId || "", code: result.simulatedResetCode || "" }));
      setAuthView("reset");
    } catch (err) { setAuthMessage(err.message); }
    finally { setSubmitting(false); }
  }

  async function onResetPassword(e) {
    e.preventDefault(); setAuthMessage("");
    if (resetForm.newPassword !== resetForm.confirmPassword) { setAuthMessage("Passwords do not match"); return; }
    setSubmitting(true);
    try {
      await api.resetPassword({
        email: resetForm.email, resetId: resetForm.resetId,
        otp: resetForm.code, newPassword: resetForm.newPassword,
      });
      setAuthMessage("Password reset complete. Sign in with your new password.");
      setAuthHint(""); setAuthView("login");
    } catch (err) { setAuthMessage(err.message); }
    finally { setSubmitting(false); }
  }

  const isOk = authMessage && /successful|complete|generated|sign in/i.test(authMessage);
  const titleByView = {
    login: "Welcome back",
    register: "Create your account",
    forgot: "Recover your access",
    reset: "Set a new password",
  };
  const subtitleByView = {
    login: "Sign in to access your secure banking dashboard.",
    register: "Join Bank of Fiji and start managing your money smarter.",
    forgot: "Enter your email and we'll send a reset code.",
    reset: "Use the code we sent to set a new password.",
  };

  function renderLogin() {
    return (
      <form onSubmit={onLogin} className="space-y-4">
        <TextField icon={Mail} label="Email address" type="email" required autoComplete="email"
          placeholder="you@example.com"
          value={authForm.email}
          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
        <PasswordField id="loginPw" label="Password" autoComplete="current-password"
          showPw={showPw} togglePw={togglePw}
          value={authForm.password}
          error={loginPasswordError}
          onChange={(e) => {
            setAuthForm({ ...authForm, password: e.target.value });
            if (loginPasswordError) { setLoginPasswordError(""); setAuthMessage(""); }
          }} />

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <span
              role="checkbox"
              aria-checked={rememberMe}
              tabIndex={0}
              onClick={() => setRememberMe((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setRememberMe((v) => !v);
                }
              }}
              className={`grid place-items-center h-4 w-4 rounded border ${
                rememberMe ? "bg-slate-700 border-slate-700" : "bg-white border-slate-300"
              }`}
            >
              {rememberMe && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            Remember me
          </label>
          <button type="button" onClick={() => onAuthViewChange("forgot")}
            className="font-bold text-navy-900 underline decoration-cyan-500 decoration-2 underline-offset-4 hover:decoration-cyan-600">Forgot password?</button>
        </div>

        <SubmitButton submitting={submitting}>Sign in securely</SubmitButton>

        <div className="pt-4 border-t border-slate-200 text-center text-sm">
          <p className="text-slate-700 mb-3">New to Bank of Fiji?</p>
          <button type="button" onClick={() => onAuthViewChange("register")}
            className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border-2 border-navy-900 bg-white px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-navy-900 hover:text-white transition-colors">
            Create an account <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    );
  }

  function renderRegister() {
    return (
      <form onSubmit={onRegister} className="space-y-4">
        <TextField icon={UserIcon} label="Full name" required autoComplete="name"
          placeholder="Your full legal name"
          value={authForm.fullName}
          onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} />
        <TextField icon={Phone} label="Mobile number" required autoComplete="tel"
          placeholder="+6797001001"
          value={authForm.mobile}
          onChange={(e) => setAuthForm({ ...authForm, mobile: e.target.value })} />
        <TextField icon={Mail} label="Email address" type="email" required autoComplete="email"
          placeholder="you@example.com"
          value={authForm.email}
          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
        <PasswordField id="regPw" label="Password" autoComplete="new-password" minLength={8}
          showPw={showPw} togglePw={togglePw}
          hint="min 8 characters"
          value={authForm.password}
          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
        <PasswordField id="regConfirm" label="Confirm password" autoComplete="new-password"
          showPw={showPw} togglePw={togglePw}
          value={authForm.confirmPassword}
          onChange={(e) => setAuthForm({ ...authForm, confirmPassword: e.target.value })} />

        <SubmitButton submitting={submitting}>Create account</SubmitButton>

        <p className="text-[11px] text-slate-600 text-center">
          By creating an account you agree to our <span className="text-navy-900 font-semibold">Terms</span> &{" "}
          <span className="text-navy-900 font-semibold">Privacy Policy</span>.
        </p>

        <div className="pt-4 border-t border-slate-200 text-center text-sm">
          <p className="text-slate-700 mb-3">Already have an account?</p>
          <button type="button" onClick={() => onAuthViewChange("login")}
            className="inline-flex items-center justify-center w-full rounded-xl border-2 border-navy-900 bg-white px-4 py-2.5 text-sm font-bold text-navy-900 hover:bg-navy-900 hover:text-white transition-colors">Sign in</button>
        </div>
      </form>
    );
  }

  function renderForgot() {
    return (
      <form onSubmit={onRequestReset} className="space-y-4">
        <TextField icon={Mail} label="Email address" type="email" required
          placeholder="you@example.com"
          value={resetForm.email}
          onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} />
        <SubmitButton submitting={submitting}>Send reset code</SubmitButton>
        <div className="pt-4 border-t border-slate-200 text-center text-sm">
          <button type="button" onClick={() => onAuthViewChange("login")}
            className="font-bold text-navy-900 underline decoration-cyan-500 decoration-2 underline-offset-4 hover:decoration-cyan-600">Back to sign in</button>
        </div>
      </form>
    );
  }

  function renderReset() {
    return (
      <form onSubmit={onResetPassword} className="space-y-4">
        <TextField icon={Mail} label="Email address" type="email" required
          value={resetForm.email}
          onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })} />
        <TextField icon={KeyRound} label="Reset ID" required
          value={resetForm.resetId}
          onChange={(e) => setResetForm({ ...resetForm, resetId: e.target.value })} />
        <TextField icon={KeyRound} label="Reset code" required
          value={resetForm.code}
          onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })} />
        <PasswordField id="resetNewPw" label="New password"
          showPw={showPw} togglePw={togglePw}
          value={resetForm.newPassword}
          onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })} />
        <PasswordField id="resetConfirm" label="Confirm new password"
          showPw={showPw} togglePw={togglePw}
          value={resetForm.confirmPassword}
          onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })} />
        <SubmitButton submitting={submitting}>Reset password</SubmitButton>
        <div className="pt-4 border-t border-slate-200 text-center text-sm">
          <button type="button" onClick={() => onAuthViewChange("login")}
            className="font-bold text-navy-900 underline decoration-cyan-500 decoration-2 underline-offset-4 hover:decoration-cyan-600">Back to sign in</button>
        </div>
      </form>
    );
  }

  return (
    <div className="min-h-screen w-full bg-canvas grid lg:grid-cols-2 font-sans">
      {/* LEFT — Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white p-10">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

        <div className="relative flex items-center gap-3">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 text-navy-950 font-extrabold shadow-glow text-lg">BF</div>
          <div>
            <p className="font-display font-bold text-xl leading-tight">Bank of Fiji</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Online Banking</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-semibold text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" /> Premium digital banking
          </span>
          <h1 className="mt-5 font-display text-4xl xl:text-5xl font-extrabold leading-tight">
            Banking that moves at the <span className="text-cyan-300">speed of life.</span>
          </h1>
          <p className="mt-4 text-slate-300 text-base">
            Manage accounts, transfer money, pay bills, invest and chat with our AI assistant —
            all from one beautifully simple dashboard.
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            {[
              { i: ShieldCheck, t: "Bank-grade encryption", s: "256-bit TLS, OTP & device alerts" },
              { i: Globe2,      t: "Pay anyone, anywhere", s: "Local, international & wallet transfers" },
              { i: Sparkles,    t: "AI-powered insights",  s: "See where your money goes each month" },
            ].map(({ i: Icon, t, s }) => (
              <li key={t} className="flex items-start gap-3">
                <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-slate-300 text-xs">{s}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-slate-300 flex items-center justify-between">
          <span>© {currentYear || new Date().getFullYear()} Bank of Fiji. All rights reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Secure connection
          </span>
        </div>
      </aside>

      {/* RIGHT — Form panel */}
      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="grid place-items-center h-11 w-11 rounded-2xl bg-gradient-to-br from-navy-900 to-cyan-600 text-white font-extrabold shadow-card">BF</div>
            <div>
              <p className="font-display font-bold text-navy-900">Bank of Fiji</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-700">Online Banking</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={authView}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-800">Bank of Fiji</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold text-navy-900">{titleByView[authView]}</h2>
              <p className="mt-2 text-slate-700 text-sm">{subtitleByView[authView]}</p>

              {authMessage && (
                <div className={[
                  "mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm",
                  isOk ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800",
                ].join(" ")}>
                  {isOk ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <span>{authMessage}</span>
                </div>
              )}
              {authHint && (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-mono text-amber-800 break-all">
                  {authHint}
                </div>
              )}

              <div className="mt-6">
                {authView === "login"    && renderLogin()}
                {authView === "register" && renderRegister()}
                {authView === "forgot"   && renderForgot()}
                {authView === "reset"    && renderReset()}
              </div>
            </motion.div>
          </AnimatePresence>

          <p className="mt-10 text-center text-[11px] text-slate-600 lg:hidden">
            © {currentYear || new Date().getFullYear()} Bank of Fiji
          </p>
        </div>
      </main>
    </div>
  );
}
