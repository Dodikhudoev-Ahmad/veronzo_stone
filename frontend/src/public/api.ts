import axios from 'axios';

// Public content is unauthenticated and cookie-free — a separate axios
// instance from the admin apiClient avoids sending credentials/auth headers
// that these endpoints neither need nor check.
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5103';
export const publicClient = axios.create({ baseURL, timeout: 8000 });

export interface PublicCategory {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
}

export interface PublicHeroStat {
  id: number;
  label: string;
  value: number;
  suffix: string | null;
  sortOrder: number;
}

export interface PublicPortfolioItem {
  id: number;
  title: string;
  meta: string | null;
  categoryTag: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isFeatured: boolean;
}

export interface PublicSocialLink {
  platform: string;
  url: string;
}

export interface PublicContactInfo {
  label: string;
  value: string;
}

export interface PublicSiteContentEntry {
  key: string;
  value: string;
}

export interface PublicSeoMeta {
  pageKey: string;
  title: string;
  description: string | null;
  ogImageUrl: string | null;
}

export interface PublicProduct {
  id: number;
  categoryId: number;
  title: string;
  description: string | null;
  badgeText: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface PublicProductImage {
  imageUrl: string;
  sortOrder: number;
}

export interface PublicProductDetailAttribute {
  key: string;
  name: string;
  value: string;
}

export interface PublicProductDetail {
  id: number;
  categoryId: number;
  categorySlug: string;
  title: string;
  description: string | null;
  badgeText: string | null;
  sortOrder: number;
  images: PublicProductImage[];
  attributes: PublicProductDetailAttribute[];
}

export interface PublicAttributeFilterOption {
  value: string;
  label: string;
}

export interface PublicAttributeFilterDefinition {
  key: string;
  name: string;
  options: PublicAttributeFilterOption[];
}

// Selected filter values keyed by definition Key — mirrors the shape
// useCatalogFilters derives from the URL (see CatalogCategoryPage).
export type CatalogFilterState = Record<string, string[]>;

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const response = await publicClient.get<T>(path, { params });
  return response.data;
}

export const publicApi = {
  categories: (lang?: string) => get<PublicCategory[]>('/api/public/categories', { lang }),
  heroStats: (lang?: string) => get<PublicHeroStat[]>('/api/public/hero-stats', { lang }),
  portfolioItems: (lang?: string) => get<PublicPortfolioItem[]>('/api/public/portfolio-items', { lang }),
  socialLinks: () => get<PublicSocialLink[]>('/api/public/social-links'),
  contactInfo: (lang?: string) => get<PublicContactInfo[]>('/api/public/contact-info', { lang }),
  siteContent: (lang?: string) => get<PublicSiteContentEntry[]>('/api/public/site-content', { lang }),
  seoMeta: (pageKey: string, lang?: string) => get<PublicSeoMeta>(`/api/public/seo-meta/${pageKey}`, { lang }),
  productAttributes: (categorySlug: string, lang?: string) =>
    get<PublicAttributeFilterDefinition[]>('/api/public/product-attributes', { categorySlug, lang }),
  // Filters are passed as repeated same-name query params (?stone_type=marble&stone_type=granite),
  // matching the backend's whitelist-based OR-within-key/AND-across-keys contract (Stage 23a) —
  // built via URLSearchParams directly rather than axios's own array serialization (which defaults
  // to `key[]=`, not the repeated-key form the backend expects).
  products: (categorySlug: string, lang: string | undefined, filters: CatalogFilterState = {}) => {
    const params = new URLSearchParams();
    params.set('categorySlug', categorySlug);
    if (lang) params.set('lang', lang);
    for (const [key, values] of Object.entries(filters)) {
      for (const value of values) params.append(key, value);
    }
    return get<PublicProduct[]>(`/api/public/products?${params.toString()}`);
  },
  productDetail: (id: number, lang?: string) => get<PublicProductDetail>(`/api/public/products/${id}`, { lang }),
};

// Turns [{key,value}] into a lookup with a fallback for keys the API hasn't
// seeded yet (or that failed to load), so a section never has to null-check.
export function contentLookup(entries: PublicSiteContentEntry[] | undefined) {
  const map = new Map((entries ?? []).map((e) => [e.key, e.value]));
  return (key: string, fallback: string) => map.get(key) ?? fallback;
}
