// home/ubuntu/impaktrweb/src/app/organization/esg/page.tsx

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Leaf,
  TrendingUp,
  TrendingDown,
  Users,
  Droplets,
  Zap,
  Recycle,
  Heart,
  Scale,
  Shield,
  Upload,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  FileText,
  Plus,
  Eye,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import SuggestionPanel from './suggestion/SuggestionPanel';
import FavoriteEventsPanel from './favorites/FavoriteEventsPanel';
import { useEventNotificationStore } from '@/store/eventNotificationStore';

interface ESGData {
  organizationId: string;
  organizationName: string;
  period: string;
  calculatedAt: string;
  metrics: {
    environmental: {
      sdg6: number;  // Clean Water & Sanitation
      sdg7: number;  // Affordable & Clean Energy
      sdg11: number; // Sustainable Cities & Communities
      sdg12: number; // Responsible Consumption & Production
      sdg13: number; // Climate Action
      sdg14: number; // Life Below Water
      sdg15: number; // Life on Land
      total: number;
    };
    social: {
      sdg1: number;  // No Poverty
      sdg2: number;  // Zero Hunger
      sdg3: number;  // Good Health & Well-Being
      sdg4: number;  // Quality Education
      sdg5: number;  // Gender Equality
      sdg8: number;  // Decent Work & Economic Growth
      sdg10: number; // Reduced Inequalities
      total: number;
    };
    governance: {
      sdg16: number; // Peace, Justice & Strong Institutions
      sdg17: number; // Partnerships for the Goals
      sdg12_6: number; // Sustainability Reporting
      total: number;
    };
    overall: number;
  };
  breakdown: {
    environmental: {
      weight: number;
      score: number;
      sdgs: Record<string, number>;
    };
    social: {
      weight: number;
      score: number;
      sdgs: Record<string, number>;
    };
    governance: {
      weight: number;
      score: number;
      sdgs: Record<string, number>;
    };
  };
  dataCollectionStatus: {
    environmental: number;
    social: number;
    governance: number;
  };
  recentReports: Array<{
    id: string;
    type: string;
    period: string;
    status: 'submitted' | 'pending' | 'verified';
    submittedAt: string;
  }>;
}

function OrganizationESGContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [esgData, setESGData] = useState<ESGData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('annual');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Favorite event notification store
  const { newFavoriteCount, clearFavoriteCount } = useEventNotificationStore();

  const fetchESGData = useCallback(async (orgId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/esg-report?organizationId=${orgId}&period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ESG data');
      }
      
      const result = await response.json();
      // Use real data collection status from API response
      const esgDataWithDefaults = {
        ...result.data,
        dataCollectionStatus: result.data.dataCollectionStatus || {
          environmental: 0,
          social: 0,
          governance: 0
        },
        recentReports: [
          { id: '1', type: 'Quarterly Report', period: result.data.period, status: 'submitted', submittedAt: result.data.calculatedAt },
          { id: '2', type: 'Annual Report', period: '2024', status: 'verified', submittedAt: '2024-09-30' },
          { id: '3', type: 'Quarterly Report', period: '2024-Q3', status: 'verified', submittedAt: '2024-07-15' }
        ]
      };
      setESGData(esgDataWithDefaults);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching ESG data:', err);
      setLoading(false);
    }
  }, [selectedPeriod]);

  const fetchUserOrganization = useCallback(async () => {
    try {
      const response = await fetch('/api/organization/stats');
      if (response.ok) {
        const data = await response.json();
        setOrganizationId(data.organizationInfo?.id);
        if (data.organizationInfo?.id) {
          fetchESGData(data.organizationInfo.id);
        }
      }
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('Failed to load organization data');
      setLoading(false);
    }
  }, [fetchESGData]);

  // Set initial active tab from URL parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'metrics', 'data-collection', 'reports', 'analytics', 'suggestion', 'favorites'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchUserOrganization();
    }
  }, [isLoading, user, router, fetchUserOrganization]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    if (organizationId) {
      fetchESGData(organizationId);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!esgData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Data Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load ESG data.</p>
          <Button onClick={() => router.push('/organization/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
    return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[22px] pb-8">

        {/* Professional Header */}
        <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative group">
                  <div className="w-16 h-16 border-2 border-gray-100 dark:border-gray-700 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
                    <Leaf className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    ESG Performance Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Environmental, Social & Governance Metrics and Reporting
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(esgData.metrics.overall)}`}>
                    {esgData.metrics.overall.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Overall ESG Score</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {esgData.period} • {new Date(esgData.calculatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="period-select" className="text-sm text-gray-600 dark:text-gray-400">
                    Period:
                  </Label>
                  <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                    <SelectTrigger id="period-select" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ESG Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className={getScoreBgColor(esgData.metrics.environmental.total)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Leaf className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Environmental</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Climate & Resources</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {esgData.metrics.environmental.total.toFixed(1)}
                </div>
              </div>
              <Progress value={esgData.metrics.environmental.total} className="h-2" />
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Weight: {esgData.breakdown.environmental.weight}%
              </div>
            </CardContent>
          </Card>

          <Card className={`${getScoreBgColor(esgData.metrics.social.total)} dark:bg-indigo-900/20 dark:border-indigo-800`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Social</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">People & Community</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {esgData.metrics.social.total.toFixed(1)}
                </div>
              </div>
              <Progress value={esgData.metrics.social.total} className="h-2" />
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Weight: {esgData.breakdown.social.weight}%
              </div>
            </CardContent>
          </Card>

          <Card className={`${getScoreBgColor(esgData.metrics.governance.total)} dark:bg-purple-900/20 dark:border-purple-800`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                    <Scale className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Governance</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ethics & Compliance</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {esgData.metrics.governance.total.toFixed(1)}
                </div>
              </div>
              <Progress value={esgData.metrics.governance.total} className="h-2" />
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Weight: {esgData.breakdown.governance.weight}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Navigation */}
        <div className="space-y-6">
          {/* Pill-like Navigation */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'outline'}
              onClick={() => setActiveTab('overview')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'overview' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'metrics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('metrics')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'metrics' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <PieChart className="w-4 h-4 mr-2" />
              Metrics
            </Button>
            <Button
              variant={activeTab === 'data-collection' ? 'default' : 'outline'}
              onClick={() => setActiveTab('data-collection')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'data-collection' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Upload className="w-4 h-4 mr-2" />
              Data Entry
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reports')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'reports' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analytics')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              variant={activeTab === 'suggestion' ? 'default' : 'outline'}
              onClick={() => setActiveTab('suggestion')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'suggestion' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Suggestion
            </Button>
            <Button
              variant={activeTab === 'favorites' ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab('favorites');
                // Clear favorite notifications when user clicks on Favorites tab
                if (newFavoriteCount > 0) {
                  clearFavoriteCount();
                }
              }}
              className={`relative rounded-full px-6 py-2 ${
                activeTab === 'favorites' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorite Events
              {newFavoriteCount > 0 && activeTab !== 'favorites' && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center bg-red-500 hover:bg-red-500"
                >
                  {newFavoriteCount > 9 ? '9+' : newFavoriteCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Environmental Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Leaf className="w-5 h-5 mr-2 text-green-600" />
                    Environmental Metrics
                  </CardTitle>
                  <CardDescription>Track your environmental impact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(esgData.breakdown.environmental.sdgs).map(([name, score], idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{score.toFixed(1)}</span>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <Progress value={score} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Score: {score.toFixed(1)}/100</span>
                        <span>{score.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Social Metrics
                  </CardTitle>
                  <CardDescription>Measure social impact and engagement</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(esgData.breakdown.social.sdgs).map(([name, score], idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold">{score.toFixed(1)}</span>
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <Progress value={score} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Score: {score.toFixed(1)}/100</span>
                        <span>{score.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Governance Metrics */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scale className="w-5 h-5 mr-2 text-purple-600" />
                    Governance Metrics
                  </CardTitle>
                  <CardDescription>Ensure compliance and ethical practices</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(esgData.breakdown.governance.sdgs).map(([name, score], idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold">{score.toFixed(1)}</span>
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                        </div>
                        <Progress value={score} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Score: {score.toFixed(1)}/100</span>
                          <span>{score.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          )}

          {/* Metrics Tab Content */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Detailed Metrics Analysis</CardTitle>
                    <CardDescription>View and compare all ESG metrics</CardDescription>
                  </div>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024-Q4">Q4 2024</SelectItem>
                      <SelectItem value="2024-Q3">Q3 2024</SelectItem>
                      <SelectItem value="2024-Q2">Q2 2024</SelectItem>
                      <SelectItem value="2024-Q1">Q1 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Detailed metrics comparison coming soon</p>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Data Collection Tab Content */}
          {activeTab === 'data-collection' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Collection & Entry</CardTitle>
                    <CardDescription>Submit new ESG data and metrics</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => router.push('/organization/esg/data-entry/enhanced?from=data-collection')}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Your Data
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-300"
                      onClick={() => router.push('/organization/esg/data-entry/enhanced?from=environmental')}
                    >
                      <Droplets className="w-8 h-8 mb-2 text-green-500" />
                      <span>Environmental Data</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => router.push('/organization/esg/data-entry/enhanced?from=social')}
                    >
                      <Heart className="w-8 h-8 mb-2 text-blue-500" />
                      <span>Social Data</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-24 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-300"
                      onClick={() => router.push('/organization/esg/data-entry/enhanced?from=governance')}
                    >
                      <Shield className="w-8 h-8 mb-2 text-purple-500" />
                      <span>Governance Data</span>
                    </Button>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Data Collection Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Environmental Data</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={esgData.dataCollectionStatus.environmental} className="w-32 h-2" />
                          <span className="text-sm font-medium">{esgData.dataCollectionStatus.environmental}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Social Data</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={esgData.dataCollectionStatus.social} className="w-32 h-2" />
                          <span className="text-sm font-medium">{esgData.dataCollectionStatus.social}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Governance Data</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={esgData.dataCollectionStatus.governance} className="w-32 h-2" />
                          <span className="text-sm font-medium">{esgData.dataCollectionStatus.governance}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Reports Tab Content */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
            {/* Generate New Report */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span>Generate ESG Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Report Type
                    </label>
                    <Select value="quarterly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly ESG Report</SelectItem>
                        <SelectItem value="quarterly">Quarterly ESG Report</SelectItem>
                        <SelectItem value="annual">Annual ESG Report</SelectItem>
                        <SelectItem value="compliance">Compliance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Period
                    </label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024-Q4">Q4 2024</SelectItem>
                        <SelectItem value="2024-Q3">Q3 2024</SelectItem>
                        <SelectItem value="2024-Q2">Q2 2024</SelectItem>
                        <SelectItem value="2024-Q1">Q1 2024</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Report will include:
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• Executive Summary & ESG Score Breakdown</li>
                    <li>• Environmental Impact Metrics (Carbon, Energy, Water, Waste)</li>
                    <li>• Social Impact Metrics (Employee, Diversity, Community)</li>
                    <li>• Governance Metrics (Board, Ethics, Compliance, Security)</li>
                    <li>• Progress Against Targets & Benchmarks</li>
                    <li>• Trend Analysis & Year-over-Year Comparison</li>
                    <li>• Industry Benchmarking & Best Practices</li>
                  </ul>
                </div>

                <div className="flex space-x-3">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate PDF Report
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Previous Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Previous ESG Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {esgData.recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {report.type} - {report.period}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(report.submittedAt).toLocaleDateString()}</span>
                            </span>
                            <Badge variant={
                              report.status === 'verified' ? 'default' : 
                              report.status === 'submitted' ? 'secondary' : 'outline'
                            }>
                              {report.status === 'verified' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {report.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ESG Analytics & Insights</CardTitle>
                <CardDescription>Advanced analytics and trend analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Advanced analytics and visualizations coming soon</p>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Suggestion Tab Content */}
          {activeTab === 'suggestion' && (
            <SuggestionPanel organizationId={organizationId || ''} />
          )}

          {/* Favorite Events Tab Content */}
          {activeTab === 'favorites' && (
            <FavoriteEventsPanel organizationId={organizationId || ''} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrganizationESGPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <OrganizationESGContent />
    </Suspense>
  );
}
