import { createResourceHooks } from './createResourceHooks';
import type { ProductAttributeValueRequest, ProductAttributeValueResponse } from '../api/types';

const productAttributeValues = createResourceHooks<ProductAttributeValueResponse, ProductAttributeValueRequest>(
  'product-attribute-values',
  'productAttributeValues',
);

export const useProductAttributeValues = productAttributeValues.useList;
export const useProductAttributeValue = productAttributeValues.useDetail;
export const useCreateProductAttributeValue = productAttributeValues.useCreate;
export const useUpdateProductAttributeValue = productAttributeValues.useUpdate;
export const useDeleteProductAttributeValue = productAttributeValues.useDelete;
export const productAttributeValueQueryKeys = productAttributeValues.keys;
