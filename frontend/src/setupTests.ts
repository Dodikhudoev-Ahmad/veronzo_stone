import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Vitest doesn't auto-inject `afterEach` globally unless `test.globals: true`
// is set (it isn't, to keep explicit `import { ... } from 'vitest'` in every
// test file) -- so Testing Library's own auto-cleanup detection never fires.
// Without this, each test file's DOM accumulates across its `it` blocks.
afterEach(cleanup);
