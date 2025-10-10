import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function LoadingSpinner({ 
  text = 'Loading...', 
  size = 'md',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-32 w-32',
    lg: 'h-40 w-40'
  };

  const logoSizeClasses = {
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  const content = (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative inline-flex items-center justify-center">
        <svg className={`${sizeClasses[size]} animate-spin`} viewBox="0 0 50 50">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80, 200"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${logoSizeClasses[size]}`}>
            impaktr
          </span>
        </div>
      </div>
      {text && <p className="text-gray-600 dark:text-gray-300 mt-4">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

