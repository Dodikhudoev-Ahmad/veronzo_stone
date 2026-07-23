import { useCategories } from '../../hooks/useCategories';

// Fixed, shared query params so every caller (ProductsPage's category filter,
// ProductFormDialog's category select) hits the same React Query cache entry
// instead of firing separate requests. pageSize: 100 comfortably covers the
// whole catalog's category count (currently 4) — see backend MaxPageSize.
const CATEGORY_OPTIONS_PARAMS = { page: 1, pageSize: 100, sort: 'sortOrder' };

export function useCategoryOptions() {
  return useCategories(CATEGORY_OPTIONS_PARAMS);
}
