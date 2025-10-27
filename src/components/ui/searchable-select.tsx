// home/ubuntu/impaktrweb/src/components/ui/searchable-select.tsx

'use client';

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface SearchableSelectProps {
  options: { value: string; label: string; flag?: string }[];
  value?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

export function SearchableSelect({
  options,
  value,
  placeholder = "Search...",
  onValueChange,
  className,
  disabled = false,
  error = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  // Update dropdown position when opened or on scroll/resize
  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current && isOpen) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownMaxHeight = 384; // 96 * 4 = 384px (max-h-96)
        const spaceBelow = viewportHeight - rect.bottom - 16;
        const spaceAbove = rect.top - 16;
        
        // Decide whether to show dropdown above or below
        const showAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
        const availableHeight = Math.min(
          dropdownMaxHeight, 
          showAbove ? spaceAbove : spaceBelow
        );
        
        setDropdownStyle({
          position: 'fixed',
          top: showAbove ? 'auto' : `${rect.bottom + 8}px`,
          bottom: showAbove ? `${viewportHeight - rect.top + 8}px` : 'auto',
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          maxHeight: `${availableHeight}px`,
          zIndex: 99999,
        });
      }
    };

    if (isOpen) {
      updatePosition();
      
      // Only listen to page-level scrolls, not dropdown internal scrolls
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
    
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedContainer = containerRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      
      if (!clickedContainer && !clickedDropdown) {
        // Small delay to allow for click events to complete
        setTimeout(() => {
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
        }, 100);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Prevent page scroll when focusing input
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case "Enter":
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          onValueChange?.(filteredOptions[highlightedIndex].value);
          setIsOpen(false);
          setSearchQuery("");
          setHighlightedIndex(-1);
        }
        break;
      case "ArrowDown":
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Escape":
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleOptionClick = (option: { value: string; label: string }) => {
    onValueChange?.(option.value);
    // Immediately close and reset
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
    // Blur the input to remove focus
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onValueChange?.("");
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2.5 text-sm cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md",
          error ? "border-red-500 dark:border-red-400 focus-within:ring-2 focus-within:ring-red-200 dark:focus-within:ring-red-900/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
          disabled && "opacity-50 cursor-not-allowed hover:shadow-sm",
          isOpen && "ring-2 ring-blue-500/20 dark:ring-blue-400/20 border-blue-500 dark:border-blue-400 shadow-md",
          className
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={cn(
          "truncate font-medium",
          !selectedOption && "text-gray-400 dark:text-gray-500 font-normal"
        )}>
          {selectedOption ? (
            <span className="flex items-center gap-3">
              {selectedOption.flag && <span className="text-lg">{selectedOption.flag}</span>}
              {selectedOption.label}
            </span>
          ) : placeholder}
        </span>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X
                className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              />
            </button>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-300 ease-in-out",
            isOpen && "rotate-180"
          )} />
        </div>
      </div>

      {/* Dropdown Portal */}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          style={dropdownStyle}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl dark:shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 overflow-hidden flex flex-col"
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700/50 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          {/* Options List */}
          <div 
            ref={listRef}
            className="overflow-y-auto py-2 px-2 flex-1 min-h-0"
            onMouseLeave={() => setHighlightedIndex(-1)}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgb(209 213 219) transparent',
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No results found</p>
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-10 pr-4 text-sm outline-none transition-all duration-200",
                    index === highlightedIndex 
                      ? "bg-blue-500 text-white shadow-md scale-[1.02]" 
                      : "text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300",
                    selectedOption?.value === option.value && "font-semibold"
                  )}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                    {selectedOption?.value === option.value && (
                      <Check className={cn(
                        "h-4 w-4",
                        index === highlightedIndex ? "text-white" : "text-blue-600 dark:text-blue-400"
                      )} />
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    {option.flag && <span className="text-lg leading-none">{option.flag}</span>}
                    <span className="leading-none">{option.label}</span>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
