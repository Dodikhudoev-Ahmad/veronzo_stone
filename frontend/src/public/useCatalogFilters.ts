import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CatalogFilterState, PublicAttributeFilterDefinition } from './api';

// URL shape: /catalog/stone?stone_type=granite&finish=polished,honed — one
// query key per filter definition, multiple selected values joined by comma.
// Reading state straight from useSearchParams (rather than component state)
// is what makes back/forward, reload, and sharing the URL all work for free.
export function useCatalogFilters(definitions: PublicAttributeFilterDefinition[] | undefined) {
  const [searchParams, setSearchParams] = useSearchParams();

  const definitionKeys = useMemo(() => definitions?.map((d) => d.key) ?? [], [definitions]);

  const filters = useMemo(() => {
    const state: CatalogFilterState = {};
    for (const key of definitionKeys) {
      const raw = searchParams.get(key);
      if (!raw) continue;
      const values = raw.split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length > 0) state[key] = values;
    }
    return state;
  }, [searchParams, definitionKeys]);

  const activeCount = useMemo(() => Object.values(filters).reduce((sum, values) => sum + values.length, 0), [filters]);

  // Every query param on the URL, regardless of whether the filter-metadata
  // request has resolved yet — used for the *products* fetch specifically so
  // a fresh load / reload / shared URL applies filters on the very first
  // request instead of firing once unfiltered and again once `definitions`
  // arrives (the backend already whitelists unknown keys per-category, so
  // passing everything through here is safe; see PublicProductEndpoints).
  const rawFilters = useMemo(() => {
    const state: CatalogFilterState = {};
    for (const [key, value] of searchParams.entries()) {
      const values = value.split(',').map((v) => v.trim()).filter(Boolean);
      if (values.length > 0) {
        state[key] = state[key] ? [...state[key], ...values] : values;
      }
    }
    return state;
  }, [searchParams]);

  // Only ever touches the keys that belong to this category's own filter
  // definitions — any other query param already on the URL (e.g. from a
  // future unrelated feature) is left untouched.
  const toggleValue = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const current = (next.get(key) ?? '').split(',').filter(Boolean);
        const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
        if (updated.length > 0) {
          next.set(key, updated.join(','));
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams],
  );

  // Bulk-replaces every filter key at once — used by the mobile drawer's
  // "Применить" to commit a staged selection in a single history entry,
  // instead of one entry per checkbox toggled while the drawer was open.
  const applyFilters = useCallback(
    (next: CatalogFilterState) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        for (const key of definitionKeys) {
          params.delete(key);
        }
        for (const [key, values] of Object.entries(next)) {
          if (values.length > 0) {
            params.set(key, values.join(','));
          }
        }
        return params;
      });
    },
    [setSearchParams, definitionKeys],
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const key of definitionKeys) {
        next.delete(key);
      }
      return next;
    });
  }, [setSearchParams, definitionKeys]);

  return { filters, rawFilters, activeCount, toggleValue, applyFilters, clearFilters };
}
