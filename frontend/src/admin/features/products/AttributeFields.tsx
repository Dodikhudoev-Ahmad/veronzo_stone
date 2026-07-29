import { ErrorState } from '../../components/ui/ErrorState';
import { useProductAttributeDefinitions } from '../../hooks/useProductAttributeDefinitions';
import { AttributeDefinitionField } from './AttributeDefinitionField';
import type { AttributeSelection } from './attributeSelection';

interface AttributeFieldsProps {
  categoryId: number;
  selections: AttributeSelection[];
  onChange: (selections: AttributeSelection[]) => void;
}

// Extracted out of ProductFormDialog so the product form itself doesn't grow
// into one giant component (per Stage 23b UX requirement). Owns fetching and
// rendering the current category's visible attribute inputs; ProductFormDialog
// just holds the resulting selections and reconciles them into
// ProductAttributeValue rows after the product itself is saved (see
// useSyncProductAttributeValues.ts) -- attribute values are a separate backend
// resource, not part of ProductRequest.
export function AttributeFields({ categoryId, selections, onChange }: AttributeFieldsProps) {
  const definitionsQuery = useProductAttributeDefinitions({ categoryId, pageSize: 100, sort: 'sortOrder' });
  const definitions = (definitionsQuery.data?.items ?? []).filter((definition) => definition.isVisible);

  function handleFieldChange(next: AttributeSelection) {
    const others = selections.filter((selection) => selection.definitionId !== next.definitionId);
    const isEmpty = next.optionId === null && (next.textValue === null || next.textValue === '');
    onChange(isEmpty ? others : [...others, next]);
  }

  if (definitionsQuery.isLoading) {
    return <p className="text-xs text-muted">Загрузка характеристик…</p>;
  }

  if (definitionsQuery.isError) {
    return <ErrorState message="Не удалось загрузить характеристики" onRetry={() => void definitionsQuery.refetch()} />;
  }

  if (definitions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-cream-soft p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Характеристики</p>
      {definitions.map((definition) => (
        <AttributeDefinitionField
          key={definition.id}
          definition={definition}
          selection={selections.find((selection) => selection.definitionId === definition.id)}
          onChange={handleFieldChange}
        />
      ))}
    </div>
  );
}
