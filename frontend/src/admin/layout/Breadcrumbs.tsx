import { Link, useLocation } from 'react-router-dom';

const LABELS: Record<string, string> = {
  admin: 'Админ-панель',
  categories: 'Категории',
  products: 'Товары',
  portfolio: 'Портфолио',
  gallery: 'Галерея',
  content: 'Контент',
  seo: 'SEO',
  settings: 'Настройки',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => ({
    path: `/${segments.slice(0, index + 1).join('/')}`,
    label: LABELS[segment] ?? segment,
  }));

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex items-center gap-2">
        {crumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === crumbs.length - 1 ? (
              <span className="text-text">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-accent">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
