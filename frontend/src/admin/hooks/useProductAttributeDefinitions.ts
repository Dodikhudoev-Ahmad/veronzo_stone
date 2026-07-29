import { createResourceHooks } from './createResourceHooks';
import type { ProductAttributeDefinitionRequest, ProductAttributeDefinitionResponse } from '../api/types';

const productAttributeDefinitions = createResourceHooks<ProductAttributeDefinitionResponse, ProductAttributeDefinitionRequest>(
  'product-attribute-definitions',
  'productAttributeDefinitions',
);

export const useProductAttributeDefinitions = productAttributeDefinitions.useList;
export const useProductAttributeDefinition = productAttributeDefinitions.useDetail;
export const useCreateProductAttributeDefinition = productAttributeDefinitions.useCreate;
export const useUpdateProductAttributeDefinition = productAttributeDefinitions.useUpdate;
export const useDeleteProductAttributeDefinition = productAttributeDefinitions.useDelete;
export const productAttributeDefinitionQueryKeys = productAttributeDefinitions.keys;
