// Shapes mirrored from the backend (see backend/VeronzoApi/Models/Admin/*.cs).
// Kept centralized here rather than one file per DTO — this stage only needs
// the wire contract, not per-entity ceremony.

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  error: string;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CategoryResponse {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  isVisible: boolean;
}
export type CategoryRequest = Omit<CategoryResponse, 'id'>;

export interface ProductResponse {
  id: number;
  categoryId: number;
  title: string;
  description: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
}
export type ProductRequest = Omit<ProductResponse, 'id'>;

export interface PortfolioItemResponse {
  id: number;
  title: string;
  meta: string | null;
  categoryTag: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
  isFeatured: boolean;
}
export type PortfolioItemRequest = Omit<PortfolioItemResponse, 'id'>;

export interface HeroStatResponse {
  id: number;
  label: string;
  value: number;
  suffix: string | null;
  sortOrder: number;
  isVisible: boolean;
}
export type HeroStatRequest = Omit<HeroStatResponse, 'id'>;

export interface SiteContentResponse {
  id: number;
  key: string;
  value: string;
}
export type SiteContentRequest = Omit<SiteContentResponse, 'id'>;

export interface SocialLinkResponse {
  id: number;
  platform: string;
  url: string;
  isVisible: boolean;
}
export type SocialLinkRequest = Omit<SocialLinkResponse, 'id'>;

export interface ContactInfoResponse {
  id: number;
  label: string;
  value: string;
  sortOrder: number;
}
export type ContactInfoRequest = Omit<ContactInfoResponse, 'id'>;

export interface SeoMetaResponse {
  id: number;
  pageKey: string;
  title: string;
  description: string | null;
  ogImageUrl: string | null;
}
export type SeoMetaRequest = Omit<SeoMetaResponse, 'id'>;
