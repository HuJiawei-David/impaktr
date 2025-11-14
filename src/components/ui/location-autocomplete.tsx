'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from './input';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = 'e.g., California, United States',
  className = '',
  open: controlledOpen,
  onOpenChange
}: LocationAutocompleteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isLoading, setIsLoading] = useState(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use controlled open state if provided, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  // Sync internal state when controlled state changes externally
  useEffect(() => {
    if (controlledOpen !== undefined) {
      setInternalOpen(controlledOpen);
    }
  }, [controlledOpen]);

  // Update dropdown position - keep it simple and stable
  useEffect(() => {
    if (!isOpen || !wrapperRef.current) return;

    const updatePosition = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const dropdownWidth = Math.max(rect.width * 1.5, 400);
        
        setDropdownStyle({
          position: 'absolute',
          top: '100%',
          left: '0',
          width: `${dropdownWidth}px`,
          maxHeight: '320px',
          zIndex: 9999,
          marginTop: '4px',
        });
      }
    };

    updatePosition();
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isClickInsideWrapper = wrapperRef.current?.contains(target);
      const isClickInsideDropdown = dropdownRef.current?.contains(target);
      
      if (!isClickInsideWrapper && !isClickInsideDropdown) {
        setIsOpen(false);
      }
    }

    // Only add listener when dropdown is open
    if (isOpen) {
      // Add listener immediately but with mousedown for faster response
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    return undefined;
  }, [isOpen]);

  const fetchLocations = async (query: string) => {
    try {
      // Request more results when searching to ensure countries are visible
      const limit = query.length >= 2 ? '30' : '10'; // More results when searching
      const params = new URLSearchParams({ q: query, limit });
      
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(`/api/locations?${params}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API Error:', response.status, errorData);
          // Don't throw, just return fallback
          return ['Remote', 'United States', 'Malaysia', 'Singapore', 'Canada', 'Australia'];
        }
        
        const data = await response.json();
        return data.locations || [];
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // Check if it's an abort (timeout) or network error
        if (fetchError.name === 'AbortError') {
          console.error('Location API request timeout');
        } else if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          console.error('Network error - location API unavailable');
        } else {
          console.error('Error fetching locations:', fetchError);
        }
        // Return fallback locations for any network/API errors
        return ['Remote', 'United States', 'Malaysia', 'Singapore', 'Canada', 'Australia'];
      }
    } catch (error) {
      console.error('Unexpected error fetching locations:', error);
      // Return fallback locations if API fails
      return ['Remote', 'United States', 'Malaysia', 'Singapore', 'Canada', 'Australia'];
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.length >= 2) {
      setIsLoading(true);
      const filtered = await fetchLocations(newValue);
      setSuggestions(filtered);
      setIsLoading(false);
      if (filtered.length > 0) {
        setIsOpen(true);
      }
    } else if (newValue.length === 0) {
      setIsLoading(true);
      const popular = await fetchLocations('');
      setSuggestions(popular);
      setIsLoading(false);
      if (popular.length > 0) {
        setIsOpen(true);
      }
    } else {
      // Don't close immediately for single character
      setSuggestions([]);
    }
  };

  const handleInputFocus = async (e: React.FocusEvent<HTMLInputElement>) => {
    // Only select all text if the input is empty
    // This allows normal typing and cursor positioning when there's existing text
    if (!value || value.length === 0) {
      e.target.select();
    }
    
    // Always open dropdown on focus (even if already open, to ensure it's visible)
    setIsOpen(true);
    setIsLoading(true);
    const popular = await fetchLocations('');
    setSuggestions(popular);
    setIsLoading(false);
  };

  const handleSelectLocation = (location: string) => {
    // If "Any location" is selected, clear the filter (empty string)
    if (location === 'Any location') {
      onChange('');
    } else {
      onChange(location);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative z-50">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
          autoComplete="off"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        />
      </div>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-y-auto" 
          style={{ ...dropdownStyle }}
        >
          {isLoading ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                <span className="text-sm">Loading locations...</span>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((location, index) => {
              const isAnyLocation = location === 'Any location';
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectLocation(location)}
                  className={`w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                    isAnyLocation ? 'font-semibold bg-gray-50 dark:bg-gray-700/50' : ''
                  }`}
                >
                  {isAnyLocation ? (
                    <span className="w-4 h-4 flex-shrink-0 text-gray-500 dark:text-gray-400">🌍</span>
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm truncate ${isAnyLocation ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white'}`}>
                    {location}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

