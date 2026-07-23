import { createResourceHooks } from './createResourceHooks';
import type { ProductRequest, ProductResponse } from '../api/types';

const products = createResourceHooks<ProductResponse, ProductRequest>('products', 'products');

export const useProducts = products.useList;
export const useProduct = products.useDetail;
export const useCreateProduct = products.useCreate;
export const useUpdateProduct = products.useUpdate;
export const useDeleteProduct = products.useDelete;
export const productQueryKeys = products.keys;
