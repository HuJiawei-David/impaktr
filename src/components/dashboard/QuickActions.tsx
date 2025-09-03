// home/ubuntu/impaktrweb/src/components/dashboard/QuickActions.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Calendar, 
  Upload, 
  Users, 
  Award, 
  Share2,
  Search,
  BookOpen,
  DollarSign,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  badge?: string;
  disabled?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'create-event',
    title: 'Create Event',
    description: 'Start a new volunteering opportunity',
    icon: Plus,
    href: '/events/create',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20 hover:bg-blue-200 dark:hover:bg-blue-900/30'
  },
  {
    id: 'join-event',
    title: 'Find Events',
    description: 'Discover opportunities near you',
    icon: Search,
    href: '/events',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30'
  },
  {
    id: 'log-hours',
    title: 'Log Hours',
    description: 'Record your volunteer activity',
    icon: Upload,
    href: '/hours/log',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30'
  },
  {
    id: 'view-calendar',
    title: 'My Calendar',
    description: 'View your upcoming events',
    icon: Calendar,
    href: '/calendar',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20 hover:bg-orange-200 dark:hover:bg-orange-900/30'
  },
  {
    id: 'invite-friends',
    title: 'Invite Friends',
    description: 'Share Impaktr with others',
    icon: Users,
    href: '/invite',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20 hover:bg-pink-200 dark:hover:bg-pink-900/30'
  },
  {
    id: 'view-certificates',
    title: 'Certificates',
    description: 'Download & share your achievements',
    icon: Award,
    href: '/certificates',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20 hover:bg-yellow-200 dark:hover:bg-yellow-900/30',
    badge: 'New'
  },
  {
    id: 'share-profile',
    title: 'Share Profile',
    description: 'Show your impact to the world',
    icon: Share2,
    href: '/profile?share=true',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20 hover:bg-indigo-200 dark:hover:bg-indigo-900/30'
  },
  {
    id: 'apply-scholarship',
    title: 'Scholarships',
    description: 'Find funding opportunities',
    icon: BookOpen,
    href: '/scholarships',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/20 hover:bg-teal-200 dark:hover:bg-teal-900/30'
  },
  {
    id: 'make-donation',
    title: 'Donate',
    description: 'Support causes you care about',
    icon: DollarSign,
    href: '/donate',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30'
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Connect with like-minded people',
    icon: MessageSquare,
    href: '/community',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/20 hover:bg-cyan-200 dark:hover:bg-cyan-900/30'
  }
];

export function QuickActions() {
  // Get personalized actions based on user activity and preferences
  const getPersonalizedActions = () => {
    // This would normally be based on user data, current time, etc.
    const currentTime = new Date();
    const isWeekend = currentTime.getDay() === 0 || currentTime.getDay() === 6;
    
    let actions = [...quickActions];
    
    // Prioritize certain actions based on context
    if (isWeekend) {
      // Move event-related actions to the top on weekends
      actions = actions.sort((a, b) => {
        if (a.id.includes('event')) return -1;
        if (b.id.includes('event')) return 1;
        return 0;
      });
    }
    
    // Show top 6 actions
    return actions.slice(0, 6);
  };

  const personalizedActions = getPersonalizedActions();

  const handleQuickAction = (actionId: string) => {
    // Track analytics for quick action usage
    console.log('Quick action clicked:', actionId);
    
    // Could add additional logic here for specific actions
    switch (actionId) {
      case 'share-profile':
        // Could trigger share modal instead of navigation
        break;
      case 'invite-friends':
        // Could trigger invite modal
        break;
      default:
        // Normal navigation handled by Link component
        break;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Quick Actions
          </span>
          <Link href="/dashboard/actions">
            <Button variant="ghost" size="sm" className="text-xs">
              See All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {personalizedActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.id}
              href={action.href}
              onClick={() => handleQuickAction(action.id)}
              className={`group relative p-4 rounded-lg transition-all duration-200 hover:shadow-md ${action.bgColor} ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {/* Badge */}
              {action.badge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs"
                >
                  {action.badge}
                </Badge>
              )}
              
              {/* Icon */}
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-md ${action.bgColor.replace('hover:', '')}`}>
                  <Icon className={`w-4 h-4 ${action.color} group-hover:scale-110 transition-transform`} />
                </div>
              </div>
              
              {/* Content */}
              <div>
                <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-tight">
                  {action.description}
                </p>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
            </Link>
          );
        })}
      </CardContent>
      
      {/* Footer with additional actions */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">
            {quickActions.length - personalizedActions.length} more actions available
          </div>
          <Link href="/dashboard/customize">
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
              Customize
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}