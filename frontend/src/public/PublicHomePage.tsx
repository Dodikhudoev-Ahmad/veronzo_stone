import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { contentLookup, publicApi, type PublicContactInfo, type PublicSocialLink } from './api';
import { CATALOG_CARD_COPY, SOCIAL_ICON_LABEL, STONE_TYPE_CARDS } from './catalogContent';
import { findContactValue } from './contactLabels';
import { ContactForm } from './ContactForm';
import { useJsFlag, useScrollToHash } from './hooks';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { PublicImage } from './PublicImage';
import { Reveal } from './Reveal';
import { useCanonical, useDocumentTitle, useJsonLd, useOpenGraph } from './seo';
import { useT } from './uiStrings';

function useSeoMeta() {
  const { data } = useQuery({
    queryKey: ['public', 'seo-meta', 'home'],
    queryFn: () => publicApi.seoMeta('home'),
  });

  useCanonical('/');
  useDocumentTitle(data?.title);
  useOpenGraph(data ? { title: data.title, description: data.description, image: data.ogImageUrl } : undefined);
}

function useOrganizationJsonLd(contactInfo: PublicContactInfo[] | undefined, socialLinks: PublicSocialLink[] | undefined) {
  const phone = findContactValue(contactInfo, 'phone');
  const jsonLd = phone
    ? {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Veronzo',
        url: window.location.origin + '/',
        logo: new URL('/assets/images/logo-veronzo.png', window.location.origin).toString(),
        telephone: phone,
        sameAs: (socialLinks ?? []).map((l) => l.url),
      }
    : null;
  useJsonLd('org-jsonld', jsonLd);
}

export function PublicHomePage() {
  useJsFlag();
  useScrollToHash();
  useSeoMeta();

  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: publicApi.categories });
  const heroStats = useQuery({ queryKey: ['public', 'hero-stats'], queryFn: publicApi.heroStats });
  const portfolio = useQuery({ queryKey: ['public', 'portfolio'], queryFn: publicApi.portfolioItems });
  const socialLinks = useQuery({ queryKey: ['public', 'social-links'], queryFn: publicApi.socialLinks });
  const contactInfo = useQuery({ queryKey: ['public', 'contact-info'], queryFn: publicApi.contactInfo });
  const siteContent = useQuery({ queryKey: ['public', 'site-content'], queryFn: publicApi.siteContent });
  const t = contentLookup(siteContent.data);
  const ui = useT();
  useOrganizationJsonLd(contactInfo.data, socialLinks.data);

  return (
    <>
      <SiteHeader />

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
                <a href="#catalog" className="btn btn-primary">{ui('hero.ctaPrimary')}</a>
                <a href="#contacts" className="btn btn-ghost">{ui('hero.ctaSecondary')}</a>
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
                <source
                  srcSet="/assets/images/hero-black-marble-700.avif 700w, /assets/images/hero-black-marble.avif 1400w"
                  sizes="(min-width: 900px) 570px, calc(100vw - 40px)"
                  type="image/avif"
                />
                <source
                  srcSet="/assets/images/hero-black-marble-700.webp 700w, /assets/images/hero-black-marble.webp 1400w"
                  sizes="(min-width: 900px) 570px, calc(100vw - 40px)"
                  type="image/webp"
                />
                <img
                  src="/assets/images/hero-black-marble.webp"
                  alt={ui('hero.imageAlt')}
                  width={1400}
                  height={2100}
                  decoding="async"
                  fetchPriority="high"
                />
              </picture>
              <div className="hero-image-tag">{t('hero.imageTag', 'NERO MARQUINA · SIGNATURE')}</div>
            </div>
          </div>
        </section>

        <section id="catalog" className="catalog-section">
          <div className="wrap">
            <div className="section-head">
              <div className="section-head-main">
                <div className="eyebrow-label">{ui('catalog.eyebrow')}</div>
                <h2>{ui('catalog.heading')}</h2>
              </div>
              <div className="section-head-note">
                {t('catalog.sectionNote', 'Четыре направления, единый стандарт качества — от подбора материала до монтажа на объекте.')}
              </div>
            </div>

            {categories.isLoading && <p className="state-message">{ui('loading')}</p>}

            {categories.isSuccess && categories.data.filter((c) => CATALOG_CARD_COPY[c.slug]).length === 0 && (
              <p className="state-message">{ui('catalog.unavailable')}</p>
            )}

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
                        <span className="card-arrow" aria-hidden="true">→</span>
                      </Link>
                    </Reveal>
                  );
                })}
            </div>
          </div>
        </section>

        <section id="stones" className="stones-section">
          <div className="stones-grid">
            <div className="stones-info">
              <h2>{ui('stones.heading')}</h2>
              <p>{ui('stones.description')}</p>
              <Link to="/catalog/stone" className="btn stones-cta">{ui('stones.cta')}</Link>
            </div>
            <div className="stones-cards">
              {STONE_TYPE_CARDS.map((card) => (
                <Reveal className="stone-card" key={card.title}>
                  <Link to="/catalog/stone" className="stone-card-link" aria-label={card.title}>
                    <picture>
                      <source srcSet={`${card.imageBase}.avif`} type="image/avif" />
                      <img
                        src={`${card.imageBase}.webp`}
                        alt={card.imageAlt}
                        width={card.width}
                        height={card.height}
                        loading="lazy"
                        decoding="async"
                      />
                    </picture>
                    <div className="stone-card-body">
                      <h3>{card.title}</h3>
                      <p>{card.description}</p>
                    </div>
                    <span className="stone-card-arrow" aria-hidden="true">↗</span>
                  </Link>
                </Reveal>
              ))}
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
                  alt={ui('about.imageAlt')}
                  width={1000}
                  height={527}
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </Reveal>
            <Reveal>
              <div className="eyebrow-label">{ui('about.eyebrow')}</div>
              <h2>{t('about.heading', 'Одно ателье — от карьера до сданного объекта')}</h2>
              <p>
                {t(
                  'about.paragraph1',
                  'Мы объединяем четыре компетенции, которые обычно приходится собирать у разных подрядчиков: добычу и обработку натурального камня, столярное производство элитных дверей, оконные системы и инженерию лифтовых решений. Единый технадзор исключает стыковочные ошибки на объекте.',
                )}
              </p>
              <p>{t('about.paragraph2', 'С проектом работает выделенная команда: архитектор проекта, технолог по камню и инженер. Мы говорим на языке чертежей и спецификаций.')}</p>
              <div className="tag-list">
                <span className="tag">{ui('about.tag1')}</span>
                <span className="tag">{ui('about.tag2')}</span>
                <span className="tag">{ui('about.tag3')}</span>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="portfolio" className="portfolio-section">
          <div className="wrap">
            <div className="eyebrow-label">{ui('portfolio.eyebrow')}</div>
            <h2 className="portfolio-title">{ui('portfolio.heading')}</h2>

            {portfolio.isLoading && <p className="state-message">{ui('loading')}</p>}

            {portfolio.isError && (
              <p className="state-message state-message-error">{ui('portfolio.loadError')}</p>
            )}

            {portfolio.isSuccess && portfolio.data.length === 0 && (
              <p className="state-message">{ui('portfolio.empty')}</p>
            )}

            <div className="pf">
              {(portfolio.data ?? []).map((item) => (
                <Reveal
                  className={item.isFeatured ? 'pf-card pf-card-lg' : 'pf-card'}
                  key={item.id}
                >
                  <PublicImage
                    src={item.imageUrl}
                    alt={item.title}
                    width={item.isFeatured ? 1200 : 800}
                    height={item.isFeatured ? 799 : 600}
                  />
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
              <div className="eyebrow-label">{ui('why.eyebrow')}</div>
              <h2>{t('why.heading', 'Партнёр, на которого можно опереться в проекте')}</h2>
            </div>
            <div className="why2">
              {([
                { num: '01', title: ui('why.card1.title'), text: ui('why.card1.text') },
                { num: '02', title: ui('why.card2.title'), text: ui('why.card2.text') },
                { num: '03', title: ui('why.card3.title'), text: ui('why.card3.text') },
                { num: '04', title: ui('why.card4.title'), text: ui('why.card4.text') },
              ]).map((card) => (
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
              <div className="eyebrow-label eyebrow-label-dark">{ui('contacts.eyebrow')}</div>
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
                    aria-label={ui('contacts.socialAria', { platform: SOCIAL_ICON_LABEL[link.platform] ?? link.platform })}
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
