'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type EmojiGroup = {
  id: string;
  label: string;
  emojis: string[];
};

const BASE_EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'smileys',
    label: 'Smileys',
    emojis: [
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
    ],
  },
  {
    id: 'gestures',
    label: 'Gestures',
    emojis: [
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
    ],
  },
  {
    id: 'animals',
    label: 'Animals',
    emojis: [
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
    ],
  },
  {
    id: 'food',
    label: 'Food',
    emojis: [
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
    ],
  },
  {
    id: 'objects',
    label: 'Objects',
    emojis: [
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
    ],
  },
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
  const [activeGroupId, setActiveGroupId] = useState<string>(BASE_EMOJI_GROUPS[0].id);

  const activeGroup = useMemo<EmojiGroup | undefined>(() => {
    return BASE_EMOJI_GROUPS.find((group) => group.id === activeGroupId) ?? BASE_EMOJI_GROUPS[0];
  }, [activeGroupId]);

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
      {open && activeGroup && (
        <div
          ref={pickerRef}
          className="absolute bottom-12 right-0 z-50 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-1">
            {activeGroup.emojis.map((emoji) => (
              <button
                key={`${activeGroup.id}-${emoji}`}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-white dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
                onClick={() => handleEmojiClick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {BASE_EMOJI_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                className={cn(
                  'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  group.id === activeGroup.id
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                )}
                onClick={() => setActiveGroupId(group.id)}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

