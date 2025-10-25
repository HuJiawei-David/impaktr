'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
  icon?: 'trash' | 'heart' | 'warning' | 'none';
}

const iconComponents = {
  trash: Trash2,
  heart: Heart,
  warning: AlertTriangle,
  none: null,
};

const variantStyles = {
  default: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  },
  destructive: {
    iconBg: 'bg-red-100 dark:bg-red-900/20',
    iconColor: 'text-red-600 dark:text-red-400',
    confirmButton: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  },
  warning: {
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    confirmButton: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon = 'warning',
}: ConfirmationDialogProps) {
  const IconComponent = icon !== 'none' ? iconComponents[icon] : null;
  const styles = variantStyles[variant];

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Icon Header */}
        {IconComponent && (
          <div className="flex justify-center mb-4">
            <div className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center",
              styles.iconBg
            )}>
              <IconComponent className={cn("w-8 h-8", styles.iconColor)} />
            </div>
          </div>
        )}

        {/* Content */}
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-bold text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Footer with Actions */}
        <AlertDialogFooter>
          <AlertDialogCancel>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Pre-configured variants for common use cases
export function RemoveFromFavoritesDialog({
  open,
  onOpenChange,
  onConfirm,
  eventName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  eventName?: string;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Remove from Favorites"
      description={
        eventName
          ? `Are you sure you want to remove "${eventName}" from your favorites? You can always add it back later.`
          : "Are you sure you want to remove this event from your favorites? You can always add it back later."
      }
      confirmText="Remove"
      cancelText="Keep it"
      variant="warning"
      icon="heart"
    />
  );
}

export function DeleteEventDialog({
  open,
  onOpenChange,
  onConfirm,
  eventName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  eventName?: string;
}) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete Event"
      description={
        eventName
          ? `Are you sure you want to delete "${eventName}"? This action cannot be undone and all event data will be permanently removed.`
          : "Are you sure you want to delete this event? This action cannot be undone and all event data will be permanently removed."
      }
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
      icon="trash"
    />
  );
}

