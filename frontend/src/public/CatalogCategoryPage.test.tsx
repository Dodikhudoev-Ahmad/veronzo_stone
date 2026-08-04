import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogCategoryPage } from './CatalogCategoryPage';
import { publicApi } from './api';

vi.mock('./api', () => ({
  publicApi: {
    categories: vi.fn().mockResolvedValue([{ id: 1, slug: 'stone', name: 'Камень', sortOrder: 1 }]),
    productAttributes: vi.fn().mockResolvedValue([
      {
        key: 'stone_type',
        name: 'Тип камня',
        options: [
          { value: 'marble', label: 'Мрамор' },
          { value: 'onyx', label: 'Оникс' },
        ],
      },
    ]),
    products: vi.fn().mockResolvedValue([]),
    contactInfo: vi.fn().mockResolvedValue([]),
    siteContent: vi.fn().mockResolvedValue([]),
  },
  contentLookup: () => (_key: string, fallback: string) => fallback,
}));

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/catalog/:categorySlug" element={<CatalogCategoryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CatalogCategoryPage empty state', () => {
  it('shows the empty message and a working clear button when a filter yields no products', async () => {
    const user = userEvent.setup();
    renderPage('/catalog/stone?stone_type=marble');

    expect(await screen.findByText('По заданным условиям ничего не найдено.')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: 'Очистить фильтры' });
    await user.click(clearButton);

    // Clearing drops the active query — the "active query" empty copy no
    // longer applies (the category-is-empty message would show instead, but
    // either way the filter-specific empty copy must be gone).
    await waitFor(() => {
      expect(screen.queryByText('По заданным условиям ничего не найдено.')).not.toBeInTheDocument();
    });
    expect(screen.getByText('В этой категории пока нет товаров.')).toBeInTheDocument();
  });
});

describe('CatalogCategoryPage ?stone_type= as a highlight hint, not a filter', () => {
  it('shows every product in the category for ?stone_type=onyx, with no empty state, and never sends stone_type to the API', async () => {
    vi.mocked(publicApi.products).mockResolvedValueOnce([
      { id: 1, categoryId: 1, title: 'Мраморная плита Calacatta', description: null, badgeText: null, imageUrl: null, sortOrder: 1 },
      { id: 2, categoryId: 1, title: 'Оникс Grigio Carnico', description: null, badgeText: null, imageUrl: null, sortOrder: 2 },
      { id: 3, categoryId: 1, title: 'Гранит Bianco', description: null, badgeText: null, imageUrl: null, sortOrder: 3 },
    ]);

    renderPage('/catalog/stone?stone_type=onyx');

    // All three products render — stone_type narrowed nothing.
    expect(await screen.findByText('Мраморная плита Calacatta')).toBeInTheDocument();
    expect(screen.getByText('Оникс Grigio Carnico')).toBeInTheDocument();
    expect(screen.getByText('Гранит Bianco')).toBeInTheDocument();

    // Neither empty-state message appears.
    expect(screen.queryByText('По заданным условиям ничего не найдено.')).not.toBeInTheDocument();
    expect(screen.queryByText('В этой категории пока нет товаров.')).not.toBeInTheDocument();

    // "Найдено" reflects the full count, not a filtered-down one.
    expect(screen.getByText('Найдено: 3')).toBeInTheDocument();

    // The actual API call must not carry stone_type as a filter value.
    const [, , filtersArg] = vi.mocked(publicApi.products).mock.calls.at(-1) ?? [];
    expect((filtersArg as Record<string, string[]> | undefined)?.stone_type).toBeUndefined();
  });
});
