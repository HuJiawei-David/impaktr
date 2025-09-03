// home/ubuntu/impaktrweb/src/components/dashboard/StatsCards.tsx

'use client';

import React from 'react';
import { Clock, Award, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatHours, formatNumber } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, change, changeLabel, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center space-x-1 text-xs">
                <TrendingUp className={`w-3 h-3 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {change >= 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  // This would normally come from an API call
  const stats = [
    {
      title: 'Total Impact Hours',
      value: '87.5',
      change: 23,
      changeLabel: 'this month',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Badges Earned',
      value: '12',
      change: 15,
      changeLabel: 'this month',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Events Joined',
      value: '34',
      change: 8,
      changeLabel: 'this month',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Global Rank',
      value: '#2,847',
      change: -5,
      changeLabel: 'positions',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}