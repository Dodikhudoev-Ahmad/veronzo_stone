import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { contentLookup, publicApi, type PublicContactInfo, type PublicSocialLink } from './api';
import { CATALOG_CARD_COPY, SOCIAL_ICON_LABEL } from './catalogContent';
import { ContactForm } from './ContactForm';
import { useJsFlag, useReveal } from './hooks';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { useLanguage } from './useLanguage';
import { useCanonical, useJsonLd } from './seo';

function useSeoMeta() {
  const { data } = useQuery({ queryKey: ['public', 'seo-meta', 'home'], queryFn: () => publicApi.seoMeta('home') });

  useCanonical('/');

  useEffect(() => {
    if (!data) return;
    document.title = data.title;
    const setMeta = (selector: string, content: string) => {
      const el = document.head.querySelector<HTMLMetaElement>(selector);
      if (el) el.content = content;
    };
    if (data.description) {
      setMeta('meta[name="description"]', data.description);
      setMeta('meta[property="og:description"]', data.description);
    }
    setMeta('meta[property="og:title"]', data.title);
    if (data.ogImageUrl) setMeta('meta[property="og:image"]', data.ogImageUrl);
  }, [data]);
}

function useOrganizationJsonLd(contactInfo: PublicContactInfo[] | undefined, socialLinks: PublicSocialLink[] | undefined) {
  const phone = contactInfo?.find((c) => c.label === 'Телефон')?.value;
  const jsonLd = phone
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Veronzo',
        url: 'https://veronzotj.netlify.app/',
        logo: 'https://veronzotj.netlify.app/assets/images/logo-veronzo.png',
        telephone: phone,
        sameAs: (socialLinks ?? []).map((l) => l.url),
      }
    : null;
  useJsonLd('org-jsonld', jsonLd);
}

// Renders a <div> regardless of the original markup's element (article/div) —
// styles.css targets these purely by class, never by tag, so this doesn't
// change appearance, only slightly reduces semantics vs. the original <article>.
function Reveal({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className={className}>{children}</div>;
}

export function PublicHomePage() {
  useJsFlag();
  useSeoMeta();
  const { language, setLanguage } = useLanguage();

  const categories = useQuery({
    queryKey: ['public', 'categories', language],
    queryFn: () => publicApi.categories(language),
  });
  const heroStats = useQuery({ queryKey: ['public', 'hero-stats'], queryFn: publicApi.heroStats });
  const portfolio = useQuery({ queryKey: ['public', 'portfolio'], queryFn: publicApi.portfolioItems });
  const socialLinks = useQuery({ queryKey: ['public', 'social-links'], queryFn: publicApi.socialLinks });
  const contactInfo = useQuery({ queryKey: ['public', 'contact-info'], queryFn: publicApi.contactInfo });
  const siteContent = useQuery({ queryKey: ['public', 'site-content'], queryFn: publicApi.siteContent });
  const t = contentLookup(siteContent.data);
  useOrganizationJsonLd(contactInfo.data, socialLinks.data);

  return (
    <>
      <SiteHeader language={language} onLanguageChange={setLanguage} />

      <main>
        <section id="top" className="hero-section">
          <div className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /><span>{t('hero.eyebrow', 'Ателье премиум-отделки')}</span></div>
              <h1>{t('hero.title', 'Материя выдающихся интерьеров')}</h1>
              <p className="lede">
                {t('hero.lede', 'Натуральный камень, элитные двери и лифтовые решения под единым технадзором — для архитекторов, дизайнеров и премиум-застройщиков.')}
              </p>
              <div className="hero-actions">
                <a href="#catalog" className="btn btn-primary">Смотреть каталог</a>
                <a href="#contacts" className="btn btn-ghost">Заявка на консультацию</a>
              </div>
              <div className="hero-stats">
                {(heroStats.data ?? []).map((stat) => (
                  <div className="stat" key={stat.id}>
                    <div className="stat-num">{stat.value}{stat.suffix && <span className="accent">{stat.suffix}</span>}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-image">
              <picture>
                <source srcSet="/assets/images/hero-calacatta.avif" type="image/avif" />
                <img
                  src="/assets/images/hero-calacatta.webp"
                  alt="Мраморный интерьер Calacatta"
                  width={1400}
                  height={2100}
                  decoding="async"
                  fetchPriority="high"
                />
              </picture>
              <div className="hero-image-tag">{t('hero.imageTag', 'CALACATTA · SIGNATURE')}</div>
            </div>
          </div>
        </section>

        <section id="catalog" className="catalog-section">
          <div className="wrap">
            <div className="section-head">
              <div className="section-head-main">
                <div className="eyebrow-label">Каталог</div>
                <h2>Материалы и инженерные решения в одной системе</h2>
              </div>
              <div className="section-head-note">
                {t('catalog.sectionNote', 'Четыре направления, единый стандарт качества — от подбора материала до монтажа на объекте.')}
              </div>
            </div>

            <div className="cat3" role="tabpanel">
              {(categories.data ?? [])
                .filter((c) => CATALOG_CARD_COPY[c.slug])
                .map((category) => {
                  const copy = CATALOG_CARD_COPY[category.slug];
                  return (
                    <Reveal className="cat-card" key={category.id}>
                      <Link to={`/catalog/${category.slug}`} className="cat-card-link" aria-label={category.name}>
                        <picture>
                          <source srcSet={`${copy.imageBase}.avif`} type="image/avif" />
                          <img
                            src={`${copy.imageBase}.webp`}
                            alt={copy.imageAlt}
                            width={copy.width}
                            height={copy.height}
                            loading="lazy"
                            decoding="async"
                          />
                        </picture>
                        <div className="cat-card-scrim" />
                        <div className="cat-card-index">{copy.index}</div>
                        <div className="cat-card-body">
                          <h3>{category.name}</h3>
                          <p>{copy.description}</p>
                          <span className="cat-card-more">{copy.cta}</span>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="about wrap">
            <Reveal className="about-image">
              <picture>
                <source srcSet="/assets/images/about-workshop.avif" type="image/avif" />
                <img
                  src="/assets/images/about-workshop.webp"
                  alt="Мастерская обработки камня"
                  width={1000}
                  height={527}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </Reveal>
            <Reveal>
              <div className="eyebrow-label">О компании</div>
              <h2>{t('about.heading', 'Одно ателье — от карьера до сданного объекта')}</h2>
              <p>
                {t(
                  'about.paragraph1',
                  'Мы объединяем четыре компетенции, которые обычно приходится собирать у разных подрядчиков: добычу и обработку натурального камня, столярное производство элитных дверей, оконные системы и инженерию лифтовых решений. Единый технадзор исключает стыковочные ошибки на объекте.',
                )}
              </p>
              <p>{t('about.paragraph2', 'С проектом работает выделенная команда: архитектор проекта, технолог по камню и инженер. Мы говорим на языке чертежей и спецификаций.')}</p>
              <div className="tag-list">
                <span className="tag">Проектирование и BIM</span>
                <span className="tag">Собственное производство</span>
                <span className="tag">Монтаж и шеф-надзор</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="portfolio" className="portfolio-section">
          <div className="wrap">
            <div className="eyebrow-label">Портфолио</div>
            <h2 className="portfolio-title">Объекты, которыми мы гордимся</h2>
            <div className="pf">
              {(portfolio.data ?? []).map((item) => (
                <Reveal
                  className={item.isFeatured ? 'pf-card pf-card-lg' : 'pf-card'}
                  key={item.id}
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      width={item.isFeatured ? 1200 : 800}
                      height={item.isFeatured ? 799 : 600}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="pf-scrim" />
                  {item.isFeatured && item.categoryTag && <div className="pf-tag">{item.categoryTag}</div>}
                  <div className={item.isFeatured ? 'pf-body' : 'pf-body pf-body-sm'}>
                    <div className={item.isFeatured ? 'pf-name' : 'pf-name pf-name-sm'}>{item.title}</div>
                    {item.meta && <div className={item.isFeatured ? 'pf-meta' : 'pf-meta pf-meta-sm'}>{item.meta}</div>}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="why" className="why-section">
          <div className="wrap">
            <div className="section-head-main why-head">
              <div className="eyebrow-label">Почему мы</div>
              <h2>{t('why.heading', 'Партнёр, на которого можно опереться в проекте')}</h2>
            </div>
            <div className="why2">
              {[
                { num: '01', title: 'Единый подрядчик', text: 'Камень, двери и лифты в одном контракте — без стыковочных ошибок между бригадами разных компаний.' },
                { num: '02', title: 'Язык проекта', text: 'Работаем с чертежами, BIM-моделями и спецификациями. Понимаем архитектора и дизайнера с полуслова.' },
                { num: '03', title: 'Собственное производство', text: 'Контролируем качество и сроки на каждом этапе — от раскроя слэба до финального монтажа на объекте.' },
                { num: '04', title: 'Премиум-исполнение', text: 'Ателье-подход и внимание к деталям на уровне частных резиденций и клубных домов.' },
              ].map((card) => (
                <Reveal className="why-card" key={card.num}>
                  <div className="why-num">{card.num}</div>
                  <div className="why-title">{card.title}</div>
                  <div className="why-text">{card.text}</div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="contacts" className="contacts-section">
          <div className="contacts wrap">
            <div className="contacts-info">
              <div className="footer-logo contact-logo">
                <img src="/assets/images/logo-veronzo-white.png" alt="VERONZO" />
              </div>
              <div className="contact-symbol" aria-hidden="true">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="6" width="20" height="4" fill="currentColor" />
                  <rect x="4" y="12" width="20" height="4" fill="currentColor" />
                  <rect x="4" y="18" width="20" height="4" fill="currentColor" />
                </svg>
              </div>
              <div className="eyebrow-label eyebrow-label-dark">Контакты</div>
              <h2>{t('contacts.heading', 'Обсудим ваш проект')}</h2>
              <p>{t('contacts.paragraph', 'Оставьте заявку — архитектор проекта свяжется с вами в течение рабочего дня, чтобы обсудить материалы, сроки и смету.')}</p>

              <div className="contact-socials">
                {(socialLinks.data ?? []).map((link) => (
                  <a
                    key={link.platform}
                    className="contact-social"
                    data-platform={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Открыть ${SOCIAL_ICON_LABEL[link.platform] ?? link.platform}`}
                  >
                    <span>{SOCIAL_ICON_LABEL[link.platform] ?? link.platform}</span>
                  </a>
                ))}
              </div>

              <div className="contacts-details">
                {(contactInfo.data ?? []).map((info) => (
                  <div key={info.label}>
                    <div className="contacts-details-label">{info.label}</div>
                    <div className="contacts-details-value">{info.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="contacts-form-wrap">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
