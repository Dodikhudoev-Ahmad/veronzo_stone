import axios from 'axios';

// Public content is unauthenticated and cookie-free — a separate axios
// instance from the admin apiClient avoids sending credentials/auth headers
// that these endpoints neither need nor check.
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5103';
export const publicClient = axios.create({ baseURL, timeout: 8000, headers: { 'Accept-Language': 'ru' } });

// The public site is Russian-only (see useLanguage.ts's removal note in git
// history) — every request asks the backend for `ru` explicitly rather than
// relying on its default, so behavior doesn't silently change if that
// default ever does. The backend's translation tables/schema are untouched;
// this just always selects the `ru` row.
const LANG = 'ru';

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

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const response = await publicClient.get<T>(path, { params });
  return response.data;
}

export const publicApi = {
  categories: () => get<PublicCategory[]>('/api/public/categories', { lang: LANG }),
  heroStats: () => get<PublicHeroStat[]>('/api/public/hero-stats', { lang: LANG }),
  portfolioItems: () => get<PublicPortfolioItem[]>('/api/public/portfolio-items', { lang: LANG }),
  socialLinks: () => get<PublicSocialLink[]>('/api/public/social-links'),
  contactInfo: () => get<PublicContactInfo[]>('/api/public/contact-info', { lang: LANG }),
  siteContent: () => get<PublicSiteContentEntry[]>('/api/public/site-content', { lang: LANG }),
  seoMeta: (pageKey: string) => get<PublicSeoMeta>(`/api/public/seo-meta/${pageKey}`, { lang: LANG }),
  // No filters — the catalog always shows every visible product in the
  // category (see CatalogCategoryPage).
  products: (categorySlug: string) => get<PublicProduct[]>('/api/public/products', { categorySlug, lang: LANG }),
  productDetail: (id: number) => get<PublicProductDetail>(`/api/public/products/${id}`, { lang: LANG }),
};

// Turns [{key,value}] into a lookup with a fallback for keys the API hasn't
// seeded yet (or that failed to load), so a section never has to null-check.
export function contentLookup(entries: PublicSiteContentEntry[] | undefined) {
  const map = new Map((entries ?? []).map((e) => [e.key, e.value]));
  return (key: string, fallback: string) => map.get(key) ?? fallback;
}
