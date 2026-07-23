// Shared by every admin page shell in this stage — the pages themselves get
// real content (tables, forms) in a later stage; for now each just proves the
// route/layout/auth wiring works end to end.
export function PlaceholderPanel() {
  return (
    <div className="rounded-lg border border-dashed border-cream-soft bg-bg-alt p-12 text-center text-sm text-muted">
      Раздел в разработке
    </div>
  );
}
