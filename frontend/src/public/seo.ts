import { useEffect } from 'react';

// Sets/updates a single <link rel="canonical"> for the current page. One tag
// total — reused across navigations rather than appended — so client-side
// route changes never leave stale duplicate canonicals in <head>.
export function useCanonical(path: string): void {
  useEffect(() => {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = new URL(path, window.location.origin).toString();
  }, [path]);
}

export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}

interface OpenGraphData {
  title: string;
  description?: string | null;
  image?: string | null;
}

// Keeps the static og:*/twitter:* tags in index.html (homepage defaults) in
// sync with whatever page is actually showing — without this, sharing a
// category or product link would always preview the homepage's title/image.
// `image` may be a relative app path (e.g. "assets/images/x" or a bare
// SeoMeta.OgImageUrl value); social crawlers require an absolute URL, so it's
// always resolved against window.location.origin before being written out.
export function useOpenGraph(data: OpenGraphData | undefined): void {
  useEffect(() => {
    if (!data) return;

    const setMeta = (selector: string, content: string) => {
      const el = document.head.querySelector<HTMLMetaElement>(selector);
      if (el) el.content = content;
    };

    setMeta('meta[property="og:title"]', data.title);
    setMeta('meta[name="twitter:title"]', data.title);

    if (data.description) {
      setMeta('meta[name="description"]', data.description);
      setMeta('meta[property="og:description"]', data.description);
      setMeta('meta[name="twitter:description"]', data.description);
    }

    if (data.image) {
      const path = data.image.startsWith('/') ? data.image : `/${data.image}`;
      const absolute = /^https?:\/\//.test(data.image) ? data.image : new URL(path, window.location.origin).toString();
      setMeta('meta[property="og:image"]', absolute);
      setMeta('meta[name="twitter:image"]', absolute);
    }
  }, [data]);
}

// Marks the current page noindex while `active` (default true), restoring
// "index, follow" when it isn't — used by NotFoundPage, and by
// ProductDetailPage's own not-found state, so a 404 URL never ends up in
// search results (a client-rendered SPA can't send a real HTTP 404 status).
export function useRobotsNoIndex(active = true): void {
  useEffect(() => {
    if (!active) return;
    const el = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!el) return;
    const previous = el.content;
    el.content = 'noindex, follow';
    return () => {
      el.content = previous;
    };
  }, [active]);
}

// Injects one JSON-LD <script> (id-keyed so it can be replaced/removed
// cleanly), for structured data (Organization, Product, ...). Pass null to
// remove it — used when a product hasn't loaded yet / wasn't found.
export function useJsonLd(id: string, data: object | null): void {
  useEffect(() => {
    const existing = document.getElementById(id);
    if (!data) {
      existing?.remove();
      return;
    }

    const script = existing instanceof HTMLScriptElement ? existing : document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    if (!existing) document.head.appendChild(script);

    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, data]);
}
