import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogCategoryPage } from './CatalogCategoryPage';
import { publicApi } from './api';

vi.mock('./api', () => ({
  publicApi: {
    categories: vi.fn().mockResolvedValue([{ id: 1, slug: 'stone', name: 'Камень', sortOrder: 1 }]),
    products: vi.fn().mockResolvedValue([]),
    contactInfo: vi.fn().mockResolvedValue([]),
    siteContent: vi.fn().mockResolvedValue([]),
  },
  contentLookup: () => (_key: string, fallback: string) => fallback,
}));

// Renders the current URL's query string so tests can assert it was cleaned
// up — CatalogCategoryPage strips any stray params (e.g. an old
// ?stone_type=onyx link) via history.replace, which only the router itself
// can observe.
function LocationSearch() {
  const [searchParams] = useSearchParams();
  return <span data-testid="location-search">{searchParams.toString()}</span>;
}

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LocationSearch />
        <Routes>
          <Route path="/catalog/:categorySlug" element={<CatalogCategoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CatalogCategoryPage — no filtering, Russian-only', () => {
  it('shows every product in the category regardless of a stray ?stone_type= param, and cleans it from the URL', async () => {
    vi.mocked(publicApi.products).mockResolvedValueOnce([
      { id: 1, categoryId: 1, title: 'Мраморная плита Calacatta', description: null, badgeText: null, imageUrl: null, sortOrder: 1 },
      { id: 2, categoryId: 1, title: 'Оникс Grigio Carnico', description: null, badgeText: null, imageUrl: null, sortOrder: 2 },
      { id: 3, categoryId: 1, title: 'Гранит Bianco', description: null, badgeText: null, imageUrl: null, sortOrder: 3 },
    ]);

    renderPage('/catalog/stone?stone_type=onyx');

    // All three products render — the query param narrowed nothing.
    expect(await screen.findByText('Мраморная плита Calacatta')).toBeInTheDocument();
    expect(screen.getByText('Оникс Grigio Carnico')).toBeInTheDocument();
    expect(screen.getByText('Гранит Bianco')).toBeInTheDocument();

    // The API was never asked to filter by stone_type — products() is
    // called with only the category slug.
    expect(publicApi.products).toHaveBeenCalledWith('stone');

    // The URL itself gets cleaned up (no more ?stone_type=onyx).
    await waitFor(() => {
      expect(screen.getByTestId('location-search')).toHaveTextContent('');
    });

    // No filtering UI exists anywhere on the page.
    expect(screen.queryByPlaceholderText(/поиск/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /фильтр/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/найдено/i)).not.toBeInTheDocument();
  });

  it('shows the category-empty message only when the API genuinely returns zero products', async () => {
    vi.mocked(publicApi.products).mockResolvedValueOnce([]);

    renderPage('/catalog/stone');

    expect(await screen.findByText('В этой категории пока нет товаров.')).toBeInTheDocument();
    expect(screen.queryByText('По заданным условиям ничего не найдено.')).not.toBeInTheDocument();
  });
});
