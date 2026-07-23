import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin', label: 'Дашборд', end: true },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/products', label: 'Товары' },
  { to: '/admin/portfolio', label: 'Портфолио' },
  { to: '/admin/content', label: 'Контент' },
  { to: '/admin/seo', label: 'SEO' },
  { to: '/admin/settings', label: 'Настройки' },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-dark px-5 py-8">
      <div className="mb-10 px-2 font-serif text-2xl font-semibold tracking-widest text-cream">VERONZO</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm transition ${
                isActive ? 'bg-accent text-cream' : 'text-nav-muted hover:bg-white/5 hover:text-cream'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
