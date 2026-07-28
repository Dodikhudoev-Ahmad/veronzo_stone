import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate, useParams } from 'react-router-dom';
import { publicApi } from './api';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { useLanguage } from './useLanguage';
import { useCanonical, useDocumentTitle } from './seo';

export function CatalogCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language, setLanguage } = useLanguage();
  const [search, setSearch] = useState('');

  const categories = useQuery({
    queryKey: ['public', 'categories', language],
    queryFn: () => publicApi.categories(language),
  });
  const products = useQuery({
    queryKey: ['public', 'products', categorySlug, language],
    queryFn: () => publicApi.products(categorySlug!, language),
    enabled: !!categorySlug,
  });

  const category = categories.data?.find((c) => c.slug === categorySlug);
  useDocumentTitle(category ? `${category.name} — Veronzo` : undefined);
  useCanonical(`/catalog/${categorySlug}`);

  const filteredProducts = useMemo(() => {
    const items = products.data ?? [];
    const query = search.trim().toLowerCase();
    return query ? items.filter((p) => p.title.toLowerCase().includes(query)) : items;
  }, [products.data, search]);

  // categories.data loaded and the slug isn't among them — a genuinely
  // unknown category, not just "still loading".
  if (categories.data && !category) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SiteHeader language={language} onLanguageChange={setLanguage} />
      <main className="catalog-page wrap">
        <nav className="breadcrumb" aria-label="Хлебные крошки">
          <Link to="/">Главная</Link> <span aria-hidden="true">→</span> <Link to="/#catalog">Каталог</Link>
          {category && <> <span aria-hidden="true">→</span> <span>{category.name}</span></>}
        </nav>

        <div className="catalog-page-header">
          <h1>{category?.name ?? '…'}</h1>
          <input
            type="search"
            className="catalog-page-filter"
            placeholder="Поиск по товарам…"
            aria-label="Поиск по товарам"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {products.isLoading && <p className="state-message">Загрузка…</p>}

        {products.isError && (
          <p className="state-message state-message-error">
            Не удалось загрузить товары. Попробуйте обновить страницу или свяжитесь с нами напрямую.
          </p>
        )}

        {products.isSuccess && filteredProducts.length === 0 && (
          <p className="state-message">
            {search ? 'По вашему запросу ничего не найдено.' : 'В этой категории пока нет товаров.'}
          </p>
        )}

        {products.isSuccess && filteredProducts.length > 0 && (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <Link to={`/catalog/${categorySlug}/${product.id}`} className="product-card" key={product.id}>
                {product.imageUrl && <img src={product.imageUrl} alt={product.title} loading="lazy" decoding="async" />}
                <div className="product-card-body">
                  {product.badgeText && <span className="product-card-badge">{product.badgeText}</span>}
                  <h3>{product.title}</h3>
                  {product.description && <p>{product.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
