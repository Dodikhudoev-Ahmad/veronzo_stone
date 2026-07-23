import { createResourceHooks } from './createResourceHooks';
import type { GalleryItemRequest, GalleryItemResponse } from '../api/types';

const galleryItems = createResourceHooks<GalleryItemResponse, GalleryItemRequest>('gallery-items', 'galleryItems');

export const useGalleryItems = galleryItems.useList;
export const useGalleryItem = galleryItems.useDetail;
export const useCreateGalleryItem = galleryItems.useCreate;
export const useUpdateGalleryItem = galleryItems.useUpdate;
export const useDeleteGalleryItem = galleryItems.useDelete;
export const galleryItemQueryKeys = galleryItems.keys;
