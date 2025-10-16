'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Target,
  Zap
} from 'lucide-react';
import Link from 'next/link';

interface TopContributor {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  impactScore: number;
  volunteerHours: number;
  eventsParticipated: number;
}

interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

interface PendingAction {
  id: string;
  type: 'verification' | 'certificate' | 'invitation';
  title: string;
  description: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

interface OrganizationSidebarProps {
  organizationId: string;
  quickStats?: QuickStat[];
  topContributors?: TopContributor[];
  pendingActions?: PendingAction[];
}

const defaultQuickStats: QuickStat[] = [
  {
    label: 'Active This Week',
    value: 12,
    change: 15,
    icon: <Users className="h-4 w-4" />,
    color: 'text-green-600'
  },
  {
    label: 'Upcoming Events',
    value: 3,
    change: -2,
    icon: <Calendar className="h-4 w-4" />,
    color: 'text-blue-600'
  },
  {
    label: 'Badges Earned',
    value: 5,
    change: 1,
    icon: <Award className="h-4 w-4" />,
    color: 'text-purple-600'
  },
  {
    label: 'Pending Actions',
    value: 7,
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'text-orange-600'
  }
];

const defaultTopContributors: TopContributor[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Volunteer Coordinator',
    impactScore: 1250,
    volunteerHours: 45,
    eventsParticipated: 8
  },
  {
    id: '2',
    name: 'Mike Chen',
    role: 'Event Manager',
    impactScore: 980,
    volunteerHours: 38,
    eventsParticipated: 6
  },
  {
    id: '3',
    name: 'Alex Rodriguez',
    role: 'Sustainability Lead',
    impactScore: 750,
    volunteerHours: 28,
    eventsParticipated: 5
  }
];

const defaultPendingActions: PendingAction[] = [
  {
    id: '1',
    type: 'verification',
    title: 'Verify Participations',
    description: 'Review volunteer hours',
    count: 5,
    priority: 'high'
  },
  {
    id: '2',
    type: 'certificate',
    title: 'Issue Certificates',
    description: 'Generate completion certificates',
    count: 3,
    priority: 'medium'
  },
  {
    id: '3',
    type: 'invitation',
    title: 'Pending Invitations',
    description: 'New member invitations',
    count: 2,
    priority: 'low'
  }
];

export default function OrganizationSidebar({ 
  organizationId, 
  quickStats = defaultQuickStats,
  topContributors = defaultTopContributors,
  pendingActions = defaultPendingActions
}: OrganizationSidebarProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/organization/events/create" className="block">
            <Button className="w-full justify-start h-11 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700" variant="outline">
              <Plus className="h-4 w-4 mr-3" />
              Create Event
            </Button>
          </Link>
          <Link href="/organization/members/invite" className="block">
            <Button className="w-full justify-start h-11 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700" variant="outline">
              <Users className="h-4 w-4 mr-3" />
              Invite Member
            </Button>
          </Link>
          <Link href="/organization/esg" className="block">
            <Button className="w-full justify-start h-11 px-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700" variant="outline">
              <Target className="h-4 w-4 mr-3" />
              Update ESG Data
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 dark:text-white">This Week</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {stat.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              </div>
              {stat.change !== undefined && (
                <div className={`text-sm font-medium ${
                  stat.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 dark:text-white">Top Contributors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topContributors.map((contributor, index) => (
            <div key={contributor.id} className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  {contributor.avatar ? (
                    <AvatarImage src={contributor.avatar} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm">
                      {contributor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                {index === 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Star className="h-3 w-3 text-white fill-current" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {contributor.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {contributor.role}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {contributor.impactScore} pts
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {contributor.volunteerHours}h
                  </span>
                </div>
              </div>
            </div>
          ))}
          <Link href="/organization/members" className="block">
            <Button variant="ghost" size="sm" className="w-full h-10 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              View All Members
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 dark:text-white">Pending Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingActions.map((action) => (
            <div key={action.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                  {getPriorityIcon(action.priority)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {action.count}
              </Badge>
            </div>
          ))}
          <Link href="/organization/verifications" className="block">
            <Button variant="ghost" size="sm" className="w-full h-10 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              Manage All Actions
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Badges Preview */}
      <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 dark:text-white">Recent Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Climate Action Champion
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                SDG 13 • Earned 2 days ago
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Community Builder
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Impact • Earned 1 week ago
              </p>
            </div>
          </div>
          <Link href="/organization/achievements" className="block">
            <Button variant="ghost" size="sm" className="w-full h-10 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              View All Badges
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
