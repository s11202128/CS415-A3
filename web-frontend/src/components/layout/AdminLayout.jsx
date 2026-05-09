import TopHeader from "./TopHeader";
import AdminTopNav from "./AdminTopNav";
import SiteFooter from "../SiteFooter";

/**
 * AdminLayout — premium admin shell. Mirrors AppLayout (TopHeader + horizontal
 * tab strip + main + footer) but uses AdminTopNav with the admin section list.
 */
export default function AdminLayout({
  activeSection,
  onSelectSection,
  currentUser,
  notificationsCount,
  onLogout,
  children,
}) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <TopHeader
        mode="admin"
        currentUser={currentUser}
        notificationsCount={notificationsCount}
        onLogout={onLogout}
      />

      <AdminTopNav
        activeSection={activeSection}
        onSelectSection={onSelectSection}
      />

      <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1600px] w-full mx-auto">
        {children}
      </main>

      <SiteFooter currentYear={new Date().getFullYear()} />
    </div>
  );
}
