import { createResourceHooks } from './createResourceHooks';
import type { SiteContentRequest, SiteContentResponse } from '../api/types';

const siteContent = createResourceHooks<SiteContentResponse, SiteContentRequest>('site-content', 'siteContent');

export const useSiteContentList = siteContent.useList;
export const useSiteContentEntry = siteContent.useDetail;
export const useCreateSiteContent = siteContent.useCreate;
export const useUpdateSiteContent = siteContent.useUpdate;
export const useDeleteSiteContent = siteContent.useDelete;
export const siteContentQueryKeys = siteContent.keys;
