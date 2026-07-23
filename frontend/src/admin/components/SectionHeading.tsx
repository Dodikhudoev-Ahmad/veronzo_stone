interface SectionHeadingProps {
  title: string;
  description?: string;
}

export function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-3xl font-semibold text-text">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
    </div>
  );
}
