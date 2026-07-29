import { createResourceHooks } from './createResourceHooks';
import type { ProductImageRequest, ProductImageResponse } from '../api/types';

const productImages = createResourceHooks<ProductImageResponse, ProductImageRequest>('product-images', 'productImages');

export const useProductImages = productImages.useList;
export const useProductImage = productImages.useDetail;
export const useCreateProductImage = productImages.useCreate;
export const useUpdateProductImage = productImages.useUpdate;
export const useDeleteProductImage = productImages.useDelete;
export const productImageQueryKeys = productImages.keys;
