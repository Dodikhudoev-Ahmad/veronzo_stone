import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CatalogCategoryPage } from './CatalogCategoryPage';

vi.mock('./api', () => ({
  publicApi: {
    categories: vi.fn().mockResolvedValue([{ id: 1, slug: 'stone', name: 'Камень', sortOrder: 1 }]),
    productAttributes: vi.fn().mockResolvedValue([
      { key: 'stone_type', name: 'Тип камня', options: [{ value: 'marble', label: 'Мрамор' }] },
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
