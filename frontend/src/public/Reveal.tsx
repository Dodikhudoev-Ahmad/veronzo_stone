import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from './hooks';

// Renders a <div> regardless of the original markup's element (article/div) —
// styles.css targets these purely by class, never by tag, so this doesn't
// change appearance, only slightly reduces semantics vs. the original <article>.
// Shared by PublicHomePage (catalog tiles, about image, ...) and
// CatalogCategoryPage (product cards, which also pass `style` for a
// per-card `--reveal-index` stagger custom property) so the scroll-reveal
// wiring exists once.
export function Reveal({ className, style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
