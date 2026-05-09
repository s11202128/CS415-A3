import {
  ShieldCheck, Phone, Mail, MapPin, Clock,
  Lock, BadgeCheck, Smartphone,
} from "lucide-react";

// Inline brand SVGs (lucide-react no longer ships brand glyphs)
const BrandIcon = ({ d, viewBox = "0 0 24 24", className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox} fill="currentColor" aria-hidden="true" className={className}>
    <path d={d} />
  </svg>
);
const Facebook  = (p) => <BrandIcon {...p} d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5H16.5V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V11H7.5v3h2.6v7h3.4z" />
const Twitter   = (p) => <BrandIcon {...p} d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
const Instagram = (p) => <BrandIcon {...p} d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.5s.9-.8 1.5-1c.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.2 0-3.6 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8s-.6.8-.8 1.3c-.2.4-.3 1-.4 2.1C2.6 8.4 2.6 8.8 2.6 12s0 3.6.1 4.7c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3s.8.6 1.3.8c.4.2 1 .3 2.1.4 1.1.1 1.5.1 4.7.1s3.6 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8s.6-.8.8-1.3c.2-.4.3-1 .4-2.1.1-1.1.1-1.5.1-4.7s0-3.6-.1-4.7c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3s-.8-.6-1.3-.8c-.4-.2-1-.3-2.1-.4-1.1-.1-1.5-.1-4.7-.1zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zm5.1-8.3a1.1 1.1 0 1 1 0-2.3 1.1 1.1 0 0 1 0 2.3z" />
const Linkedin  = (p) => <BrandIcon {...p} d="M20.5 2h-17A1.5 1.5 0 0 0 2 3.5v17A1.5 1.5 0 0 0 3.5 22h17a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 20.5 2zM8 19H5v-9h3v9zM6.5 8.25a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0 0 13 14.19V19h-3v-9h2.9v1.3a3.11 3.11 0 0 1 2.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
const Youtube   = (p) => <BrandIcon {...p} d="M23 7.5a3 3 0 0 0-2.1-2.1C19 5 12 5 12 5s-7 0-8.9.4A3 3 0 0 0 1 7.5C.6 9.4.6 12 .6 12s0 2.6.4 4.5A3 3 0 0 0 3.1 18.6C5 19 12 19 12 19s7 0 8.9-.4A3 3 0 0 0 23 16.5c.4-1.9.4-4.5.4-4.5s0-2.6-.4-4.5zM9.6 15.6V8.4l6.2 3.6z" />
const AppleLogo = (p) => <BrandIcon {...p} d="M16.4 12.7c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.9-1.4-.1-2.8.9-3.5.9s-1.9-.8-3.1-.8c-1.6 0-3 .9-3.9 2.4-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.4 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2.1-1.1 2.8-2.3c.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.3-3.7zM14 5.4c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />


/**
 * Premium SiteFooter — multi-column footer with brand, links, contact,
 * trust badges, social, and a fine-print legal bar. Drop-in replacement
 * for the legacy <SiteFooter /> (still accepts `currentYear`).
 */
export default function SiteFooter({ currentYear }) {
  const year = currentYear || new Date().getFullYear();

  const linkSections = [
    {
      title: "Banking",
      links: [
        { label: "Personal Banking", href: "#" },
        { label: "Business Banking", href: "#" },
        { label: "Credit Cards", href: "#" },
        { label: "Loans", href: "#" },
        { label: "Investments", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Bank of Fiji", href: "#" },
        { label: "Careers", href: "#" },
        { label: "News & Media", href: "#" },
        { label: "Sustainability", href: "#" },
        { label: "Investor Relations", href: "#" },
      ],
    },
    {
      title: "Help & Support",
      links: [
        { label: "Contact Us", href: "#" },
        { label: "Branch & ATM Locator", href: "#" },
        { label: "FAQs", href: "#" },
        { label: "Report Fraud", href: "#" },
        { label: "Accessibility", href: "#" },
      ],
    },
  ];

  const socials = [
    { Icon: Facebook,  label: "Facebook"  },
    { Icon: Twitter,   label: "Twitter"   },
    { Icon: Instagram, label: "Instagram" },
    { Icon: Linkedin,  label: "LinkedIn"  },
    { Icon: Youtube,   label: "YouTube"   },
  ];

  return (
    <footer className="relative mt-12 overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-slate-300">
      {/* decorative glows */}
      <div aria-hidden className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div aria-hidden className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

      {/* Trust strip */}
      <div className="relative border-b border-white/10">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {[
            { Icon: ShieldCheck, t: "256-bit TLS",    s: "Bank-grade encryption" },
            { Icon: BadgeCheck,  t: "RBF Regulated",  s: "Reserve Bank of Fiji" },
            { Icon: Lock,        t: "OTP Verified",   s: "Two-factor security" },
            { Icon: Clock,       t: "24/7 Support",   s: "Always here to help" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <div className="grid place-items-center h-9 w-9 rounded-xl bg-white/5 ring-1 ring-white/10">
                <Icon className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{t}</p>
                <p className="text-slate-400 truncate">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10 py-12 grid lg:grid-cols-12 gap-10">
        {/* Brand + contact */}
        <div className="lg:col-span-4 space-y-5">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 text-navy-950 font-extrabold shadow-glow text-lg">
              BF
            </div>
            <div>
              <p className="font-display font-bold text-xl text-white leading-tight">Bank of Fiji</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300/80">Online Banking</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 max-w-sm">
            Premium digital banking for the South Pacific — secure, simple, and built around the moments that matter to you.
          </p>

          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-0.5 text-cyan-300 shrink-0" />
              <div>
                <p className="text-white font-semibold">+679 132 888</p>
                <p className="text-xs text-slate-500">24/7 toll-free in Fiji</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="h-4 w-4 mt-0.5 text-cyan-300 shrink-0" />
              <div>
                <p className="text-white font-semibold">support@bof.fj</p>
                <p className="text-xs text-slate-500">Reply within 1 business day</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 text-cyan-300 shrink-0" />
              <div>
                <p className="text-white font-semibold">Suva HQ, Fiji</p>
                <p className="text-xs text-slate-500">30+ branches nationwide</p>
              </div>
            </li>
          </ul>

          {/* App badges */}
          <div className="flex gap-2 pt-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors">
              <AppleLogo className="h-4 w-4" />
              <span className="text-left leading-tight">
                <span className="block text-[9px] uppercase tracking-widest text-slate-400">Download on</span>
                App Store
              </span>
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 ring-1 ring-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors">
              <Smartphone className="h-4 w-4" />
              <span className="text-left leading-tight">
                <span className="block text-[9px] uppercase tracking-widest text-slate-400">Get it on</span>
                Google Play
              </span>
            </button>
          </div>
        </div>

        {/* Link columns */}
        {linkSections.map((sec) => (
          <div key={sec.title} className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 mb-4">
              {sec.title}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {sec.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href}
                    className="text-slate-400 hover:text-white transition-colors hover:translate-x-0.5 inline-block">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300 mb-4">
            Stay updated
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Product news, security tips & exclusive offers in your inbox.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-2">
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:bg-white/10 transition-colors"
            />
            <button type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-3 py-2.5 text-sm font-bold text-navy-950 hover:shadow-glow transition-shadow">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Legal bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10 py-5 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center lg:text-left">
            © {year} Bank of Fiji. All rights reserved.{" "}
            <span className="hidden sm:inline">Bank of Fiji is regulated by the Reserve Bank of Fiji.</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Cookie Settings</a>
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a>
          </div>

          <div className="flex items-center gap-2">
            {socials.map(({ Icon, label }) => (
              <a key={label} href="#" aria-label={label}
                className="grid place-items-center h-9 w-9 rounded-xl bg-white/5 ring-1 ring-white/10 text-slate-300 hover:text-white hover:bg-cyan-500/20 hover:ring-cyan-400/40 transition-all">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
