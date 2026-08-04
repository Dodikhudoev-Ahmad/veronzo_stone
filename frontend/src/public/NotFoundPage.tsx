import { Link } from 'react-router-dom';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { useLanguage } from './useLanguage';
import { useDocumentTitle, useRobotsNoIndex } from './seo';
import { useT } from './uiStrings';

// A client-rendered SPA can't send a real HTTP 404 status, so the two things
// that actually matter here are: tell a human clearly (rather than the old
// silent redirect-to-home, which looked like a broken link click), and tell
// crawlers not to index this URL via a noindex robots meta tag.
export function NotFoundPage() {
  const { language, setLanguage } = useLanguage();
  const ui = useT(language);
  useDocumentTitle('Страница не найдена — Veronzo');
  useRobotsNoIndex();

  return (
    <>
      <SiteHeader language={language} onLanguageChange={setLanguage} />
      <main className="catalog-page wrap page-enter">
        <div className="state-message not-found-message">
          <p className="not-found-code">404</p>
          <p>{ui('notfound.message')}</p>
          <Link to="/" className="btn btn-primary state-retry">{ui('notfound.cta')}</Link>
        </div>
      </main>
      <SiteFooter language={language} />
    </>
  );
}
