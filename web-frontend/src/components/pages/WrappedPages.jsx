import { ArrowLeftRight, Receipt, FileText, Landmark, UserCog } from "lucide-react";
import PageHeader from "../ui/PageHeader";
import TransfersTab from "../tabs/TransfersTab";
import BillPaymentsTab from "../tabs/BillPaymentsTab";
import StatementsTab from "../tabs/StatementsTab";
import LoansTab from "../tabs/LoansTab";
import ProfileTab from "../tabs/ProfileTab";

export function TransfersPage(props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ArrowLeftRight}
        eyebrow="Move Money"
        title="Transfers"
        description="Send money to other Bank of Fiji customers, local banks, international beneficiaries or wallets."
      />
      <section className="bof-card"><TransfersTab {...props} /></section>
    </div>
  );
}

export function BillPaymentsPage(props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Receipt}
        eyebrow="Pay & Schedule"
        title="Bill Payments"
        description="Pay bills now or schedule recurring payments to your favourite payees."
      />
      <section className="bof-card"><BillPaymentsTab {...props} /></section>
    </div>
  );
}

export function StatementsPage(props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileText}
        eyebrow="Records"
        title="Statements"
        description="Generate, view, and download statements for any of your accounts."
      />
      <section className="bof-card"><StatementsTab {...props} /></section>
    </div>
  );
}

export function LoansPage(props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Landmark}
        eyebrow="Borrow"
        title="Loans"
        description="Apply for personal, home or vehicle loans and track your existing applications."
      />
      <section className="bof-card"><LoansTab {...props} /></section>
    </div>
  );
}

export function ProfilePage(props) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        eyebrow="Account"
        title="Profile & Settings"
        description="Update your personal details, contact information, and password."
      />
      <section className="bof-card"><ProfileTab {...props} /></section>
    </div>
  );
}
