// home/ubuntu/impaktrweb/src/components/ui/sdg-selector.tsx

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getSDGColor, getSDGName } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SDGSelectorProps {
  selectedSDGs: number[];
  onSelectionChange: (sdgs: number[]) => void;
  maxSelection?: number;
  showDescription?: boolean;
  compact?: boolean;
  showSelectAll?: boolean;
}

const sdgDescriptions = {
  1: 'End poverty in all its forms everywhere',
  2: 'End hunger, achieve food security and improved nutrition',
  3: 'Ensure healthy lives and promote well-being for all',
  4: 'Ensure inclusive and equitable quality education',
  5: 'Achieve gender equality and empower all women and girls',
  6: 'Ensure availability and sustainable management of water',
  7: 'Ensure access to affordable, reliable, sustainable energy',
  8: 'Promote sustained, inclusive and sustainable economic growth',
  9: 'Build resilient infrastructure, promote inclusive industrialization',
  10: 'Reduce inequality within and among countries',
  11: 'Make cities and human settlements inclusive, safe, resilient',
  12: 'Ensure sustainable consumption and production patterns',
  13: 'Take urgent action to combat climate change',
  14: 'Conserve and sustainably use the oceans, seas and marine resources',
  15: 'Protect, restore and promote sustainable use of terrestrial ecosystems',
  16: 'Promote peaceful and inclusive societies for sustainable development',
  17: 'Strengthen the means of implementation and revitalize partnerships'
};

export function SDGSelector({ 
  selectedSDGs, 
  onSelectionChange, 
  maxSelection = 17,
  showDescription = true,
  compact = false,
  showSelectAll = false
}: SDGSelectorProps) {
  
  const handleSDGClick = (sdgNumber: number) => {
    if (selectedSDGs.includes(sdgNumber)) {
      // Remove SDG
      onSelectionChange(selectedSDGs.filter(sdg => sdg !== sdgNumber));
    } else if (selectedSDGs.length < maxSelection) {
      // Add SDG
      onSelectionChange([...selectedSDGs, sdgNumber]);
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
          {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgNumber) => {
            const isSelected = selectedSDGs.includes(sdgNumber);
            const isDisabled = !isSelected && selectedSDGs.length >= maxSelection;
            
            return (
              <button
                key={sdgNumber}
                onClick={() => !isDisabled && handleSDGClick(sdgNumber)}
                disabled={isDisabled}
                className={cn(
                  "relative aspect-square rounded-lg border-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                  isSelected 
                    ? "border-white dark:border-blue-300 shadow-lg dark:shadow-blue-500/30 scale-105" 
                    : "border-transparent hover:border-white/30 dark:hover:border-blue-300/30"
                )}
                style={{ 
                  backgroundColor: getSDGColor(sdgNumber),
                  opacity: isDisabled ? 0.5 : 1
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-1">
                  <div className="text-xs font-bold">SDG</div>
                  <div className="text-lg font-bold leading-none">{sdgNumber}</div>
                </div>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-700 rounded-full" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedSDGs.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Selected SDGs ({selectedSDGs.length}/{maxSelection}):
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedSDGs.sort((a, b) => a - b).map((sdgNumber) => (
                <Badge
                  key={sdgNumber}
                  variant="sdg"
                  sdgNumber={sdgNumber}
                  className="text-xs cursor-pointer hover:opacity-80"
                  onClick={() => handleSDGClick(sdgNumber)}
                >
                  SDG {sdgNumber} ×
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showSelectAll && (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedSDGs.length}</span>
            <span className="text-gray-600 dark:text-gray-300"> of 17 SDGs selected</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSelectionChange(Array.from({ length: 17 }, (_, i) => i + 1))}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onSelectionChange([])}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2">
        {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgNumber) => {
          const isSelected = selectedSDGs.includes(sdgNumber);
          const isDisabled = !isSelected && selectedSDGs.length >= maxSelection;
          
          return (
            <button
              key={sdgNumber}
              type="button"
              onClick={() => !isDisabled && handleSDGClick(sdgNumber)}
              className={`relative w-full text-left rounded-lg border transition-all duration-150 ${
                isSelected 
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-800 dark:border-blue-400 shadow-lg dark:shadow-blue-500/30" 
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/80"
              } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
              style={isSelected ? { 
                backgroundColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#1e40af' : undefined 
              } : {}}
            >
              <div className="flex items-start gap-4 p-4">
                {/* SDG Icon Badge */}
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: getSDGColor(sdgNumber) }}
                >
                  {sdgNumber}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-baseline gap-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                      SDG {sdgNumber}: {getSDGName(sdgNumber)}
                    </h4>
                  </div>
                  
                  {showDescription && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {sdgDescriptions[sdgNumber as keyof typeof sdgDescriptions]}
                    </p>
                  )}
                </div>

                {/* Selection Indicator */}
                <div className="flex-shrink-0 pt-1">
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-blue-600 border-blue-600"
                      : "border-gray-300 dark:border-gray-600"
                  )}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div className="text-sm">
          <span className="font-medium">{selectedSDGs.length}</span>
          <span className="text-muted-foreground"> of {maxSelection} SDGs selected</span>
        </div>
        
        {selectedSDGs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedSDGs.sort((a, b) => a - b).slice(0, 5).map((sdgNumber) => (
              <Badge
                key={sdgNumber}
                variant="sdg"
                sdgNumber={sdgNumber}
                className="text-xs"
              >
                {sdgNumber}
              </Badge>
            ))}
            {selectedSDGs.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedSDGs.length - 5} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {maxSelection < 17 && selectedSDGs.length >= maxSelection && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You&apos;ve reached the maximum selection limit. Click on selected SDGs to remove them if you want to choose different ones.
          </p>
        </div>
      )}
    </div>
  );
}