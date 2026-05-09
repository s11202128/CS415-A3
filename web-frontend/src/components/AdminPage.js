import { useState } from "react";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminCustomersTab from "./admin/AdminCustomersTab";
import AdminAccountsTab from "./admin/AdminAccountsTab";
import AdminDepositsTab from "./admin/AdminDepositsTab";
import AdminLoansTab from "./admin/AdminLoansTab";
import AdminMonitoringTab from "./admin/AdminMonitoringTab";
import AdminAccountLabTab from "./admin/AdminAccountLabTab";
import AdminNetIncomeTab from "./admin/AdminNetIncomeTab";
import AdminChatbotTab from "./admin/AdminChatbotTab";
import ComplianceTab from "./tabs/ComplianceTab";
import AdminLayout from "./layout/AdminLayout";
import PageHeader from "./ui/PageHeader";
import { ADMIN_NAV_ITEMS } from "./layout/adminNavItems";

const SECTION_META = {
  Overview:     { eyebrow: "Operations",  description: "Live KPIs, deposits, and customer activity at a glance." },
  Customers:    { eyebrow: "Directory",   description: "Search, edit, and manage every customer record." },
  Accounts:     { eyebrow: "Accounts",    description: "Open, freeze, and update customer accounts." },
  Deposits:     { eyebrow: "Cash Ops",    description: "Post manual deposits and review balance impacts." },
  Loans:        { eyebrow: "Lending",     description: "Approve, reject, or update loan applications." },
  Business:     { eyebrow: "Business",    description: "Tools for the business banking workspace." },
  "Net Income": { eyebrow: "Finance",     description: "Year-over-year net income and revenue summary." },
  Chatbot:      { eyebrow: "Support",     description: "Manage the AI assistant configuration and history." },
  Monitoring:   { eyebrow: "Compliance",  description: "Transaction logs, transfer limits, and notification controls." },
  Compliance:   { eyebrow: "Governance",  description: "Interest rates, year-end summaries, and policy controls." },
};

export default function AdminPage({
  customers,
  accounts,
  transactions,
  scheduledBills,
  loanApplications,
  summaries,
  selectedAccountForTx,
  setSelectedAccountForTx,
  adminAccountForm,
  setAdminAccountForm,
  onCreateAdminAccount,
  adminAccountMessage,
  adminDepositForm,
  setAdminDepositForm,
  onAdminDeposit,
  adminDepositMessage,
  setAdminDepositMessage,
  adminMessage,
  onAdminUpdateCustomer,
  onAdminUpdateAccount,
  onAdminFreezeAccount,
  onAdminUpdateLoanStatus,
  adminTransferLimit,
  setAdminTransferLimit,
  onAdminUpdateTransferLimit,
  onAdminReverseTransaction,
  adminLoginLogs,
  adminNotificationLogs,
  adminNotificationPreferences,
  onAdminToggleNotificationPreference,
  adminReport,
  adminLastUpdated,
  interestRate,
  setInterestRate,
  onUpdateRate,
  summaryYear,
  setSummaryYear,
  onGenerateSummaries,
  complianceMessage,
  authToken,
  currentUser,
  notificationsCount,
  onLogout,
}) {
  const [activeSection, setActiveSection] = useState("Overview");
  const meta = SECTION_META[activeSection] || {};
  const navItem = ADMIN_NAV_ITEMS.find((i) => i.id === activeSection);
  const Icon = navItem?.icon;

  return (
    <AdminLayout
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      currentUser={currentUser}
      notificationsCount={notificationsCount}
      onLogout={onLogout}
    >
      <PageHeader
        icon={Icon}
        eyebrow={meta.eyebrow}
        title={activeSection}
        description={meta.description}
      />

      <section className="bof-card">
        {activeSection === "Overview" && (
          <AdminOverviewTab
            customers={customers}
            accounts={accounts}
            transactions={transactions}
            loanApplications={loanApplications}
            adminReport={adminReport}
            adminLastUpdated={adminLastUpdated}
            adminMessage={adminMessage}
          />
        )}
        {activeSection === "Customers" && (
          <AdminCustomersTab
            customers={customers}
            accounts={accounts}
            onAdminUpdateCustomer={onAdminUpdateCustomer}
          />
        )}
        {activeSection === "Accounts" && (
          <AdminAccountsTab
            accounts={accounts}
            adminAccountForm={adminAccountForm}
            setAdminAccountForm={setAdminAccountForm}
            onCreateAdminAccount={onCreateAdminAccount}
            adminAccountMessage={adminAccountMessage}
            onAdminUpdateAccount={onAdminUpdateAccount}
            onAdminFreezeAccount={onAdminFreezeAccount}
          />
        )}
        {activeSection === "Deposits" && (
          <AdminDepositsTab
            accounts={accounts}
            adminDepositForm={adminDepositForm}
            setAdminDepositForm={setAdminDepositForm}
            onAdminDeposit={onAdminDeposit}
            adminDepositMessage={adminDepositMessage}
            setAdminDepositMessage={setAdminDepositMessage}
          />
        )}
        {activeSection === "Loans" && (
          <AdminLoansTab
            loanApplications={loanApplications}
            onAdminUpdateLoanStatus={onAdminUpdateLoanStatus}
          />
        )}
        {activeSection === "Business" && <AdminAccountLabTab />}
        {activeSection === "Net Income" && <AdminNetIncomeTab authToken={authToken} />}
        {activeSection === "Chatbot" && <AdminChatbotTab authToken={authToken} />}
        {activeSection === "Monitoring" && (
          <AdminMonitoringTab
            accounts={accounts}
            transactions={transactions}
            selectedAccountForTx={selectedAccountForTx}
            setSelectedAccountForTx={setSelectedAccountForTx}
            adminTransferLimit={adminTransferLimit}
            setAdminTransferLimit={setAdminTransferLimit}
            onAdminUpdateTransferLimit={onAdminUpdateTransferLimit}
            onAdminReverseTransaction={onAdminReverseTransaction}
            adminLoginLogs={adminLoginLogs}
            adminNotificationLogs={adminNotificationLogs}
            adminNotificationPreferences={adminNotificationPreferences}
            onAdminToggleNotificationPreference={onAdminToggleNotificationPreference}
          />
        )}
        {activeSection === "Compliance" && (
          <ComplianceTab
            interestRate={interestRate}
            setInterestRate={setInterestRate}
            onUpdateRate={onUpdateRate}
            summaryYear={summaryYear}
            setSummaryYear={setSummaryYear}
            onGenerateSummaries={onGenerateSummaries}
            summaries={summaries}
            complianceMessage={complianceMessage}
          />
        )}
      </section>
    </AdminLayout>
  );
}
