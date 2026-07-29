import { FormField } from '../../components/ui/FormField';
import { useProductAttributeOptions } from '../../hooks/useProductAttributeOptions';
import type { ProductAttributeDefinitionResponse } from '../../api/types';
import type { AttributeSelection } from './attributeSelection';

interface AttributeDefinitionFieldProps {
  definition: ProductAttributeDefinitionResponse;
  selection: AttributeSelection | undefined;
  onChange: (next: AttributeSelection) => void;
}

const NO_OPTION_VALUE = '';

// One product-facing input per ProductAttributeDefinition. ProductAttributeValue
// stores a single OptionId per (ProductId, DefinitionId) -- a unique index, see
// Stage 23a -- so a definition with options is always a single <select>, never
// a multiselect, regardless of how many options exist. A definition with no
// options yet falls back to free text (TextValue).
export function AttributeDefinitionField({ definition, selection, onChange }: AttributeDefinitionFieldProps) {
  const optionsQuery = useProductAttributeOptions({ definitionId: definition.id, pageSize: 100, sort: 'sortOrder' });
  const options = (optionsQuery.data?.items ?? []).filter((option) => option.isVisible);
  const fieldId = `product-attribute-${definition.id}`;

  if (optionsQuery.isLoading) {
    return (
      <FormField label={definition.name} htmlFor={fieldId}>
        <p className="text-xs text-muted">Загрузка значений…</p>
      </FormField>
    );
  }

  if (optionsQuery.isError) {
    return (
      <FormField label={definition.name} htmlFor={fieldId}>
        <p className="text-xs text-error">
          Не удалось загрузить значения.{' '}
          <button type="button" className="underline" onClick={() => void optionsQuery.refetch()}>
            Повторить
          </button>
        </p>
      </FormField>
    );
  }

  if (options.length > 0) {
    return (
      <FormField label={definition.name} htmlFor={fieldId}>
        <select
          id={fieldId}
          value={selection?.optionId ?? NO_OPTION_VALUE}
          onChange={(event) =>
            onChange({
              definitionId: definition.id,
              optionId: event.target.value ? Number(event.target.value) : null,
              textValue: null,
            })
          }
          className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        >
          <option value={NO_OPTION_VALUE}>— не указано —</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }

  return (
    <FormField label={definition.name} htmlFor={fieldId}>
      <input
        id={fieldId}
        value={selection?.textValue ?? ''}
        onChange={(event) => onChange({ definitionId: definition.id, optionId: null, textValue: event.target.value || null })}
        className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
      />
    </FormField>
  );
}
