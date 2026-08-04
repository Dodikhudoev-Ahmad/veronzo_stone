import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollHeader } from '../hooks';
import { LanguageSwitcher } from '../LanguageSwitcher';
import type { LanguageCode } from '../useLanguage';
import { useT, type UIStringKey } from '../uiStrings';

const NAV_LINKS: { href: string; key: UIStringKey }[] = [
  { href: '/#about', key: 'nav.about' },
  { href: '/#catalog', key: 'nav.catalog' },
  { href: '/#portfolio', key: 'nav.portfolio' },
  { href: '/#why', key: 'nav.why' },
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
  const t = useT(language ?? 'ru');

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
              <a key={link.href} href={link.href}>{t(link.key)}</a>
            ))}
          </div>
          {onLanguageChange && language && (
            <LanguageSwitcher language={language} onChange={onLanguageChange} />
          )}
          <a href="/#contacts" className="btn btn-primary nav-cta">{t('nav.consultation')}</a>
          <button
            className="burger"
            aria-label={t('nav.menu')}
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
          <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{t(link.key)}</a>
        ))}
        <a href="/#contacts" className="mobile-menu-contacts" onClick={() => setMenuOpen(false)}>{t('nav.contacts')}</a>
      </div>
    </header>
  );
}
