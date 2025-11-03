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
  scoreBreakdown?: {
    hoursComponent: number;
    intensityComponent: number;
    skillComponent: number;
    qualityComponent: number;
    verificationComponent: number;
    locationComponent: number;
    change: number;
  } | null;
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
  eventsJoined?: number;
  eventsCompleted?: number;
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
      return 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40';
    case 'event_completed':
      return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40';
    case 'badge_earned':
      return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/40';
    case 'rank_up':
      return 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40';
    case 'milestone':
      return 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40';
    case 'verification':
      return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40';
    case 'certificate_shared':
      return 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40';
    default:
      return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50';
  }
};

export function ActivityTimeline({ 
  activities, 
  showLoadMore = false, 
  onLoadMore, 
  isLoading = false,
  eventsJoined,
  eventsCompleted
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
      <Card className="bg-white dark:bg-gray-800">
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
    <Card className="bg-white dark:bg-gray-800">
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
                
                {dateActivities.map((activity, index) => {
                  // Debug log for completed events
                  if (activity.type === 'event_completed') {
                    console.log('🎯 Rendering activity:', {
                      id: activity.id,
                      title: activity.title,
                      hasBreakdown: !!activity.scoreBreakdown,
                      breakdown: activity.scoreBreakdown
                    });
                  }
                  
                  return (
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
                            <Badge 
                              variant="secondary" 
                              className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 hover:from-blue-600 hover:to-purple-700"
                            >
                              +{activity.points.toFixed(1)} pts
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

                      {/* Score Breakdown (only for completed events with breakdown data) */}
                      {activity.type === 'event_completed' && activity.scoreBreakdown && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <details className="group">
                            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between list-none">
                              <span className="flex items-center gap-2">
                                <Zap className="w-3 h-3" />
                                View Score Breakdown
                              </span>
                              <span className="text-xs font-semibold text-primary">
                                +{activity.points.toFixed(1)} pts
                              </span>
                            </summary>
                            
                            <div className="mt-3 space-y-3 pt-2 text-xs">
                              {/* Component Explanations */}
                              <div className="space-y-2">
                                {/* Hours */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-blue-700 dark:text-blue-300">Hours (H):</span>
                                    <span className="font-bold text-blue-900 dark:text-blue-100">{activity.scoreBreakdown.hoursComponent.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Log-scaled: log₁₀(hours + 1) × 100. Prevents exploitation while rewarding contribution.
                                  </p>
                                </div>

                                {/* Intensity */}
                                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-orange-700 dark:text-orange-300">Intensity (I):</span>
                                    <span className="font-bold text-orange-900 dark:text-orange-100">{activity.scoreBreakdown.intensityComponent.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {activity.scoreBreakdown.intensityComponent === 1.0 
                                      ? "Standard volunteering (1.0x). Based on event type and difficulty."
                                      : activity.scoreBreakdown.intensityComponent > 1.0
                                      ? `High-intensity (${activity.scoreBreakdown.intensityComponent}x). Requires more effort.`
                                      : `Lower-intensity (${activity.scoreBreakdown.intensityComponent}x). Simpler tasks.`}
                                  </p>
                                </div>

                                {/* Skills */}
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-purple-700 dark:text-purple-300">Skills (S):</span>
                                    <span className="font-bold text-purple-900 dark:text-purple-100">{activity.scoreBreakdown.skillComponent.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {activity.scoreBreakdown.skillComponent === 1.0 
                                      ? "No skill match (1.0x). Skills not aligned with event."
                                      : `Your skills matched (${activity.scoreBreakdown.skillComponent}x)! Up to 40% bonus.`}
                                  </p>
                                </div>

                                {/* Quality */}
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-green-700 dark:text-green-300">Quality (Q):</span>
                                    <span className="font-bold text-green-900 dark:text-green-100">{activity.scoreBreakdown.qualityComponent.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {activity.scoreBreakdown.qualityComponent === 1.0 
                                      ? "Standard quality (1.0x). Good performance."
                                      : activity.scoreBreakdown.qualityComponent > 1.0
                                      ? `Excellent (${activity.scoreBreakdown.qualityComponent}x)! Rated highly.`
                                      : `Needs improvement (${activity.scoreBreakdown.qualityComponent}x).`}
                                  </p>
                                </div>

                                {/* Verification */}
                                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 p-3 rounded-lg border border-teal-200 dark:border-teal-800">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-teal-700 dark:text-teal-300">Verification (V):</span>
                                    <span className="font-bold text-teal-900 dark:text-teal-100">{activity.scoreBreakdown.verificationComponent.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {activity.scoreBreakdown.verificationComponent === 1.1 
                                      ? "Organizer verified (1.1x). Highest trust - organization confirmed."
                                      : activity.scoreBreakdown.verificationComponent === 1.05
                                      ? "GPS verified (1.05x). Location confirmed."
                                      : activity.scoreBreakdown.verificationComponent === 0.8
                                      ? "Self-verified (0.8x). Lower trust."
                                      : "Standard (1.0x). Peer-verified."}
                                  </p>
                                </div>

                                {/* Location */}
                                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">Location (L):</span>
                                    <span className="font-bold text-indigo-900 dark:text-indigo-100">{activity.scoreBreakdown.locationComponent.toFixed(2)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {activity.scoreBreakdown.locationComponent === 1.0 
                                      ? "Standard region (1.0x). Balanced adjustment."
                                      : activity.scoreBreakdown.locationComponent > 1.0
                                      ? `Developing region (${activity.scoreBreakdown.locationComponent}x). Greater impact.`
                                      : `Developed region (${activity.scoreBreakdown.locationComponent}x).`}
                                  </p>
                                </div>
                              </div>

                              {/* Formula */}
                              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg text-white">
                                <div className="text-xs font-semibold mb-2 opacity-90">FINAL CALCULATION:</div>
                                <div className="text-xs font-mono mb-2 bg-white/10 p-2 rounded">
                                  Score = (H × I × S × Q × V × L) × 0.1
                                </div>
                                <div className="text-xs font-mono mb-2 bg-white/10 p-2 rounded break-all">
                                  = ({activity.scoreBreakdown.hoursComponent.toFixed(2)} × {activity.scoreBreakdown.intensityComponent.toFixed(2)} × {activity.scoreBreakdown.skillComponent.toFixed(2)} × {activity.scoreBreakdown.qualityComponent.toFixed(2)} × {activity.scoreBreakdown.verificationComponent.toFixed(2)} × {activity.scoreBreakdown.locationComponent.toFixed(2)}) × 0.1
                                </div>
                                <div className="text-sm font-bold flex items-center justify-between bg-white/20 p-2 rounded">
                                  <span>Your Impact:</span>
                                  <span>{activity.points.toFixed(1)} points</span>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
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
                  {eventsJoined !== undefined 
                    ? eventsJoined 
                    : activities.filter(a => a.type === 'event_joined').length}
                </div>
                <div className="text-xs text-muted-foreground">Events Joined</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {eventsCompleted !== undefined 
                    ? eventsCompleted 
                    : activities.filter(a => a.type === 'event_completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {activities.filter(a => a.type === 'badge_earned').length}
                </div>
                <div className="text-xs text-muted-foreground">Badges Earned</div>
              </div>
              {activities.some(a => (a.points || 0) > 0) && (
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {activities.reduce((sum, a) => sum + (a.points || 0), 0).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Points</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}