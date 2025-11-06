'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global provider to ensure body scroll is restored on route changes
 * This prevents dialog states from persisting across page navigations
 */
export function ScrollLockProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Restore body scroll on route change
    // This ensures any leftover scroll locks from dialogs are cleared
    const restoreScroll = () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    // Restore immediately on route change
    restoreScroll();

    // Also restore after a short delay to catch any async cleanup
    const timeout = setTimeout(restoreScroll, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [pathname]);

  return <>{children}</>;
}


