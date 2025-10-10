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
  compact = false
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
                    ? "border-white shadow-lg scale-105" 
                    : "border-transparent hover:border-white/30"
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
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgNumber) => {
          const isSelected = selectedSDGs.includes(sdgNumber);
          const isDisabled = !isSelected && selectedSDGs.length >= maxSelection;
          
          return (
            <Card
              key={sdgNumber}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                isSelected && "ring-2 ring-primary shadow-lg scale-105",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => !isDisabled && handleSDGClick(sdgNumber)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {/* SDG Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: getSDGColor(sdgNumber) }}
                  >
                    <div className="text-xs font-bold">SDG</div>
                    <div className="text-lg font-bold leading-none">{sdgNumber}</div>
                  </div>

                  {/* SDG Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm leading-tight">
                        {getSDGName(sdgNumber)}
                      </h4>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    
                    {showDescription && (
                      <p className="text-xs text-muted-foreground leading-tight">
                        {sdgDescriptions[sdgNumber as keyof typeof sdgDescriptions]}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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