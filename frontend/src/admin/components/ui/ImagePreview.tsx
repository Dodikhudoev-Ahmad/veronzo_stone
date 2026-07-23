import { useState } from 'react';

interface ImagePreviewProps {
  src: string | null;
  alt: string;
  size?: 'sm' | 'lg';
}

// Reused as both the compact table thumbnail (Products list) and the larger
// form preview (ProductFormDialog) — one generic component instead of two
// near-identical ones. No upload, no dangerouslySetInnerHTML — just a plain
// <img> with a graceful onError fallback.
export function ImagePreview({ src, alt, size = 'sm' }: ImagePreviewProps) {
  const [errored, setErrored] = useState(false);
  const [trackedSrc, setTrackedSrc] = useState(src);

  // A stale "broken" state from a previous src must not leak onto a new one
  // when this component is reused (not remounted) for a different row/product.
  // Adjusted during render (React's documented pattern for this) rather than
  // in an effect, which would cause an extra commit.
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setErrored(false);
  }

  const dimensions = size === 'lg' ? 'h-32 w-32' : 'h-10 w-10';
  const showImage = Boolean(src) && !errored;

  return (
    <div
      className={`${dimensions} flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-cream-soft bg-bg-alt`}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span className="px-1 text-center text-[10px] leading-tight text-muted">Нет фото</span>
      )}
    </div>
  );
}
