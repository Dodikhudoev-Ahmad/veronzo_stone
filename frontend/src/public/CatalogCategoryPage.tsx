import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { publicApi } from './api';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { CategoryHero } from './CategoryHero';
import { CATALOG_CARD_COPY } from './catalogContent';
import { NotFoundPage } from './NotFoundPage';
import { ProductCard } from './ProductCard';
import { useCanonical, useDocumentTitle, useOpenGraph } from './seo';
import { useT } from './uiStrings';

export function CatalogCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const ui = useT();
  const [searchParams, setSearchParams] = useSearchParams();

  // The catalog no longer supports filtering — any stray query params (e.g.
  // an old `?stone_type=onyx` link) are dropped on arrival so the URL always
  // matches what's actually shown: every visible product in the category.
  useEffect(() => {
    if (searchParams.size > 0) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const categories = useQuery({ queryKey: ['public', 'categories'], queryFn: publicApi.categories });

  const products = useQuery({
    queryKey: ['public', 'products', categorySlug],
    queryFn: () => publicApi.products(categorySlug!),
    enabled: !!categorySlug,
  });

  const category = categories.data?.find((c) => c.slug === categorySlug);
  const cardCopy = categorySlug ? CATALOG_CARD_COPY[categorySlug] : undefined;
  useDocumentTitle(category ? `${category.name} — Veronzo` : undefined);
  useCanonical(`/catalog/${categorySlug}`);
  useOpenGraph(
    category
      ? { title: `${category.name} — Veronzo`, description: cardCopy?.description, image: cardCopy ? `${cardCopy.imageBase}.webp` : undefined }
      : undefined,
  );

  // categories.data loaded and the slug isn't among them — a genuinely
  // unknown category, not just "still loading".
  if (categories.data && !category) {
    return <NotFoundPage />;
  }

  return (
    <>
      <SiteHeader />
      <main className="catalog-page wrap page-enter">
        <nav className="breadcrumb" aria-label={ui('breadcrumb.aria')}>
          <Link to="/">{ui('breadcrumb.home')}</Link> <span aria-hidden="true">→</span> <Link to="/#catalog">{ui('nav.catalog')}</Link>
          {category && <> <span aria-hidden="true">→</span> <span>{category.name}</span></>}
        </nav>

        <CategoryHero categorySlug={categorySlug ?? ''} categoryName={category?.name} />

        <div className="catalog-main">
          {products.isLoading && <CatalogSkeleton />}

          {products.isError && (
            <div className="state-message state-message-error">
              <p>{ui('catalog.loadProductsError')}</p>
              <button type="button" className="btn-ghost state-retry" onClick={() => void products.refetch()}>
                {ui('retry')}
              </button>
            </div>
          )}

          {products.isSuccess && products.data.length === 0 && (
            <div className="state-message state-empty">
              <p>{ui('catalog.categoryEmpty')}</p>
            </div>
          )}

          {products.isSuccess && products.data.length > 0 && (
            <div className="product-grid">
              {products.data.map((product, index) => (
                <ProductCard key={product.id} product={product} categorySlug={categorySlug ?? ''} index={index} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function CatalogSkeleton() {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="product-card-skeleton" key={index}>
          <div className="product-card-skeleton-media" />
          <div className="product-card-skeleton-line product-card-skeleton-line-title" />
          <div className="product-card-skeleton-line" />
        </div>
      ))}
    </div>
  );
}
