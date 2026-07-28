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
