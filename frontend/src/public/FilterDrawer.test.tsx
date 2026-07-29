import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterDrawer } from './FilterDrawer';
import { FilterPanel } from './FilterPanel';
import type { CatalogFilterState, PublicAttributeFilterDefinition } from './api';

const definitions: PublicAttributeFilterDefinition[] = [
  { key: 'stone_type', name: 'Тип камня', options: [{ value: 'marble', label: 'Мрамор' }] },
];

// Mirrors CatalogCategoryPage's own open/stage/discard/apply wiring (a
// staged copy of the committed filters, only merged back on "Применить"),
// so the drawer's actual contract is exercised the same way it's used —
// without pulling in the page's react-query/api dependencies.
function Harness() {
  const [committed, setCommitted] = useState<CatalogFilterState>({});
  const [staged, setStaged] = useState<CatalogFilterState>({});
  const [open, setOpen] = useState(false);

  function openDrawer() {
    setStaged(committed);
    setOpen(true);
  }

  function toggleStaged(key: string, value: string) {
    setStaged((prev) => {
      const current = prev[key] ?? [];
      const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      const next = { ...prev };
      if (updated.length > 0) next[key] = updated;
      else delete next[key];
      return next;
    });
  }

  return (
    <>
      <button type="button" onClick={openDrawer}>
        Фильтры{Object.values(committed).flat().length > 0 ? ` (${Object.values(committed).flat().length})` : ''}
      </button>
      <div data-testid="committed">{JSON.stringify(committed)}</div>

      <FilterDrawer open={open} onClose={() => setOpen(false)} onApply={() => { setCommitted(staged); setOpen(false); }}>
        <FilterPanel
          idPrefix="drawer"
          showTitle={false}
          definitions={definitions}
          selected={staged}
          onToggle={toggleStaged}
          onClear={() => setStaged({})}
          activeCount={Object.values(staged).flat().length}
        />
      </FilterDrawer>
    </>
  );
}

describe('FilterDrawer mobile filter UI', () => {
  it('discards a staged selection when closed without applying', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Фильтры' }));
    const dialog = screen.getByRole('dialog', { name: 'Фильтры' });
    await user.click(within(dialog).getByLabelText('Мрамор'));
    expect(within(dialog).getByLabelText('Мрамор')).toBeChecked();

    await user.click(within(dialog).getByRole('button', { name: 'Закрыть фильтры' }));

    expect(screen.getByTestId('committed')).toHaveTextContent('{}');

    await user.click(screen.getByRole('button', { name: 'Фильтры' }));
    expect(within(screen.getByRole('dialog', { name: 'Фильтры' })).getByLabelText('Мрамор')).not.toBeChecked();
  });

  it('commits a staged selection when "Применить" is clicked', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Фильтры' }));
    const dialog = screen.getByRole('dialog', { name: 'Фильтры' });
    await user.click(within(dialog).getByLabelText('Мрамор'));
    await user.click(within(dialog).getByRole('button', { name: 'Применить' }));

    expect(screen.getByTestId('committed')).toHaveTextContent(JSON.stringify({ stone_type: ['marble'] }));
    expect(screen.getByRole('button', { name: 'Фильтры (1)' })).toBeInTheDocument();
  });
});
