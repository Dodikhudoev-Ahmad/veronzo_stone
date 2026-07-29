import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-cream-soft bg-bg-alt px-4 py-4 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Открыть меню"
          className="-ml-1 rounded-md p-2 text-text transition hover:bg-cream-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
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
