// Backend imageUrl values (Product/PortfolioItem) are extension-less base
// paths, e.g. "assets/images/catalog-stone" — a matching .avif/.webp pair is
// expected under /assets/images. This resolves that base into a <picture>
// the same way the static hero/catalog-tile markup already does.
export function resolveImageBase(src: string): string {
  return src.startsWith('/') ? src : `/${src}`;
}

interface PublicImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}

export function PublicImage({ src, alt, className, width, height, loading = 'lazy' }: PublicImageProps) {
  if (!src) return null;
  const base = resolveImageBase(src);
  return (
    <picture>
      <source srcSet={`${base}.avif`} type="image/avif" />
      <img
        src={`${base}.webp`}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
