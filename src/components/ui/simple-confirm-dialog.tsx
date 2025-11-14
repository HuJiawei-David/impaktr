'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Heart, AlertTriangle } from 'lucide-react';

interface SimpleConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'remove' | 'warning';
  showCancel?: boolean;
}

export function SimpleConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  showCancel = true
}: SimpleConfirmDialogProps) {
  // Lock body scroll when dialog is open
  React.useEffect(() => {
    if (!isOpen) return;
    
    // Save original overflow style
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Calculate scrollbar width to prevent layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    
    return () => {
      // Restore original styles when dialog closes
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <Trash2 className="w-6 h-6 text-red-500" />;
      case 'remove':
        return <Heart className="w-6 h-6 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-orange-500" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'remove':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        // Only close if clicking the backdrop (not the dialog content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => {
        // Prevent scroll events from propagating when dialog is open
        e.stopPropagation();
      }}
      onTouchMove={(e) => {
        // Prevent touch scroll when dialog is open (mobile)
        e.stopPropagation();
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-xl w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(e) => {
          // Prevent clicks inside dialog from closing it
          e.stopPropagation();
        }}
      >
        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-line">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3 justify-end">
          {showCancel && (
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2"
            >
              {cancelText}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className={`px-4 py-2 ${getConfirmButtonStyle()}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'delete' | 'remove' | 'warning';
    showCancel?: boolean;
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (newConfig: typeof config) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const hideConfirm = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (config.onConfirm) {
      config.onConfirm();
    }
    hideConfirm();
  };

  const ConfirmDialog = () => (
    <SimpleConfirmDialog
      isOpen={isOpen}
      onClose={hideConfirm}
      onConfirm={handleConfirm}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      type={config.type}
      showCancel={config.showCancel}
    />
  );

  return {
    showConfirm,
    hideConfirm,
    ConfirmDialog
  };
}
