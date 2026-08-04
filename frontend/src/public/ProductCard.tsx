import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { PublicProduct } from './api';
import { PublicImage } from './PublicImage';
import { Reveal } from './Reveal';
import { useT } from './uiStrings';

// Caps how far the entrance stagger goes so a very long result set doesn't
// leave the last cards waiting behind an absurd delay.
const MAX_STAGGER_INDEX = 9;

interface ProductCardProps {
  product: PublicProduct;
  categorySlug: string;
  index: number;
}

// Shared by the catalog grid (CatalogCategoryPage) and the related-products
// section (ProductDetailPage) so the card markup/styles exist in one place.
// The "request price" link is a sibling of .product-card-link, not nested
// inside it — the whole card is already one big <a>, and an <a>/<button>
// inside another <a> is invalid HTML (and would make both targets fight
// over the same click).
export function ProductCard({ product, categorySlug, index }: ProductCardProps) {
  const ui = useT();
  return (
    <Reveal
      className="product-card"
      style={{ '--reveal-index': index % MAX_STAGGER_INDEX } as CSSProperties}
    >
      <Link to={`/catalog/${categorySlug}/${product.id}`} className="product-card-link">
        <div className="product-card-media">
          <PublicImage src={product.imageUrl} alt={product.title} />
        </div>
        <div className="product-card-body">
          {product.badgeText && <span className="product-card-badge">{product.badgeText}</span>}
          <h3>{product.title}</h3>
          {product.description && <p>{product.description}</p>}
        </div>
      </Link>
      <a
        href="/#contacts"
        className="product-card-cta"
        aria-label={ui('product.requestPriceAria', { title: product.title })}
      >
        {ui('product.requestPrice')}
      </a>
    </Reveal>
  );
}
