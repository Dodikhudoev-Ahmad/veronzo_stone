import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { publicApi, type CatalogFilterState } from './api';
import { SiteFooter } from './layout/SiteFooter';
import { SiteHeader } from './layout/SiteHeader';
import { CategoryHero } from './CategoryHero';
import { CATALOG_CARD_COPY } from './catalogContent';
import { NotFoundPage } from './NotFoundPage';
import { ProductCard } from './ProductCard';
import { FilterPanel } from './FilterPanel';
import { FilterDrawer, FILTER_DRAWER_ID } from './FilterDrawer';
import { useCatalogFilters } from './useCatalogFilters';
import { useLanguage } from './useLanguage';
import { useCanonical, useDocumentTitle, useOpenGraph } from './seo';
import { useT } from './uiStrings';

export function CatalogCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { language, setLanguage } = useLanguage();
  const ui = useT(language);
  const [search, setSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<CatalogFilterState>({});

  const categories = useQuery({
    queryKey: ['public', 'categories', language],
    queryFn: () => publicApi.categories(language),
  });

  const attributeDefs = useQuery({
    queryKey: ['public', 'product-attributes', categorySlug, language],
    queryFn: () => publicApi.productAttributes(categorySlug!, language),
    enabled: !!categorySlug,
  });

  const { filters, rawFilters, activeCount, toggleValue, applyFilters, clearFilters } =
    useCatalogFilters(attributeDefs.data);

  const products = useQuery({
    queryKey: ['public', 'products', categorySlug, language, rawFilters],
    queryFn: () => publicApi.products(categorySlug!, language, rawFilters),
    enabled: !!categorySlug,
    // Keeps the previous grid on screen while a filter change is in flight —
    // only the very first load for a category shows the full skeleton.
    placeholderData: keepPreviousData,
  });

  const category = categories.data?.find((c) => c.slug === categorySlug);
  const cardCopy = categorySlug ? CATALOG_CARD_COPY[categorySlug] : undefined;
  useDocumentTitle(category ? `${category.name} — Veronzo` : undefined);
  useCanonical(`/catalog/${categorySlug}`);
  useOpenGraph(
    category
      ? { title: `${category.name} — Veronzo`, description: cardCopy?.description[language], image: cardCopy ? `${cardCopy.imageBase}.webp` : undefined }
      : undefined,
  );

  const filteredProducts = useMemo(() => {
    const items = products.data ?? [];
    const query = search.trim().toLowerCase();
    return query ? items.filter((p) => p.title.toLowerCase().includes(query)) : items;
  }, [products.data, search]);

  const visibleDefinitions = useMemo(
    () => (attributeDefs.data ?? []).filter((d) => d.options.length > 0),
    [attributeDefs.data],
  );

  const hasActiveQuery = search.trim() !== '' || activeCount > 0;

  function openMobileFilters() {
    setStagedFilters(filters);
    setMobileFiltersOpen(true);
  }

  function applyMobileFilters() {
    applyFilters(stagedFilters);
    setMobileFiltersOpen(false);
  }

  function toggleStaged(key: string, value: string) {
    setStagedFilters((prev) => {
      const current = prev[key] ?? [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      const next = { ...prev };
      if (updated.length > 0) {
        next[key] = updated;
      } else {
        delete next[key];
      }
      return next;
    });
  }

  function clearEverything() {
    setSearch('');
    clearFilters();
  }

  const stagedActiveCount = useMemo(
    () => Object.values(stagedFilters).reduce((sum, values) => sum + values.length, 0),
    [stagedFilters],
  );

  // categories.data loaded and the slug isn't among them — a genuinely
  // unknown category, not just "still loading".
  if (categories.data && !category) {
    return <NotFoundPage />;
  }

  const isInitialLoading = products.isLoading;
  const isUpdating = products.isFetching && !isInitialLoading;

  return (
    <>
      <SiteHeader language={language} onLanguageChange={setLanguage} />
      <main className="catalog-page wrap page-enter">
        <nav className="breadcrumb" aria-label={ui('breadcrumb.aria')}>
          <Link to="/">{ui('breadcrumb.home')}</Link> <span aria-hidden="true">→</span> <Link to="/#catalog">{ui('nav.catalog')}</Link>
          {category && <> <span aria-hidden="true">→</span> <span>{category.name}</span></>}
        </nav>

        <CategoryHero categorySlug={categorySlug ?? ''} categoryName={category?.name} language={language} />

        <div className="catalog-toolbar">
          <label className="catalog-page-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
              <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="catalog-page-filter"
              placeholder={ui('catalog.searchPlaceholder')}
              aria-label={ui('catalog.searchAria')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <div className="catalog-toolbar-right">
            {visibleDefinitions.length > 0 && (
              <button
                type="button"
                className="catalog-filters-toggle"
                aria-expanded={mobileFiltersOpen}
                aria-controls={FILTER_DRAWER_ID}
                onClick={openMobileFilters}
              >
                {ui('catalog.filters')}{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
            )}
            {!isInitialLoading && products.isSuccess && (
              <span className="catalog-result-count" aria-live="polite">
                {isUpdating ? ui('catalog.updating') : ui('catalog.foundCount', { n: filteredProducts.length })}
              </span>
            )}
          </div>
        </div>

        <div className="catalog-layout">
          {visibleDefinitions.length > 0 && (
            <aside className="catalog-filters-sidebar">
              <FilterPanel
                idPrefix="sidebar"
                definitions={visibleDefinitions}
                selected={filters}
                onToggle={toggleValue}
                onClear={clearFilters}
                activeCount={activeCount}
                language={language}
              />
            </aside>
          )}

          <div className="catalog-main">
            {isInitialLoading && <CatalogSkeleton />}

            {products.isError && (
              <div className="state-message state-message-error">
                <p>{ui('catalog.loadProductsError')}</p>
                <button type="button" className="btn-ghost state-retry" onClick={() => void products.refetch()}>
                  {ui('retry')}
                </button>
              </div>
            )}

            {!isInitialLoading && products.isSuccess && filteredProducts.length === 0 && (
              <div className="state-message state-empty">
                <p>{hasActiveQuery ? ui('catalog.noMatches') : ui('catalog.categoryEmpty')}</p>
                {hasActiveQuery && (
                  <button type="button" className="btn-ghost state-retry" onClick={clearEverything}>
                    {ui('catalog.clearFilters')}
                  </button>
                )}
              </div>
            )}

            {!isInitialLoading && products.isSuccess && filteredProducts.length > 0 && (
              <div className={`product-grid ${isUpdating ? 'is-updating' : ''}`}>
                {filteredProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} categorySlug={categorySlug ?? ''} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter language={language} />

      <FilterDrawer open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} onApply={applyMobileFilters} language={language}>
        <FilterPanel
          idPrefix="drawer"
          showTitle={false}
          definitions={visibleDefinitions}
          selected={stagedFilters}
          onToggle={toggleStaged}
          onClear={() => setStagedFilters({})}
          activeCount={stagedActiveCount}
          language={language}
        />
      </FilterDrawer>
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
