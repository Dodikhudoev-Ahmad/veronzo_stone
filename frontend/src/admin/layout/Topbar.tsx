import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-cream-soft bg-bg-alt px-4 py-4 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Открыть меню"
          className="-ml-1 shrink-0 rounded-md p-2 text-text transition hover:bg-cream-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
        >
          <span aria-hidden="true" className="flex h-4 w-5 flex-col justify-between">
            <span className="block h-0.5 w-full rounded-full bg-text" />
            <span className="block h-0.5 w-full rounded-full bg-text" />
            <span className="block h-0.5 w-full rounded-full bg-text" />
          </span>
        </button>
        <Breadcrumbs />
      </div>
      <UserMenu />
    </header>
  );
}
