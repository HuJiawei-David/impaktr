// home/ubuntu/impaktrweb/src/components/events/EventFilters.tsx

'use client';

import React from 'react';
import { CalendarDays, MapPin, Award, Users, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { countries } from '@/constants/countries';

interface EventFilters {
  search: string;
  sdg?: number;
  location?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  sortBy: string;
  intensity?: string;
  participantRange?: string;
  verificationType?: string;
  skills?: string[];
}

interface EventFiltersProps {
  filters: EventFilters;
  onFilterChange: (filters: Partial<EventFilters>) => void;
  onClear: () => void;
}

export function EventFilters({ filters, onFilterChange, onClear }: EventFiltersProps) {
  const [selectedSDGs, setSelectedSDGs] = React.useState<number[]>(
    filters.sdg ? [filters.sdg] : []
  );

  const handleSDGChange = (sdgs: number[]) => {
    setSelectedSDGs(sdgs);
    onFilterChange({ sdg: sdgs[0] }); // For now, just use the first selected SDG
  };

  const skillOptions = [
    'Teaching', 'Coding', 'Design', 'Marketing', 'Photography',
    'Writing', 'Translation', 'Medical', 'Construction', 'Gardening',
    'Cooking', 'Event Planning', 'Fundraising', 'Public Speaking',
    'Social Media', 'Data Analysis', 'Project Management'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Filter Events</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear All Filters
        </Button>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <CalendarDays className="w-4 h-4 mr-2" />
          Date Range
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="startDate" className="text-sm text-muted-foreground">From</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-sm text-muted-foreground">To</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              min={filters.startDate}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Location
        </Label>
        <Select value={filters.location || ''} onValueChange={(value) => onFilterChange({ location: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Locations</SelectItem>
            <SelectItem value="virtual">Virtual Only</SelectItem>
            <SelectItem value="kuala-lumpur">Kuala Lumpur</SelectItem>
            <SelectItem value="selangor">Selangor</SelectItem>
            <SelectItem value="penang">Penang</SelectItem>
            <SelectItem value="johor">Johor</SelectItem>
            <SelectItem value="singapore">Singapore</SelectItem>
            {countries.slice(0, 10).map((country) => (
              <SelectItem key={country.code} value={country.name.toLowerCase()}>
                {country.flag} {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* SDG Focus */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <Award className="w-4 h-4 mr-2" />
          SDG Focus
        </Label>
        <SDGSelector
          selectedSDGs={selectedSDGs}
          onSelectionChange={handleSDGChange}
          maxSelection={3}
          compact={true}
          showDescription={false}
        />
      </div>

      {/* Event Size */}
      <div className="space-y-3">
        <Label className="flex items-center">
          <Users className="w-4 h-4 mr-2" />
          Event Size
        </Label>
        <Select 
          value={filters.participantRange || ''} 
          onValueChange={(value) => onFilterChange({ participantRange: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any size</SelectItem>
            <SelectItem value="1-10">Small (1-10 people)</SelectItem>
            <SelectItem value="11-50">Medium (11-50 people)</SelectItem>
            <SelectItem value="51-200">Large (51-200 people)</SelectItem>
            <SelectItem value="200+">Very Large (200+ people)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Intensity Level */}
      <div className="space-y-3">
        <Label>Intensity Level</Label>
        <Select 
          value={filters.intensity || ''} 
          onValueChange={(value) => onFilterChange({ intensity: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any intensity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any intensity</SelectItem>
            <SelectItem value="low">Light (0.8x)</SelectItem>
            <SelectItem value="medium">Medium (1.0x)</SelectItem>
            <SelectItem value="high">High (1.2x)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verification Type */}
      <div className="space-y-3">
        <Label>Verification Method</Label>
        <Select 
          value={filters.verificationType || ''} 
          onValueChange={(value) => onFilterChange({ verificationType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any verification</SelectItem>
            <SelectItem value="organizer">Organizer Verified</SelectItem>
            <SelectItem value="peer">Peer Verified</SelectItem>
            <SelectItem value="gps">GPS Verified</SelectItem>
            <SelectItem value="self">Self Reported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Skills Required */}
      <div className="space-y-3">
        <Label>Skills Required</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {skillOptions.slice(0, 12).map((skill) => (
            <label key={skill} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={filters.skills?.includes(skill) || false}
                onChange={(e) => {
                  const currentSkills = filters.skills || [];
                  if (e.target.checked) {
                    onFilterChange({ skills: [...currentSkills, skill] });
                  } else {
                    onFilterChange({ 
                      skills: currentSkills.filter(s => s !== skill) 
                    });
                  }
                }}
              />
              <span className="text-sm">{skill}</span>
            </label>
          ))}
        </div>
        {filters.skills && filters.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.skills.map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  onFilterChange({ 
                    skills: filters.skills?.filter(s => s !== skill) 
                  });
                }}
              >
                {skill} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="space-y-3">
        <Label>Quick Filters</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'This Weekend', value: 'weekend' },
            { label: 'Next Week', value: 'next-week' },
            { label: 'Virtual Only', value: 'virtual' },
            { label: 'Beginner Friendly', value: 'beginner' },
            { label: 'Certificate Provided', value: 'certificate' }
          ].map((quick) => (
            <Button
              key={quick.value}
              variant="outline"
              size="sm"
              onClick={() => {
                // Handle quick filter logic
                switch (quick.value) {
                  case 'virtual':
                    onFilterChange({ location: 'virtual' });
                    break;
                  case 'weekend':
                    // Set date range for this weekend
                    const thisWeekend = new Date();
                    const saturday = new Date(thisWeekend.setDate(thisWeekend.getDate() + (6 - thisWeekend.getDay())));
                    const sunday = new Date(saturday);
                    sunday.setDate(saturday.getDate() + 1);
                    onFilterChange({ 
                      startDate: saturday.toISOString().split('T')[0],
                      endDate: sunday.toISOString().split('T')[0]
                    });
                    break;
                  case 'beginner':
                    onFilterChange({ intensity: 'low' });
                    break;
                  default:
                    break;
                }
              }}
            >
              {quick.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Applied Filters Summary */}
      {Object.values(filters).some(v => v && v !== 'ACTIVE' && v !== 'startDate') && (
        <div className="pt-4 border-t border-border">
          <Label className="mb-2 block">Active Filters:</Label>
          <div className="flex flex-wrap gap-1">
            {filters.location && (
              <Badge variant="secondary">
                Location: {filters.location}
              </Badge>
            )}
            {filters.intensity && (
              <Badge variant="secondary">
                Intensity: {filters.intensity}
              </Badge>
            )}
            {filters.verificationType && (
              <Badge variant="secondary">
                Verification: {filters.verificationType}
              </Badge>
            )}
            {selectedSDGs.length > 0 && (
              <Badge variant="secondary">
                SDG: {selectedSDGs.join(', ')}
              </Badge>
            )}
            {filters.skills && filters.skills.length > 0 && (
              <Badge variant="secondary">
                Skills: {filters.skills.length} selected
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}