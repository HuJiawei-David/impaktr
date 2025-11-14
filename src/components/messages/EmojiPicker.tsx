'use client';

import React, { useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// All emojis in a single flat array
const ALL_EMOJIS: string[] = [
  // Smileys
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😍',
  '😘',
  '😗',
  '😚',
  '😋',
  '😝',
  '🤪',
  '😜',
  '🤗',
  '🤭',
  '🤔',
  '🤫',
  '🤐',
  '🤨',
  '😏',
  '😒',
  '🙄',
  '😬',
  '😌',
  '😴',
  '🤤',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤧',
  '🥳',
  '🥺',
  '🤠',
  '🤡',
  '🥰',
  '🤩',
  '😭',
  '😡',
  '🤯',
  '😱',
  // Gestures
  '👍',
  '👎',
  '👏',
  '🙌',
  '👐',
  '🤝',
  '🙏',
  '🤘',
  '🤙',
  '👌',
  '👊',
  '✊',
  '🤟',
  '👋',
  '🤲',
  '🤚',
  '✋',
  '🖖',
  '🤞',
  '🤜',
  '🤛',
  '💪',
  '🤳',
  '💅',
  '🫰',
  '🤌',
  '🙇',
  '🙋',
  '💃',
  '🕺',
  '🧎',
  '🧘',
  '🛐',
  '🫡',
  '🫶',
  // Animals
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
  '🐧',
  '🐤',
  '🐣',
  '🐥',
  '🦆',
  '🦅',
  '🦉',
  '🦇',
  '🐺',
  '🐗',
  '🐴',
  '🦄',
  '🐝',
  '🐞',
  '🦋',
  '🐢',
  '🐬',
  '🐳',
  '🦈',
  '🐙',
  '🦑',
  '🦀',
  '🦞',
  '🦐',
  // Food
  '🍎',
  '🍊',
  '🍌',
  '🍉',
  '🍇',
  '🍓',
  '🍒',
  '🍑',
  '🥭',
  '🍍',
  '🥝',
  '🍅',
  '🥕',
  '🌽',
  '🌶️',
  '🥦',
  '🥬',
  '🥑',
  '🥨',
  '🥐',
  '🍞',
  '🧀',
  '🍗',
  '🍖',
  '🍣',
  '🍤',
  '🍕',
  '🍔',
  '🍟',
  '🌭',
  '🥪',
  '🌮',
  '🌯',
  '🥗',
  '🍜',
  '🍲',
  '🍱',
  '🍰',
  '🧁',
  '🍦',
  '🍩',
  '🍪',
  '🍿',
  '🍺',
  '🍷',
  '🥤',
  '🧋',
  // Objects
  '💡',
  '🎁',
  '🎉',
  '🎈',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '🤎',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '🎀',
  '🔔',
  '⚽',
  '🏀',
  '🏈',
  '⚾',
  '🎾',
  '🏐',
  '🎱',
  '🥊',
  '🏓',
  '🎮',
  '🕹️',
  '🎧',
  '📱',
  '💻',
  '🖥️',
  '📷',
  '🎬',
  '🎤',
  '🎵',
  '🎶',
  '📚',
  '✏️',
  '📝',
  '📅',
  '⏰',
];

interface EmojiPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  buttonClassName?: string;
}

export function EmojiPicker({
  open,
  onOpenChange,
  onEmojiSelect,
  className,
  buttonClassName,
}: EmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (pickerRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      onOpenChange(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange]);

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          'text-gray-500 dark:text-gray-400 transition-colors',
          open && 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400',
          buttonClassName,
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
      >
        <Smile className="h-4 w-4" />
      </Button>
      {open && (
        <div
          ref={pickerRef}
          className="absolute bottom-12 right-0 z-50 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex max-h-64 flex-wrap gap-2 overflow-y-auto pr-1">
            {ALL_EMOJIS.map((emoji, index) => (
              <button
                key={`emoji-${index}`}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-white dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

