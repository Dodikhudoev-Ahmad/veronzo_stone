interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Deliberately does not debounce internally — the parent page owns the raw
// input state (for a responsive text field) and derives a debounced value via
// useDebouncedValue for the actual query param, so the two concerns stay separate.
export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative w-full max-w-xs">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? 'Поиск…'}
        className="w-full rounded-md border border-cream-soft bg-white px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        aria-label={placeholder ?? 'Поиск'}
      />
    </div>
  );
}
