import { createResourceHooks } from './createResourceHooks';
import type { PortfolioItemRequest, PortfolioItemResponse } from '../api/types';

const portfolioItems = createResourceHooks<PortfolioItemResponse, PortfolioItemRequest>(
  'portfolio-items',
  'portfolioItems',
);

export const usePortfolioItems = portfolioItems.useList;
export const usePortfolioItem = portfolioItems.useDetail;
export const useCreatePortfolioItem = portfolioItems.useCreate;
export const useUpdatePortfolioItem = portfolioItems.useUpdate;
export const useDeletePortfolioItem = portfolioItems.useDelete;
export const portfolioItemQueryKeys = portfolioItems.keys;
