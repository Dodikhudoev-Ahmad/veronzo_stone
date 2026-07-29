import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { PublicProduct } from './api';
import { PublicImage } from './PublicImage';
import { Reveal } from './Reveal';

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
export function ProductCard({ product, categorySlug, index }: ProductCardProps) {
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
    </Reveal>
  );
}
