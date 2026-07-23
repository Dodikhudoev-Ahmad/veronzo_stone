import { createResourceHooks } from './createResourceHooks';
import type { CategoryRequest, CategoryResponse } from '../api/types';

const categories = createResourceHooks<CategoryResponse, CategoryRequest>('categories', 'categories');

export const useCategories = categories.useList;
export const useCategory = categories.useDetail;
export const useCreateCategory = categories.useCreate;
export const useUpdateCategory = categories.useUpdate;
export const useDeleteCategory = categories.useDelete;
export const categoryQueryKeys = categories.keys;
