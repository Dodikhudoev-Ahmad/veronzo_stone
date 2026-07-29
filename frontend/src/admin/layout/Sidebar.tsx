import { AdminNavLinks } from './AdminNavLinks';

// Permanent on desktop (>=1024px); hidden below that in favor of
// MobileNavDrawer, which renders the same AdminNavLinks so items and their
// styling never duplicate/drift between the two.
export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-dark px-5 py-8 lg:flex">
      <div className="mb-10 px-2">
        <img src="/assets/images/logo-veronzo-white.png" alt="VERONZO" className="h-5 w-auto" />
      </div>
      <AdminNavLinks />
    </aside>
  );
}
