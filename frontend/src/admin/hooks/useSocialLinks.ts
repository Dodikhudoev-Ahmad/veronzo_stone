import { createResourceHooks } from './createResourceHooks';
import type { SocialLinkRequest, SocialLinkResponse } from '../api/types';

const socialLinks = createResourceHooks<SocialLinkResponse, SocialLinkRequest>('social-links', 'socialLinks');

export const useSocialLinks = socialLinks.useList;
export const useSocialLink = socialLinks.useDetail;
export const useCreateSocialLink = socialLinks.useCreate;
export const useUpdateSocialLink = socialLinks.useUpdate;
export const useDeleteSocialLink = socialLinks.useDelete;
export const socialLinkQueryKeys = socialLinks.keys;
