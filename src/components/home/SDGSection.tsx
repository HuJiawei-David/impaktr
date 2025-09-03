// home/ubuntu/impaktrweb/src/components/home/SDGSection.tsx

'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getSDGColor, getSDGName } from '@/lib/utils';
import { Globe, Target, Users, TrendingUp, ArrowRight, Calendar } from 'lucide-react';

const sdgData = [
  { id: 1, participants: 15420, events: 342 },
  { id: 2, participants: 12350, events: 278 },
  { id: 3, participants: 18760, events: 445 },
  { id: 4, participants: 21340, events: 523 },
  { id: 5, participants: 9870, events: 234 },
  { id: 6, participants: 14520, events: 367 },
  { id: 7, participants: 11240, events: 289 },
  { id: 8, participants: 16890, events: 412 },
  { id: 9, participants: 13670, events: 324 },
  { id: 10, participants: 10450, events: 256 },
  { id: 11, participants: 17230, events: 398 },
  { id: 12, participants: 12980, events: 301 },
  { id: 13, participants: 24560, events: 612 },
  { id: 14, participants: 8730, events: 198 },
  { id: 15, participants: 11450, events: 267 },
  { id: 16, participants: 7890, events: 178 },
  { id: 17, participants: 19340, events: 467 }
];

export function SDGSection() {
  const [selectedSDG, setSelectedSDG] = useState<number>(13); // Default to Climate Action
  const [hoveredSDG, setHoveredSDG] = useState<number | null>(null);

  const selectedData = sdgData.find(sdg => sdg.id === selectedSDG);
  const displaySDG = hoveredSDG || selectedSDG;
  const displayData = sdgData.find(sdg => sdg.id === displaySDG);

  return (
    <section className="py-24 bg-gradient-to-br from-background via-primary-50/30 to-secondary-50/30 dark:from-background dark:via-primary-950/30 dark:to-secondary-950/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            UN Sustainable Development Goals
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Impact Across All <span className="brand-gradient-text">17 SDGs</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of changemakers contributing to every UN Sustainable Development Goal. 
            Track your progress and earn verified badges across all impact areas.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* SDG Grid */}
          <div className="space-y-6">
            <h3 className="text-2xl font-semibold mb-6">Choose Your Impact Area</h3>
            
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: 17 }, (_, i) => i + 1).map((sdgNumber) => {
                const data = sdgData.find(sdg => sdg.id === sdgNumber);
                const isSelected = selectedSDG === sdgNumber;
                const isHovered = hoveredSDG === sdgNumber;
                
                return (
                  <button
                    key={sdgNumber}
                    onClick={() => setSelectedSDG(sdgNumber)}
                    onMouseEnter={() => setHoveredSDG(sdgNumber)}
                    onMouseLeave={() => setHoveredSDG(null)}
                    className={`
                      relative aspect-square rounded-lg transition-all duration-300 transform
                      ${isSelected ? 'scale-110 shadow-xl ring-2 ring-white ring-offset-2' : 'hover:scale-105 hover:shadow-lg'}
                      ${isHovered && !isSelected ? 'scale-105' : ''}
                    `}
                    style={{ backgroundColor: getSDGColor(sdgNumber) }}
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-1">
                      <div className="text-xs font-bold">SDG</div>
                      <div className="text-lg font-bold leading-none">{sdgNumber}</div>
                    </div>
                    
                    {/* Participant count indicator */}
                    <div className="absolute -top-1 -right-1 bg-white text-primary text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {data && data.participants > 1000 ? `${Math.floor(data.participants / 1000)}k` : data?.participants || 0}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Click on any SDG to see detailed impact statistics
            </div>
          </div>

          {/* Selected SDG Details */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div 
                className="h-3"
                style={{ backgroundColor: getSDGColor(displaySDG) }}
              />
              
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Badge 
                      variant="sdg" 
                      sdgNumber={displaySDG}
                      className="mb-3"
                    >
                      SDG {displaySDG}
                    </Badge>
                    <h3 className="text-2xl font-bold mb-2">
                      {getSDGName(displaySDG)}
                    </h3>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-3xl font-bold brand-gradient-text">
                      {displayData?.participants.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Contributors
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 rounded-lg bg-primary-50 dark:bg-primary-950/20">
                    <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{displayData?.events}</div>
                    <div className="text-sm text-muted-foreground">Active Events</div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">
                      {displayData ? Math.floor(displayData.participants * 2.3).toLocaleString() : 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Impact Hours</div>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span>Global Progress</span>
                    <span className="font-medium">
                      {displayData ? Math.floor((displayData.participants / 25000) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        backgroundColor: getSDGColor(displaySDG),
                        width: `${displayData ? Math.min((displayData.participants / 25000) * 100, 100) : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Call to Action */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1" variant="default">
                    <Target className="w-4 h-4 mr-2" />
                    Join SDG {displaySDG}
                  </Button>
                  <Button className="flex-1" variant="outline">
                    <Globe className="w-4 h-4 mr-2" />
                    View Events
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4">
                <div className="text-2xl font-bold text-primary">68</div>
                <div className="text-sm text-muted-foreground">Total Badges</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-green-600">4</div>
                <div className="text-sm text-muted-foreground">Badge Tiers</div>
              </div>
              <div className="p-4">
                <div className="text-2xl font-bold text-orange-600">∞</div>
                <div className="text-sm text-muted-foreground">Impact Potential</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-lg font-medium">
              Join <span className="font-bold text-primary">250,000+</span> changemakers already making an impact
            </span>
          </div>
          
          <Button size="lg" variant="gradient" className="group">
            Start Your SDG Journey
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}