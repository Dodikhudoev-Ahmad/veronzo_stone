import { motion } from 'motion/react';

// Used both as the Suspense fallback for lazy-loaded admin pages and as the
// loading state while AuthProvider is still resolving the initial session.
export function AdminLoader() {
  return (
    <div className="flex min-h-[240px] w-full items-center justify-center" role="status" aria-live="polite">
      <motion.div
        className="h-8 w-8 rounded-full border-2 border-cream-soft border-t-accent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      <span className="sr-only">Загрузка…</span>
    </div>
  );
}
