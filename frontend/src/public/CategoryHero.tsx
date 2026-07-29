import { CATALOG_CARD_COPY } from './catalogContent';

interface CategoryHeroProps {
  categorySlug: string;
  categoryName: string | undefined;
}

// Reuses the same per-category image + copy already used for the homepage's
// catalog tiles (CATALOG_CARD_COPY, Stage 18) rather than inventing new
// hero-specific assets/text — categoryName comes from the API (already
// language-resolved); the description is the same static, RU-authored
// blurb already shown site-wide regardless of language (see PublicHomePage's
// catalog tiles) — not a new gap introduced here, and out of scope to fix
// without touching the translations architecture (explicitly not allowed
// this stage).
export function CategoryHero({ categorySlug, categoryName }: CategoryHeroProps) {
  const copy = CATALOG_CARD_COPY[categorySlug];

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
        <div className="eyebrow-label eyebrow-label-dark category-hero-eyebrow">Каталог</div>
        <h1 className="category-hero-title">{categoryName ?? '…'}</h1>
        {copy?.description && <p className="category-hero-description">{copy.description}</p>}
      </div>
    </div>
  );
}
