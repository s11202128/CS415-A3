import { LifeBuoy, MessageCircle, Phone, Mail, MapPin, FileQuestion, ShieldCheck } from "lucide-react";
import PageHeader from "../ui/PageHeader";

const FAQS = [
  { q: "How do I reset my password?", a: "Use the Profile & Settings tab to update your password. You'll need your current password to confirm." },
  { q: "What is the daily transfer limit?", a: "Customers have a default daily transfer limit of FJ$2,000. High-value transfers require an OTP." },
  { q: "How do I report a lost card?", a: "Freeze your card immediately from the Credit Cards page, then call 24/7 support on 132 888." },
  { q: "When are statements available?", a: "eStatements are generated on the 1st of each month and emailed to your registered address." },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={LifeBuoy}
        eyebrow="We're here to help"
        title="Support Center"
        description="Get in touch with our team or browse common questions. Available 24/7 for security incidents."
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bof-card text-center">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-emerald-500 text-white mx-auto mb-3">
            <Phone className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Call us</p>
          <p className="mt-1 text-lg font-bold text-navy-900">132 888</p>
          <p className="text-xs text-slate-500">24/7 · Toll-free in Fiji</p>
        </div>

        <div className="bof-card text-center">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-cyan-500 text-white mx-auto mb-3">
            <MessageCircle className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Chat with us</p>
          <p className="mt-1 text-lg font-bold text-navy-900">Live chat</p>
          <p className="text-xs text-slate-500">Use the chat bubble at the bottom</p>
        </div>

        <div className="bof-card text-center">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-navy-900 text-white mx-auto mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Email</p>
          <p className="mt-1 text-lg font-bold text-navy-900">support@bof.fj</p>
          <p className="text-xs text-slate-500">Response within 1 business day</p>
        </div>
      </div>

      <section className="grid lg:grid-cols-[2fr,1fr] gap-4">
        <div className="bof-card">
          <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-cyan-600" /> Frequently asked questions
          </h3>
          <div className="divide-y divide-slate-100">
            {FAQS.map((f) => (
              <details key={f.q} className="py-3 group">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-2 font-semibold text-navy-900 hover:text-cyan-700">
                  {f.q}
                  <span className="text-cyan-600 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bof-card">
            <h3 className="font-bold text-navy-900 mb-2 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-500" /> Find a branch
            </h3>
            <p className="text-sm text-slate-600">Over 30 branches across Fiji and Pacific.</p>
            <button className="bof-btn bof-btn-primary mt-3 w-full">Branch locator</button>
          </div>

          <div className="bof-card bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
            <ShieldCheck className="h-6 w-6 mb-2" />
            <h3 className="font-bold">Security incident?</h3>
            <p className="text-sm text-emerald-50/90 mt-1">
              If you suspect fraud or unauthorized access, freeze your card immediately and call us on
              <strong> 132 888</strong>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
