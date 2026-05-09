import { useState } from "react";
import TopNav from "./TopNav";
import TopHeader from "./TopHeader";
import SiteFooter from "../SiteFooter";

/**
 * AppLayout — premium banking shell with a top header and a horizontal
 * navigation strip mounted directly beneath it. Sidebar replaced by TopNav.
 */
export default function AppLayout({
  activeTab,
  businessSubTab,
  onSelectTab,
  onSelectBusinessSub,
  currentUser,
  isAdminUser,
  onLogout,
  onOpenAdmin,
  notificationsCount,
  children,
}) {
  function handleQuickAction(qa) {
    if (qa?.tab) onSelectTab(qa.tab);
    if (qa?.sub) onSelectBusinessSub?.(qa.sub);
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopHeader
        currentUser={currentUser}
        notificationsCount={notificationsCount}
        onQuickAction={handleQuickAction}
        isAdminUser={isAdminUser}
        onOpenAdmin={onOpenAdmin}
        onLogout={onLogout}
      />

      <TopNav
        activeTab={activeTab}
        businessSubTab={businessSubTab}
        onSelectTab={onSelectTab}
        onSelectBusinessSub={onSelectBusinessSub}
      />

      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1600px] w-full mx-auto">
        {children}
      </main>

      <SiteFooter currentYear={new Date().getFullYear()} />
    </div>
  );
}
