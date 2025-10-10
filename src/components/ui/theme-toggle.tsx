// home/ubuntu/impaktrweb/src/components/ui/theme-toggle.tsx

'use client';

import * as React from 'react';
import { IoSunnyOutline, IoMoonOutline } from 'react-icons/io5';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        disabled
        className="p-2 rounded-lg text-gray-600 dark:text-gray-400"
      >
        <IoSunnyOutline className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <IoSunnyOutline className="w-5 h-5" />
      ) : (
        <IoMoonOutline className="w-5 h-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}