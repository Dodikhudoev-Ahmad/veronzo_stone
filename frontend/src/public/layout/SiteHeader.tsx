import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollHeader } from '../hooks';
import { LanguageSwitcher } from '../LanguageSwitcher';
import type { LanguageCode } from '../useLanguage';

const NAV_LINKS = [
  { href: '/#about', label: 'О компании' },
  { href: '/#catalog', label: 'Каталог' },
  { href: '/#portfolio', label: 'Портфолио' },
  { href: '/#why', label: 'Почему мы' },
];

interface SiteHeaderProps {
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
}

// Shared across the homepage and the catalog pages — anchors always point
// back to "/#section" so navigating from a catalog page returns to the
// right homepage section instead of scrolling nowhere.
export function SiteHeader({ language, onLanguageChange }: SiteHeaderProps) {
  const headerRef = useScrollHeader<HTMLElement>();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
  }, [menuOpen]);

  return (
    <header className="site-header" ref={headerRef}>
      <nav className="nav">
        <Link to="/#top" className="logo">
          <img src="/assets/images/logo-veronzo-white.png" alt="VERONZO" />
        </Link>
        <div className="nav-right">
          <div className="nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
          {onLanguageChange && language && (
            <LanguageSwitcher language={language} onChange={onLanguageChange} />
          )}
          <a href="/#contacts" className="btn btn-primary nav-cta">Консультация</a>
          <button
            className="burger"
            aria-label="Меню"
            aria-expanded={menuOpen}
            aria-controls="mobileMenu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>
      <div className="mobile-menu" id="mobileMenu" hidden={!menuOpen}>
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</a>
        ))}
        <a href="/#contacts" className="mobile-menu-contacts" onClick={() => setMenuOpen(false)}>Контакты</a>
      </div>
    </header>
  );
}
