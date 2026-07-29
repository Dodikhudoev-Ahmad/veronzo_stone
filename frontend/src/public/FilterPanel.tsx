import type { PublicAttributeFilterDefinition } from './api';

interface FilterPanelProps {
  definitions: PublicAttributeFilterDefinition[];
  selected: Record<string, string[]>;
  onToggle: (key: string, value: string) => void;
  onClear: () => void;
  activeCount: number;
  // Distinguishes this instance's checkbox ids from any other FilterPanel
  // mounted at the same time (the desktop sidebar and the mobile drawer's
  // staged copy are both in the DOM simultaneously — see CatalogCategoryPage)
  // so <label htmlFor>/id pairs never collide into invalid duplicate ids.
  idPrefix: string;
  // The mobile FilterDrawer already renders its own "Фильтры" dialog title —
  // suppress this panel's own heading there so it isn't shown twice.
  showTitle?: boolean;
}

// Above this many options, a definition's list collapses behind a native
// <details> disclosure instead of always being fully expanded — presentation
// only, the underlying control is still a checkbox list either way, so
// multi-select semantics never differ between the two.
const COLLAPSE_THRESHOLD = 6;

// Purely presentational and controlled by the caller — reused as-is by both
// the desktop sidebar (bound directly to the URL-backed filter state) and
// the mobile FilterDrawer (bound to a local staged copy, committed on
// "Применить"), so the filter UI itself never has two implementations.
export function FilterPanel({
  definitions,
  selected,
  onToggle,
  onClear,
  activeCount,
  idPrefix,
  showTitle = true,
}: FilterPanelProps) {
  const visible = definitions.filter((definition) => definition.options.length > 0);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className={`filter-panel ${showTitle ? '' : 'filter-panel-embedded'}`}>
      <div className="filter-panel-header">
        {showTitle && (
          <h2 className="filter-panel-title">
            Фильтры
            {activeCount > 0 && <span className="filter-panel-count">{activeCount}</span>}
          </h2>
        )}
        {activeCount > 0 && (
          <button type="button" className="filter-panel-clear" onClick={onClear}>
            Очистить
          </button>
        )}
      </div>

      {visible.map((definition) => {
        const options = (
          <FilterOptionList
            idPrefix={idPrefix}
            definitionKey={definition.key}
            options={definition.options}
            selected={selected[definition.key] ?? []}
            onToggle={onToggle}
          />
        );

        return (
          <fieldset className="filter-group" key={definition.key}>
            <legend className="filter-group-legend">{definition.name}</legend>
            {definition.options.length > COLLAPSE_THRESHOLD ? (
              <details className="filter-group-collapsible">
                <summary>Показать все ({definition.options.length})</summary>
                {options}
              </details>
            ) : (
              options
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

interface FilterOptionListProps {
  idPrefix: string;
  definitionKey: string;
  options: PublicAttributeFilterDefinition['options'];
  selected: string[];
  onToggle: (key: string, value: string) => void;
}

function FilterOptionList({ idPrefix, definitionKey, options, selected, onToggle }: FilterOptionListProps) {
  return (
    <div className="filter-option-list">
      {options.map((option) => {
        const id = `filter-${idPrefix}-${definitionKey}-${option.value}`;
        const checked = selected.includes(option.value);
        return (
          <label key={option.value} htmlFor={id} className={`filter-option ${checked ? 'is-checked' : ''}`}>
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={() => onToggle(definitionKey, option.value)}
            />
            <span>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
