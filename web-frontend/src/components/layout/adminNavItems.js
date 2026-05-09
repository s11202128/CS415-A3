import {
  LayoutDashboard,
  Users,
  Wallet,
  PiggyBank,
  Landmark,
  Briefcase,
  TrendingUp,
  Bot,
  Activity,
  ShieldCheck,
} from "lucide-react";

/**
 * Single source of truth for admin section list + icons.
 * Order here drives the inline tab order in AdminTopNav.
 */
export const ADMIN_NAV_ITEMS = [
  { id: "Overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "Customers",  label: "Customers",  icon: Users },
  { id: "Accounts",   label: "Accounts",   icon: Wallet },
  { id: "Deposits",   label: "Deposits",   icon: PiggyBank },
  { id: "Loans",      label: "Loans",      icon: Landmark },
  { id: "Business",   label: "Business",   icon: Briefcase },
  { id: "Net Income", label: "Net Income", icon: TrendingUp },
  { id: "Chatbot",    label: "Chatbot",    icon: Bot },
  { id: "Monitoring", label: "Monitoring", icon: Activity },
  { id: "Compliance", label: "Compliance", icon: ShieldCheck },
];

export const ADMIN_SECTIONS = ADMIN_NAV_ITEMS.map((i) => i.id);
