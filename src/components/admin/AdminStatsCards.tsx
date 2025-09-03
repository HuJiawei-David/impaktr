// home/ubuntu/impaktrweb/src/components/admin/AdminStatsCards.tsx

'use client';

import React from 'react';
import { Users, Building2, Calendar, Award, TrendingUp, TrendingDown, DollarSign, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalEvents: number;
  totalHours: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
  pendingVerifications: number;
  systemHealth: number;
  userGrowthRate: number;
  orgGrowthRate: number;
  recentActivity: any[];
}

interface AdminStatsCardsProps {
  stats: AdminStats | null;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: stats.userGrowthRate,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Organizations',
      value: stats.totalOrganizations,
      change: stats.orgGrowthRate,
      icon: Building2,
      color: 'text-green-600'
    },
    {
      title: 'Active Events',
      value: stats.totalEvents,
      change: 18.2,
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      title: 'Impact Hours',
      value: stats.totalHours,
      change: 12.4,
      icon: Award,
      color: 'text-orange-600',
      format: 'number'
    },
    {
      title: 'Monthly Revenue',
      value: stats.monthlyRevenue,
      change: 23.1,
      icon: DollarSign,
      color: 'text-emerald-600',
      format: 'currency'
    },
    {
      title: 'Subscriptions',
      value: stats.activeSubscriptions,
      change: 8.7,
      icon: TrendingUp,
      color: 'text-indigo-600'
    },
    {
      title: 'Global Reach',
      value: 45, // Countries
      change: 12.5,
      icon: Globe,
      color: 'text-cyan-600'
    },
    {
      title: 'System Health',
      value: stats.systemHealth,
      change: 0.2,
      icon: TrendingUp,
      color: 'text-red-600',
      format: 'percentage'
    }
  ];

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return `$${formatNumber(value)}`;
      case 'percentage':
        return `${value}%`;
      case 'number':
        return formatNumber(value);
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositive = stat.change >= 0;
        
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {formatValue(stat.value, stat.format)}
              </div>
              <div className="flex items-center text-xs">
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{stat.change.toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}