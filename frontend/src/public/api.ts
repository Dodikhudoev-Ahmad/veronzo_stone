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

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const response = await publicClient.get<T>(path, { params });
  return response.data;
}

export const publicApi = {
  categories: (lang?: string) => get<PublicCategory[]>('/api/public/categories', { lang }),
  heroStats: () => get<PublicHeroStat[]>('/api/public/hero-stats'),
  portfolioItems: () => get<PublicPortfolioItem[]>('/api/public/portfolio-items'),
  socialLinks: () => get<PublicSocialLink[]>('/api/public/social-links'),
  contactInfo: () => get<PublicContactInfo[]>('/api/public/contact-info'),
  siteContent: () => get<PublicSiteContentEntry[]>('/api/public/site-content'),
  seoMeta: (pageKey: string) => get<PublicSeoMeta>(`/api/public/seo-meta/${pageKey}`),
  products: (categorySlug: string, lang?: string) =>
    get<PublicProduct[]>('/api/public/products', { categorySlug, lang }),
};

// Turns [{key,value}] into a lookup with a fallback for keys the API hasn't
// seeded yet (or that failed to load), so a section never has to null-check.
export function contentLookup(entries: PublicSiteContentEntry[] | undefined) {
  const map = new Map((entries ?? []).map((e) => [e.key, e.value]));
  return (key: string, fallback: string) => map.get(key) ?? fallback;
}
