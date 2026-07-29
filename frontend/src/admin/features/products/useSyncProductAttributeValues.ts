import { apiClient } from '../../api/client';
import {
  useCreateProductAttributeValue,
  useDeleteProductAttributeValue,
  useUpdateProductAttributeValue,
} from '../../hooks/useProductAttributeValues';
import type { PagedResult, ProductAttributeValueResponse } from '../../api/types';
import type { AttributeSelection } from './attributeSelection';

// ProductAttributeValue is a separate backend resource from Product (Stage 23a)
// -- there is no bulk/nested-write endpoint, so this always runs as a second
// step once the product itself has been created/updated and its id is known.
// Reads the product's current rows fresh (rather than trusting whatever
// ProductFormDialog had loaded earlier in the dialog's lifetime) so the diff
// is correct even if the dialog was open for a while.
export function useSyncProductAttributeValues() {
  const createValue = useCreateProductAttributeValue();
  const updateValue = useUpdateProductAttributeValue();
  const deleteValue = useDeleteProductAttributeValue();

  async function sync(productId: number, selections: AttributeSelection[]): Promise<{ failedCount: number }> {
    const { data } = await apiClient.get<PagedResult<ProductAttributeValueResponse>>('/api/admin/product-attribute-values', {
      params: { productId, pageSize: 100 },
    });
    const existingByDefinitionId = new Map(data.items.map((row) => [row.definitionId, row]));
    const selectedDefinitionIds = new Set(selections.map((selection) => selection.definitionId));

    const operations: Promise<unknown>[] = [];

    for (const selection of selections) {
      const existing = existingByDefinitionId.get(selection.definitionId);
      const payload = {
        productId,
        definitionId: selection.definitionId,
        optionId: selection.optionId,
        textValue: selection.textValue,
      };
      operations.push(existing ? updateValue.mutateAsync({ id: existing.id, payload }) : createValue.mutateAsync(payload));
    }

    for (const row of data.items) {
      if (!selectedDefinitionIds.has(row.definitionId)) {
        operations.push(deleteValue.mutateAsync(row.id));
      }
    }

    const results = await Promise.allSettled(operations);
    return { failedCount: results.filter((result) => result.status === 'rejected').length };
  }

  return { sync, isPending: createValue.isPending || updateValue.isPending || deleteValue.isPending };
}
