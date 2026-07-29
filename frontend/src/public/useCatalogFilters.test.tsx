import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useCatalogFilters } from './useCatalogFilters';
import type { PublicAttributeFilterDefinition } from './api';

const definitions: PublicAttributeFilterDefinition[] = [
  { key: 'stone_type', name: 'Тип камня', options: [{ value: 'marble', label: 'Мрамор' }, { value: 'granite', label: 'Гранит' }] },
  { key: 'finish', name: 'Отделка', options: [{ value: 'polished', label: 'Полированная' }] },
];

function wrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
  };
}

describe('useCatalogFilters', () => {
  it('parses comma-separated values per definition key from the URL', () => {
    const { result } = renderHook(() => useCatalogFilters(definitions), {
      wrapper: wrapper(['/catalog/stone?stone_type=marble,granite&finish=polished&unrelated=x']),
    });

    expect(result.current.filters).toEqual({ stone_type: ['marble', 'granite'], finish: ['polished'] });
    expect(result.current.activeCount).toBe(3);
  });

  it('toggleValue adds and removes a single value for a key', () => {
    const { result } = renderHook(() => useCatalogFilters(definitions), {
      wrapper: wrapper(['/catalog/stone?stone_type=marble']),
    });

    act(() => result.current.toggleValue('stone_type', 'granite'));
    expect(result.current.filters.stone_type).toEqual(['marble', 'granite']);

    act(() => result.current.toggleValue('stone_type', 'marble'));
    expect(result.current.filters.stone_type).toEqual(['granite']);
  });

  it('clearFilters removes only this category\'s definition keys, not unrelated params', () => {
    const { result } = renderHook(() => useCatalogFilters(definitions), {
      wrapper: wrapper(['/catalog/stone?stone_type=marble&finish=polished']),
    });

    act(() => result.current.clearFilters());
    expect(result.current.filters).toEqual({});
    expect(result.current.activeCount).toBe(0);
  });

  it('applyFilters replaces the full filter set in one commit', () => {
    const { result } = renderHook(() => useCatalogFilters(definitions), {
      wrapper: wrapper(['/catalog/stone?stone_type=marble']),
    });

    act(() => result.current.applyFilters({ finish: ['polished'] }));
    expect(result.current.filters).toEqual({ finish: ['polished'] });
  });
});
