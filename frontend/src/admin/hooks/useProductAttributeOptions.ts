import { createResourceHooks } from './createResourceHooks';
import type { ProductAttributeOptionRequest, ProductAttributeOptionResponse } from '../api/types';

const productAttributeOptions = createResourceHooks<ProductAttributeOptionResponse, ProductAttributeOptionRequest>(
  'product-attribute-options',
  'productAttributeOptions',
);

export const useProductAttributeOptions = productAttributeOptions.useList;
export const useProductAttributeOption = productAttributeOptions.useDetail;
export const useCreateProductAttributeOption = productAttributeOptions.useCreate;
export const useUpdateProductAttributeOption = productAttributeOptions.useUpdate;
export const useDeleteProductAttributeOption = productAttributeOptions.useDelete;
export const productAttributeOptionQueryKeys = productAttributeOptions.keys;
