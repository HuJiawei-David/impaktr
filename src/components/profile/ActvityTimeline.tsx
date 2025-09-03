// home/ubuntu/impaktrweb/src/components/profile/ActivityTimeline.tsx

'use client';

import React from 'react';
import { 
  Calendar, 
  Award, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Heart,
  BookOpen,
  Zap,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTimeAgo, formatDate } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'event_joined' | 'event_completed' | 'badge_earned' | 'rank_up' | 'milestone' | 'verification' | 'certificate_shared';
  title: string;
  description: string;
  date: string;
  points: number;
  metadata?: {
    eventId?: string;
    eventTitle?: string;
    badgeId?: string;
    badgeName?: string;
    sdgNumber?: number;
    oldRank?: string;
    newRank?: string;
    milestoneType?: string;
    hoursContributed?: number;
    certificateType?: string;
    verificationMethod?: string;
  };
}

interface ActivityTimelineProps {
  activities: Activity[];
  showLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'event_joined':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'event_completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'badge_earned':
      return <Award className="w-4 h-4 text-yellow-500" />;
    case 'rank_up':
      return <TrendingUp className="w-4 h-4 text-purple-500" />;
    case 'milestone':
      return <Target className="w-4 h-4 text-orange-500" />;
    case 'verification':
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    case 'certificate_shared':
      return <BookOpen className="w-4 h-4 text-indigo-500" />;
    default:
      return <Zap className="w-4 h-4 text-gray-500" />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'event_joined':
      return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
    case 'event_completed':
      return 'border-green-200 bg-green-50 dark:bg-green-950/20';
    case 'badge_earned':
      return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
    case 'rank_up':
      return 'border-purple-200 bg-purple-50 dark:bg-purple-950/20';
    case 'milestone':
      return 'border-orange-200 bg-orange-50 dark:bg-orange-950/20';
    case 'verification':
      return 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20';
    case 'certificate_shared':
      return 'border-indigo-200 bg-indigo-50 dark:bg-indigo-950/20';
    default:
      return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
  }
};

export function ActivityTimeline({ 
  activities, 
  showLoadMore = false, 
  onLoadMore, 
  isLoading = false 
}: ActivityTimelineProps) {
  const groupActivitiesByDate = (activities: Activity[]) => {
    const groups: { [key: string]: Activity[] } = {};
    
    activities.forEach((activity) => {
      const dateKey = formatDate(activity.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
          <p className="text-muted-foreground">
            Start participating in events to build your activity timeline!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center">
                <div className="text-sm font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {date}
                </div>
                <div className="flex-1 h-px bg-border ml-4" />
              </div>

              {/* Activities for this date */}
              <div className="space-y-3 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                
                {dateActivities.map((activity, index) => (
                  <div key={activity.id} className="relative flex items-start space-x-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center relative z-10">
                      {getActivityIcon(activity.type)}
                    </div>

                    {/* Activity content */}
                    <div className={`flex-1 p-4 rounded-lg border ${getActivityColor(activity.type)} min-h-[80px]`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{activity.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.date)}
                          </div>
                          {activity.points > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              +{activity.points} pts
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Activity metadata */}
                      {activity.metadata && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {activity.metadata.eventTitle && (
                            <Badge variant="outline" className="text-xs">
                              📅 {activity.metadata.eventTitle}
                            </Badge>
                          )}
                          
                          {activity.metadata.badgeName && (
                            <Badge variant="outline" className="text-xs">
                              🏆 {activity.metadata.badgeName}
                            </Badge>
                          )}

                          {activity.metadata.sdgNumber && (
                            <Badge 
                              variant="sdg" 
                              sdgNumber={activity.metadata.sdgNumber} 
                              className="text-xs"
                            >
                              SDG {activity.metadata.sdgNumber}
                            </Badge>
                          )}

                          {activity.metadata.newRank && (
                            <Badge variant="secondary" className="text-xs">
                              📈 {activity.metadata.oldRank} → {activity.metadata.newRank}
                            </Badge>
                          )}

                          {activity.metadata.hoursContributed && (
                            <Badge variant="outline" className="text-xs">
                              ⏱️ {activity.metadata.hoursContributed}h
                            </Badge>
                          )}

                          {activity.metadata.verificationMethod && (
                            <Badge variant="outline" className="text-xs">
                              ✓ {activity.metadata.verificationMethod}
                            </Badge>
                          )}

                          {activity.metadata.certificateType && (
                            <Badge variant="outline" className="text-xs">
                              📜 {activity.metadata.certificateType}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Special content for different activity types */}
                      {activity.type === 'rank_up' && activity.metadata?.newRank && (
                        <div className="mt-3 p-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-950/20 dark:to-pink-950/20 rounded border border-purple-200 dark:border-purple-800">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                              Congratulations on your promotion to {activity.metadata.newRank}!
                            </span>
                          </div>
                        </div>
                      )}

                      {activity.type === 'milestone' && activity.metadata?.milestoneType && (
                        <div className="mt-3 p-2 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-950/20 dark:to-yellow-950/20 rounded border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                              Milestone Achievement: {activity.metadata.milestoneType}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {showLoadMore && (
            <div className="text-center pt-6">
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Load More Activities
                  </>
                )}
              </button>
            </div>
          )}

          {/* Activity Summary */}
          <div className="pt-6 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {activities.filter(a => a.type === 'event_joined').length}
                </div>
                <div className="text-xs text-muted-foreground">Events Joined</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {activities.filter(a => a.type === 'event_completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {activities.filter(a => a.type === 'badge_earned').length}
                </div>
                <div className="text-xs text-muted-foreground">Badges Earned</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600">
                  {activities.reduce((sum, a) => sum + a.points, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}