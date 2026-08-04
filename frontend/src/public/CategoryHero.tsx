import { CATALOG_CARD_COPY } from './catalogContent';
import type { LanguageCode } from './useLanguage';
import { useT } from './uiStrings';

interface CategoryHeroProps {
  categorySlug: string;
  categoryName: string | undefined;
  language: LanguageCode;
}

// Reuses the same per-category image + copy already used for the homepage's
// catalog tiles (CATALOG_CARD_COPY, Stage 18) rather than inventing new
// hero-specific assets/text — categoryName comes from the API (already
// language-resolved); description/imageAlt are per-language too (Stage 24,
// see catalogContent.ts).
export function CategoryHero({ categorySlug, categoryName, language }: CategoryHeroProps) {
  const copy = CATALOG_CARD_COPY[categorySlug];
  const ui = useT(language);

  return (
    <div className={`category-hero ${copy ? '' : 'category-hero-noimage'}`}>
      {copy && (
        <picture className="category-hero-media">
          <source srcSet={`${copy.imageBase}.avif`} type="image/avif" />
          <img
            src={`${copy.imageBase}.webp`}
            alt=""
            width={copy.width}
            height={copy.height}
            loading="eager"
            decoding="async"
          />
        </picture>
      )}
      <div className="category-hero-scrim" />
      <div className="category-hero-content">
        <div className="eyebrow-label eyebrow-label-dark category-hero-eyebrow">{ui('catalog.eyebrow')}</div>
        <h1 className="category-hero-title">{categoryName ?? '…'}</h1>
        {copy?.description && <p className="category-hero-description">{copy.description[language]}</p>}
      </div>
    </div>
  );
}
