import { NavLink } from 'react-router-dom';

// Single source of truth for admin nav items — shared by the permanent
// desktop Sidebar and the mobile MobileNavDrawer so the two never drift.
export const ADMIN_NAV_ITEMS = [
  { to: '/admin', label: 'Дашборд', end: true },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/product-attributes', label: 'Характеристики' },
  { to: '/admin/portfolio', label: 'Портфолио' },
  { to: '/admin/gallery', label: 'Галерея' },
  { to: '/admin/content', label: 'Контент' },
  { to: '/admin/seo', label: 'SEO' },
];

interface AdminNavLinksProps {
  // Called after a link is clicked — the mobile drawer uses this to close
  // itself; the desktop sidebar (always visible, nothing to close) omits it.
  onNavigate?: () => void;
}

export function AdminNavLinks({ onNavigate }: AdminNavLinksProps) {
  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `rounded-md px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light ${
              isActive ? 'bg-accent text-cream' : 'text-nav-muted hover:bg-white/10 hover:text-cream'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
