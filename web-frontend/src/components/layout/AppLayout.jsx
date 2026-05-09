import { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import SiteFooter from "../SiteFooter";

/**
 * AppLayout — premium banking shell with fixed sidebar and top header.
 * Wraps all customer-side tabs while preserving existing component content.
 */
export default function AppLayout({
  activeTab,
  onSelectTab,
  onSelectBusinessSub,
  currentUser,
  isAdminUser,
  onLogout,
  onOpenAdmin,
  notificationsCount,
  children,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleQuickAction(qa) {
    if (qa?.tab) onSelectTab(qa.tab);
    if (qa?.sub) onSelectBusinessSub?.(qa.sub);
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onSelectBusinessSub={onSelectBusinessSub}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          currentUser={currentUser}
          notificationsCount={notificationsCount}
          onOpenMobileNav={() => setMobileOpen(true)}
          onQuickAction={handleQuickAction}
          isAdminUser={isAdminUser}
          onOpenAdmin={onOpenAdmin}
        />

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        <SiteFooter currentYear={new Date().getFullYear()} />
      </div>
    </div>
  );
}
