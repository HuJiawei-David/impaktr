'use client';

import React from 'react';
import Link from 'next/link';
import { 
  MapPin,
  Clock,
  Users,
  Building,
  Heart,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSDGById } from '@/constants/sdgs';

interface Opportunity {
  id: string;
  title: string;
  description: string;
  status: string;
  isRemote: boolean;
  location?: string;
  deadline?: string;
  spots: number;
  spotsFilled: number;
  requirements: string[];
  skills: string[];
  sdg?: string;
  createdAt: string;
  organization: {
    name: string;
  };
  stats: {
    totalApplications: number;
    spotsRemaining: number;
  };
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  isBookmarked?: boolean;
  isApplied?: boolean;
  isApplying?: boolean;
  onBookmark?: (opportunityId: string) => void;
  onApply?: (opportunityId: string) => void;
}

const getBadgeColor = (text: string, type: 'requirement' | 'skill') => {
  const lowerText = text.toLowerCase();
  
  if (type === 'requirement') {
    if (lowerText.includes('experience') || lowerText.includes('years')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (lowerText.includes('skill') || lowerText.includes('ability')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (lowerText.includes('available') || lowerText.includes('time')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  } else if (type === 'skill') {
    if (lowerText.includes('technical') || lowerText.includes('programming')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    } else if (lowerText.includes('communication') || lowerText.includes('leadership')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    } else if (lowerText.includes('creative') || lowerText.includes('design')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    } else {
      return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  }
  
  // Default fallback
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'CLOSED':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isBookmarked = false,
  isApplied = false,
  isApplying = false,
  onBookmark,
  onApply
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <Link href={`/opportunities/${opportunity.id}`}>
          <div className="cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {opportunity.title}
                </h3>
                <Badge className={`px-3 py-1 ${getStatusColor(opportunity.status)}`}>
                  {opportunity.status}
                </Badge>
                {opportunity.isRemote && (
                  <Badge variant="outline" className="px-3 py-1">Remote</Badge>
                )}
              </div>
              {onBookmark && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onBookmark(opportunity.id);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10 relative"
                >
                  <Heart 
                    className={`w-5 h-5 ${
                      isBookmarked
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center space-x-1">
                <Building className="h-4 w-4" />
                <span>{opportunity.organization.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{opportunity.spotsFilled}/{opportunity.spots} filled</span>
              </div>
              {opportunity.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{opportunity.location}</span>
                </div>
              )}
              {opportunity.deadline && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Deadline: {formatDate(opportunity.deadline)}</span>
                </div>
              )}
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {opportunity.description}
            </p>

            {opportunity.requirements.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements:</h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.requirements.map((req, index) => (
                    <Badge key={index} className={`text-xs px-3 py-1 ${getBadgeColor(req, 'requirement')}`}>
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {opportunity.skills.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills.map((skill, index) => (
                    <Badge key={index} className={`text-xs px-3 py-1 ${getBadgeColor(skill, 'skill')}`}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {opportunity.sdg && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SDG Alignment:</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="sdg" sdgNumber={parseInt(opportunity.sdg)} className="text-xs px-3 py-1">
                    SDG {opportunity.sdg}: {(() => {
                      const sdgInfo = getSDGById(parseInt(opportunity.sdg!));
                      return sdgInfo ? sdgInfo.title : 'Unknown';
                    })()}
                  </Badge>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span>{opportunity.stats.totalApplications} applications</span>
                <span className="mx-2">•</span>
                <span>Posted {formatDate(opportunity.createdAt)}</span>
              </div>
              
              {onApply && (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onApply(opportunity.id);
                  }}
                  disabled={isApplying || opportunity.status !== 'OPEN' || opportunity.stats.spotsRemaining <= 0 || isApplied}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : isApplied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Applied
                    </>
                  ) : opportunity.status !== 'OPEN' ? (
                    'Closed'
                  ) : opportunity.stats.spotsRemaining <= 0 ? (
                    'Full'
                  ) : (
                    'Apply Now'
                  )}
                </Button>
              )}
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};
