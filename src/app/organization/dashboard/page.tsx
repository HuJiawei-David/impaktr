// home/ubuntu/impaktrweb/src/app/organization/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Building2, Award, TrendingUp, Zap } from 'lucide-react';
import CorporateKPIs from '@/components/organization/CorporateKPIs';
import OrganizationSidebar from '@/components/organization/OrganizationSidebar';
import { UnifiedFeed } from '@/components/dashboard/UnifiedFeed';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface OrganizationData {
  id: string;
  name: string;
  logo: string | null;
  type: string;
  subscriptionTier: string;
  esgScore: number | null;
  volunteerHours: number;
  participationRate: number;
  averageImpactScore: number;
  industry: string | null;
  employeeCount: number | null;
  maxMembers: number;
  maxEvents: number;
  currentPeriodEnd?: Date | null;
}

interface DashboardData {
  organization: OrganizationData;
  kpis: {
    impactScore: number;
    participationRate: number;
    volunteerHours: number;
    carbonOffset: number;
  };
  members: Array<{
    id: string;
    user: {
      name: string | null;
      email: string;
      image: string | null;
      impactScore: number;
    };
    role: string;
    status: string;
  }>;
  recentEvents: Array<{
    id: string;
    title: string;
    startDate: string;
    currentParticipants: number;
  }>;
  leaderboardPosition: {
    rank: number;
    total: number;
  };
}

const getTierColor = (tier: string) => {
  const colors: Record<string, string> = {
    REGISTERED: 'bg-gray-500',
    STARTER: 'bg-blue-500',
    ACTIVE_CONTRIBUTOR: 'bg-green-500',
    COMMUNITY_BUILDER: 'bg-purple-500',
    IMPACT_PIONEER: 'bg-orange-500',
    CHANGE_CATALYST: 'bg-pink-500',
    SUSTAINABILITY_CHAMPION: 'bg-teal-500',
    INNOVATION_LEADER: 'bg-indigo-500',
    GLOBAL_IMPACT_LEADER: 'bg-gradient-to-r from-yellow-400 to-orange-500',
  };
  return colors[tier] || 'bg-gray-500';
};

const getOrganizationTypeDisplay = (type: string) => {
  const typeMap: Record<string, string> = {
    'NGO': 'Non-Profit Organization',
    'COMPANY': 'Company',
    'CORPORATE': 'Company',
    'SCHOOL': 'Educational Institution',
    'HEALTHCARE': 'Healthcare Organization',
    'REGISTERED': 'Registered',
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
};

const getSubscriptionTierDisplay = (tier: string) => {
  const tierMap: Record<string, string> = {
    'REGISTERED': 'Free',
    'STARTER': 'Starter',
    'ACTIVE_CONTRIBUTOR': 'Active Contributor',
    'COMMUNITY_BUILDER': 'Community Builder',
    'IMPACT_PIONEER': 'Impact Pioneer',
    'CHANGE_CATALYST': 'Change Catalyst',
    'SUSTAINABILITY_CHAMPION': 'Sustainability Champion',
    'INNOVATION_LEADER': 'Innovation Leader',
    'GLOBAL_IMPACT_LEADER': 'Global Impact Leader',
  };
  return tierMap[tier] || tier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function OrganizationDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/organizations/dashboard');
      
      if (response.status === 401) {
        // Authentication error, redirect to signin
        console.log('Authentication error, redirecting to signin');
        router.push('/signin');
        return;
      }

      if (response.status === 404) {
        // User is not part of an organization, show error instead of redirecting to prevent loops
        setError('You are not associated with any organization. Please complete your organization profile or contact support.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch organization data');
      }

      const data = await response.json();
      setDashboardData(data);
      
      // Check if current user is admin/owner
      if (session?.user?.id && data.members) {
        const currentUserMembership = data.members.find(
          (m: { user: { email: string; id?: string }; role: string }) => 
            (session.user.email && m.user.email === session.user.email) || 
            (session.user.id && m.user.id === session.user.id)
        );
        const userIsAdmin = currentUserMembership?.role === 'admin' || 
                            currentUserMembership?.role === 'owner';
        console.log('🔍 Admin check:', { 
          userEmail: session.user.email, 
          userId: session.user.id,
          membership: currentUserMembership,
          role: currentUserMembership?.role,
          isAdmin: userIsAdmin,
          allMembers: data.members.map((m: { user: { email: string }; role: string }) => ({ email: m.user.email, role: m.role }))
        });
        setIsAdmin(userIsAdmin);
      } else {
        // If no membership found, default to showing create post (will be validated on backend)
        console.log('⚠️ No membership found, defaulting to allow create post');
        setIsAdmin(true); // Allow posting, backend will validate
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [router, session?.user?.id, session?.user?.email]);

  useEffect(() => {
    // Don't redirect - just fetch data if we have a session
    if (status === 'loading') return;
    
    if (session && !hasRedirected.current) {
      hasRedirected.current = true;
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen pt-[10px] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-[10px] flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full border-0 shadow-sm bg-white dark:bg-gray-800">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { organization } = dashboardData;


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">

        {/* Compact Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {/* Left: Organization Info */}
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <Avatar className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2">
                    {organization.logo ? (
                      <Image 
                        src={organization.logo} 
                        alt={organization.name} 
                        width={64} 
                        height={64} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-xl">
                        {organization.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </Avatar>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <div className="text-white text-center">
                      <Building2 className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-xs font-medium">Edit</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {organization.name}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`${getTierColor(organization.subscriptionTier)} text-white`}>
                      {getSubscriptionTierDisplay(organization.subscriptionTier)}
                    </Badge>
                    <Badge className="bg-purple-600 dark:bg-purple-500 text-white border-0">
                      {getOrganizationTypeDisplay(organization.type)}
                    </Badge>
                    {organization.industry && (
                      <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                        {organization.industry}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Quick Stats */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.kpis?.impactScore?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Impact Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.members?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {dashboardData.recentEvents?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Feed Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPIs */}
            <CorporateKPIs kpis={dashboardData.kpis} />
            
            {/* Unified Social Feed - Same as Individual Dashboard */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Feed
              </h2>
              <UnifiedFeed 
                type="all" 
                limit={10}
                showCreatePost={true}
                organizationId={organization.id}
                isOrganizationAdmin={true}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <OrganizationSidebar organizationId={organization.id} />
          </div>
        </div>
      </div>
    </div>
  );
}