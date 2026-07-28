import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from './api';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { useLanguage } from './useLanguage';
import { useCanonical, useDocumentTitle, useJsonLd } from './seo';

// No single-product public endpoint exists (Stage 17 only lists by
// category), so the detail page reuses the category list query — react-query
// caches it under the same key CatalogCategoryPage uses, so arriving here
// via a product card is instant.
export function ProductDetailPage() {
  const { categorySlug, productId } = useParams<{ categorySlug: string; productId: string }>();
  const { language, setLanguage } = useLanguage();

  const products = useQuery({
    queryKey: ['public', 'products', categorySlug, language],
    queryFn: () => publicApi.products(categorySlug!, language),
    enabled: !!categorySlug,
  });

  const product = products.data?.find((p) => p.id === Number(productId));

  useDocumentTitle(product ? `${product.title} — Veronzo` : undefined);
  useCanonical(`/catalog/${categorySlug}/${productId}`);
  useJsonLd(
    'product-jsonld',
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          description: product.description ?? undefined,
          image: product.imageUrl ? new URL(product.imageUrl, window.location.origin).toString() : undefined,
        }
      : null,
  );

  return (
    <>
      <SiteHeader language={language} onLanguageChange={setLanguage} />
      <main className="catalog-page wrap">
        <nav className="breadcrumb" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link> <span aria-hidden="true">→</span>{' '}
          <Link to={`/catalog/${categorySlug}`}>Каталог</Link>
          {product && <> <span aria-hidden="true">→</span> <span>{product.title}</span></>}
        </nav>

        {products.isLoading && <p className="state-message">Загрузка…</p>}

        {products.isError && (
          <p className="state-message state-message-error">
            Не удалось загрузить товар. Попробуйте обновить страницу.
          </p>
        )}

        {products.isSuccess && !product && (
          <p className="state-message">Товар не найден. Возможно, он был снят с публикации.</p>
        )}

        {product && (
          <div className="product-detail">
            {product.imageUrl && (
              <div className="product-detail-image">
                <img src={product.imageUrl} alt={product.title} decoding="async" />
              </div>
            )}
            <div className="product-detail-body">
              {product.badgeText && <span className="product-card-badge">{product.badgeText}</span>}
              <h1>{product.title}</h1>
              {product.description && <p>{product.description}</p>}
              <a href="/#contacts" className="btn btn-primary">Заявка на консультацию</a>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
