import { useQuery } from '@tanstack/react-query';
import { contentLookup, publicApi } from '../api';

// Shares react-query's cache with the homepage/contacts-info queries (same
// queryKey), so visiting a catalog page doesn't refetch data already loaded.
export function SiteFooter() {
  const contactInfo = useQuery({ queryKey: ['public', 'contact-info'], queryFn: publicApi.contactInfo });
  const siteContent = useQuery({ queryKey: ['public', 'site-content'], queryFn: publicApi.siteContent });
  const t = contentLookup(siteContent.data);

  const phone = contactInfo.data?.find((c) => c.label === 'Телефон')?.value;
  const email = contactInfo.data?.find((c) => c.label === 'Почта')?.value;

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
            <a href="/#about">О компании</a>
            <a href="/#catalog">Каталог</a>
            <a href="/#portfolio">Портфолио</a>
          </div>
          <div className="footer-col footer-col-muted">
            <a href="/#contacts">Контакты</a>
            {phone && <span>{phone}</span>}
            {email && <span>{email}</span>}
          </div>
        </div>
      </div>
      <div className="footer-bottom wrap">© {new Date().getFullYear()} Veronzo. Все права защищены.</div>
    </footer>
  );
}
