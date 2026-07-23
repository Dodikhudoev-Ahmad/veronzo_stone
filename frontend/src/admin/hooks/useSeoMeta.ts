import { createResourceHooks } from './createResourceHooks';
import type { SeoMetaRequest, SeoMetaResponse } from '../api/types';

const seoMeta = createResourceHooks<SeoMetaResponse, SeoMetaRequest>('seo-meta', 'seoMeta');

export const useSeoMetaList = seoMeta.useList;
export const useSeoMetaEntry = seoMeta.useDetail;
export const useCreateSeoMeta = seoMeta.useCreate;
export const useUpdateSeoMeta = seoMeta.useUpdate;
export const useDeleteSeoMeta = seoMeta.useDelete;
export const seoMetaQueryKeys = seoMeta.keys;
