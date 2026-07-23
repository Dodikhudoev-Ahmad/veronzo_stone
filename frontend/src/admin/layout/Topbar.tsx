import { Breadcrumbs } from './Breadcrumbs';
import { UserMenu } from './UserMenu';

export function Topbar() {
  return (
    <header className="flex items-center justify-between border-b border-cream-soft bg-bg-alt px-8 py-4">
      <Breadcrumbs />
      <UserMenu />
    </header>
  );
}
