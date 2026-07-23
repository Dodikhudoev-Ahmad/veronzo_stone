import { createResourceHooks } from './createResourceHooks';
import type { ContactInfoRequest, ContactInfoResponse } from '../api/types';

const contactInfo = createResourceHooks<ContactInfoResponse, ContactInfoRequest>('contact-info', 'contactInfo');

export const useContactInfoList = contactInfo.useList;
export const useContactInfoEntry = contactInfo.useDetail;
export const useCreateContactInfo = contactInfo.useCreate;
export const useUpdateContactInfo = contactInfo.useUpdate;
export const useDeleteContactInfo = contactInfo.useDelete;
export const contactInfoQueryKeys = contactInfo.keys;
