import { BellRing, ShieldAlert, CreditCard, FileText, Mail, CheckCheck } from "lucide-react";
import { useState } from "react";
import PageHeader from "../ui/PageHeader";

const SAMPLE = [
  { id: 1, type: "security", icon: ShieldAlert, title: "New device sign-in", body: "Web browser · Suva, Fiji · just now", time: "now", unread: true, color: "rose" },
  { id: 2, type: "payment",  icon: CreditCard,  title: "Card payment due",  body: "Bank of Fiji Visa · FJ$0.00 due in 18 days", time: "1h", unread: true,  color: "amber" },
  { id: 3, type: "transaction", icon: FileText, title: "Statement available", body: "Your November eStatement is ready to download", time: "1d", unread: false, color: "navy" },
  { id: 4, type: "message",  icon: Mail,        title: "Welcome to Bank of Fiji", body: "Get started with our digital banking guide", time: "3d", unread: false, color: "cyan" },
];

const TONE = {
  rose:  "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  navy:  "bg-navy-50 text-navy-700",
  cyan:  "bg-cyan-50 text-cyan-700",
};

export default function AlertsPage({ notifications = [] }) {
  const live = (notifications || []).map((n, i) => ({
    id: `live-${i}`,
    type: "transaction",
    icon: BellRing,
    title: n.title || n.subject || "Notification",
    body: n.message || n.body || "",
    time: n.createdAt ? new Date(n.createdAt).toLocaleString("en-FJ", { dateStyle: "short", timeStyle: "short" }) : "",
    unread: !n.read,
    color: "navy",
  }));

  const all = [...live, ...SAMPLE];
  const [items, setItems] = useState(all);
  const unreadCount = items.filter((i) => i.unread).length;

  function markAllRead() { setItems((prev) => prev.map((i) => ({ ...i, unread: false }))); }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BellRing}
        eyebrow="Inbox"
        title="Alerts & Messages"
        description="Security notices, payment reminders, transaction alerts and bank messages."
        actions={
          <button onClick={markAllRead} className="rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-semibold text-white inline-flex items-center gap-1.5">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      <div className="bof-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-navy-900">
            All notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs font-bold bg-rose-100 text-rose-700 rounded-full px-2 py-0.5">
                {unreadCount} unread
              </span>
            )}
          </h3>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600 py-12 text-center">You're all caught up.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li
                key={n.id}
                className={["flex items-start gap-3 py-3 px-2 -mx-2 rounded-xl transition-colors", n.unread ? "bg-cyan-50/40 hover:bg-cyan-50/70" : "hover:bg-slate-50"].join(" ")}
              >
                <div className={["grid place-items-center h-10 w-10 rounded-xl shrink-0", TONE[n.color] || TONE.navy].join(" ")}>
                  <n.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-navy-900 truncate">{n.title}</p>
                    <span className="text-[11px] text-slate-600 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-sm text-slate-600">{n.body}</p>
                </div>
                {n.unread && <span className="h-2 w-2 rounded-full bg-cyan-500 mt-2 shrink-0" />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
