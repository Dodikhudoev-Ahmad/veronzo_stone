import { useEffect, useRef } from 'react';

// Marks JS as running so the CSS reveal animation (`.js [data-reveal]`, see
// styles.css) is only enabled once JS actually confirms it's running —
// content stays fully visible if the bundle never loads/executes.
export function useJsFlag(): void {
  useEffect(() => {
    document.documentElement.classList.add('js');
  }, []);
}

// Denser header background once the page has scrolled — mirrors the old
// main.js `scrolled` class toggle, rAF-throttled.
export function useScrollHeader<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      el.classList.toggle('scrolled', window.scrollY > 10);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return ref;
}

// A plain `<a href="/#contacts">` clicked from a different route (e.g. a
// product detail page) is a full page reload, not a client-side transition —
// the browser lands on `/`, parses the still-empty SPA shell, and attempts
// its native scroll-to-hash before React has mounted the section with that
// id. That native attempt finds nothing and never retries, so the visitor
// silently lands at the top of the homepage instead of the section they
// clicked through to. Runs once after this page's own content has mounted,
// when the target id is guaranteed to already be in the DOM.
export function useScrollToHash(): void {
  useEffect(() => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
}

// Reveals an element (adds `is-visible`) the first time it scrolls into
// view, then stops observing it — matches the one-shot reveal in main.js.
// `[data-reveal]` (which CSS uses to gate opacity, only under `.js`) is set
// ONLY once an observer is confirmed running — so a browser without
// IntersectionObserver, or one where the constructor throws (locked-down
// embeds), never hides content behind an animation that can't fire. Per the
// IntersectionObserver spec, observe() always queues an initial callback
// with the target's current intersection state — including "already
// visible" — so no timeout is needed to cover that case.
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    let observer: IntersectionObserver;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
      );
    } catch {
      el.classList.add('is-visible');
      return;
    }

    el.setAttribute('data-reveal', '');
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
