// home/ubuntu/impaktrweb/src/components/organization/CorporateKPIs.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Clock, Leaf } from 'lucide-react';

interface KPIData {
  impactScore?: number;
  participationRate?: number;
  volunteerHours?: number;
  carbonOffset?: number;
}

interface CorporateKPIsProps {
  kpis: KPIData;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: number;
  icon: React.ReactNode;
  iconBgColor: string;
}

function KPICard({ title, value, subtitle, trend, icon, iconBgColor }: KPICardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconBgColor}`} style={{ backgroundColor: iconBgColor.includes('bg-') ? undefined : iconBgColor }}>
            {icon}
          </div>
          {trend !== undefined && (
            <div className={`flex items-center space-x-1 text-sm font-medium ${
              trendPositive ? 'text-green-600 dark:text-green-400' : 
              trendNegative ? 'text-red-600 dark:text-red-400' : 
              'text-gray-600 dark:text-gray-400'
            }`}>
              {trendPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : trendNegative ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CorporateKPIs({ kpis }: CorporateKPIsProps) {
  // Mock trend data - in production, calculate from historical data
  const trends = {
    impactScore: 12.5,
    participationRate: 8.3,
    volunteerHours: 15.7,
    carbonOffset: 22.1,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Impact Score"
        value={(kpis?.impactScore || 0).toLocaleString()}
        subtitle="Organization-wide achievements"
        trend={trends.impactScore}
        icon={<TrendingUp className="h-6 w-6 text-white" />}
        iconBgColor="bg-blue-600"
      />

      <KPICard
        title="Employee Participation"
        value={`${(kpis?.participationRate || 0).toFixed(1)}%`}
        subtitle="Active this month"
        trend={trends.participationRate}
        icon={<Users className="h-6 w-6 text-white" />}
        iconBgColor="bg-purple-600"
      />

      <KPICard
        title="Volunteer Hours"
        value={(kpis?.volunteerHours || 0).toLocaleString()}
        subtitle="Contributed this month"
        trend={trends.volunteerHours}
        icon={<Clock className="h-6 w-6 text-white" />}
        iconBgColor="#f97316"
      />

      <KPICard
        title="Carbon Offset"
        value={`${(kpis?.carbonOffset || 0).toLocaleString()} kg`}
        subtitle="CO₂ reduced this quarter"
        trend={trends.carbonOffset}
        icon={<Leaf className="h-6 w-6 text-white" />}
        iconBgColor="bg-green-600"
      />
    </div>
  );
}