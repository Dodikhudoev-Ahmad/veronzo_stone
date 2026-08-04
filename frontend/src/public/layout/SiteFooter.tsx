import { useQuery } from '@tanstack/react-query';
import { contentLookup, publicApi } from '../api';
import { findContactValue } from '../contactLabels';
import type { LanguageCode } from '../useLanguage';
import { useT } from '../uiStrings';

interface SiteFooterProps {
  language: LanguageCode;
}

// Shares react-query's cache with the homepage/contacts-info queries (same
// queryKey), so visiting a catalog page doesn't refetch data already loaded.
// `language` comes from the parent page (matching SiteHeader's own prop) --
// calling useLanguage() independently here would give this component its own
// localStorage-read-once copy that never re-renders when the header's
// switcher changes it elsewhere (found via Stage 24 testing: the footer
// silently stayed in whatever language was active on first mount).
export function SiteFooter({ language }: SiteFooterProps) {
  const contactInfo = useQuery({
    queryKey: ['public', 'contact-info', language],
    queryFn: () => publicApi.contactInfo(language),
  });
  const siteContent = useQuery({
    queryKey: ['public', 'site-content', language],
    queryFn: () => publicApi.siteContent(language),
  });
  const t = contentLookup(siteContent.data);
  const ui = useT(language);

  const phone = findContactValue(contactInfo.data, 'phone', language);
  const email = findContactValue(contactInfo.data, 'email', language);

  return (
    <footer className="site-footer">
      <div className="footer-top wrap">
        <div>
          <div className="footer-logo">
            <img src="/assets/images/logo-veronzo-white.png" alt="VERONZO" />
          </div>
          <div className="footer-tagline">
            {t('footer.tagline', 'Натуральный камень, элитные двери и лифтовые решения для архитектуры высшего уровня.')}
          </div>
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <a href="/#about">{ui('about.eyebrow')}</a>
            <a href="/#catalog">{ui('nav.catalog')}</a>
            <a href="/#portfolio">{ui('nav.portfolio')}</a>
          </div>
          <div className="footer-col footer-col-muted">
            <a href="/#contacts">{ui('nav.contacts')}</a>
            {phone && <span>{phone}</span>}
            {email && <span>{email}</span>}
          </div>
        </div>
      </div>
      <div className="footer-bottom wrap">© {new Date().getFullYear()} Veronzo. {ui('footer.rights')}</div>
    </footer>
  );
}
