import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from './api';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { PublicImage, resolveImageBase } from './PublicImage';
import { ProductCard } from './ProductCard';
import { useLanguage } from './useLanguage';
import { useCanonical, useDocumentTitle, useJsonLd, useOpenGraph, useRobotsNoIndex } from './seo';
import { useT } from './uiStrings';

export function ProductDetailPage() {
  const { categorySlug, productId } = useParams<{ categorySlug: string; productId: string }>();
  const { language, setLanguage } = useLanguage();
  const ui = useT(language);
  const numericId = Number(productId);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const productQuery = useQuery({
    queryKey: ['public', 'product-detail', numericId, language],
    queryFn: () => publicApi.productDetail(numericId, language),
    enabled: Number.isFinite(numericId),
  });

  const product = productQuery.data;
  const notFound = productQuery.isError && productQuery.error instanceof AxiosError && productQuery.error.response?.status === 404;
  useRobotsNoIndex(notFound);

  const relatedQuery = useQuery({
    queryKey: ['public', 'products', product?.categorySlug, language],
    queryFn: () => publicApi.products(product!.categorySlug, language),
    enabled: !!product,
  });
  const relatedProducts = (relatedQuery.data ?? []).filter((p) => p.id !== product?.id).slice(0, 4);

  useDocumentTitle(product ? `${product.title} — Veronzo` : undefined);
  useCanonical(`/catalog/${categorySlug}/${productId}`);
  useOpenGraph(
    product
      ? {
          title: `${product.title} — Veronzo`,
          description: product.description,
          image: product.images[0] ? `${resolveImageBase(product.images[0].imageUrl)}.webp` : undefined,
        }
      : undefined,
  );
  useJsonLd(
    'product-jsonld',
    product
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          description: product.description ?? undefined,
          image: product.images[0]
            ? new URL(`${resolveImageBase(product.images[0].imageUrl)}.webp`, window.location.origin).toString()
            : undefined,
        }
      : null,
  );

  const activeImage = product?.images[activeImageIndex] ?? product?.images[0];

  return (
    <>
      <SiteHeader language={language} onLanguageChange={setLanguage} />
      <main className="catalog-page wrap page-enter">
        <nav className="breadcrumb" aria-label={ui('breadcrumb.aria')}>
          <Link to="/">{ui('breadcrumb.home')}</Link> <span aria-hidden="true">→</span>{' '}
          <Link to={`/catalog/${categorySlug}`}>{ui('nav.catalog')}</Link>
          {product && <> <span aria-hidden="true">→</span> <span>{product.title}</span></>}
        </nav>

        {productQuery.isLoading && <p className="state-message">{ui('loading')}</p>}

        {productQuery.isError && !notFound && (
          <div className="state-message state-message-error">
            <p>{ui('product.loadError')}</p>
            <button type="button" className="btn-ghost state-retry" onClick={() => void productQuery.refetch()}>
              {ui('retry')}
            </button>
          </div>
        )}

        {notFound && <p className="state-message">{ui('product.notFound')}</p>}

        {product && (
          <>
            <div className="product-detail">
              {product.images.length > 0 && (
                <div className="product-detail-gallery">
                  <div className="product-detail-image">
                    <PublicImage src={activeImage?.imageUrl} alt={product.title} />
                  </div>
                  {product.images.length > 1 && (
                    <div className="product-detail-thumbs" role="tablist" aria-label={ui('product.imagesAria')}>
                      {product.images.map((image, index) => (
                        <button
                          key={image.imageUrl}
                          type="button"
                          role="tab"
                          aria-selected={index === activeImageIndex}
                          aria-label={ui('product.imageLabel', { n: index + 1 })}
                          className={`product-detail-thumb ${index === activeImageIndex ? 'is-active' : ''}`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <PublicImage src={image.imageUrl} alt="" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="product-detail-body">
                {product.badgeText && <span className="product-card-badge">{product.badgeText}</span>}
                <h1 className="product-detail-title">{product.title}</h1>
                {product.description && <p>{product.description}</p>}

                {product.attributes.length > 0 && (
                  <table className="product-detail-attributes">
                    <tbody>
                      {product.attributes.map((attribute) => (
                        <tr key={attribute.key}>
                          <th scope="row">{attribute.name}</th>
                          <td>{attribute.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <a href="/#contacts" className="btn btn-primary">{ui('hero.ctaSecondary')}</a>
              </div>
            </div>

            {relatedProducts.length > 0 && (
              <section className="related-products">
                <h2>{ui('product.related')}</h2>
                <div className="product-grid">
                  {relatedProducts.map((related, index) => (
                    <ProductCard key={related.id} product={related} categorySlug={categorySlug ?? ''} index={index} language={language} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter language={language} />
    </>
  );
}
