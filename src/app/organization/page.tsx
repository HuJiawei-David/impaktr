// home/ubuntu/impaktrweb/src/app/organization/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  Calendar,
  Award,
  TrendingUp,
  BarChart3,
  FileText,
  Download,
  Eye,
  Plus,
  Settings,
  Globe,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatScore, getInitials } from '@/lib/utils';

interface OrganizationData {
  id: string;
  name: string;
  type: string;
  tier: string;
  impaktrScore: number;
  isVerified: boolean;
  profile: {
    logo?: string;
    description: string;
    website?: string;
    location: {
      city: string;
      country: string;
    };
    contactPerson: {
      name: string;
      role: string;
      email: string;
      phone?: string;
    };
    sdgFocus: number[];
  };
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalEvents: number;
    activeEvents: number;
    totalHours: number;
    certificatesIssued: number;
    impactReach: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    user?: {
      name: string;
      avatar: string;
    };
  }>;
  upcomingEvents: Array<{
    id: string;
    title: string;
    date: string;
    participants: number;
    status: string;
  }>;
}

export default function OrganizationDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [isLoadingOrg, setIsLoadingOrg] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/signup');
      return;
    }

    if (user) {
      fetchOrganizationData();
    }
  }, [isLoading, user]);

  const fetchOrganizationData = async () => {
    try {
      const response = await fetch('/api/organizations/dashboard');
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
      } else if (response.status === 404) {
        // User doesn't own an organization
        redirect('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setIsLoadingOrg(false);
    }
  };

  const handleDownloadESGReport = async () => {
    try {
      const response = await fetch('/api/organizations/esg-report', {
        method: 'POST',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${organization?.name}-ESG-Report-${new Date().getFullYear()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading ESG report:', error);
    }
  };

  if (isLoading || isLoadingOrg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !organization) {
    return null;
  }

  const progressToNextTier = 75; // Mock data
  const nextTier = 'CSR Leader'; // Mock data

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Organization Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Organization Logo */}
              <Avatar className="w-20 h-20 md:w-24 md:h-24">
                <AvatarImage src={organization.profile.logo} alt={organization.name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {getInitials(organization.name)}
                </AvatarFallback>
              </Avatar>

              {/* Organization Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h1 className="text-2xl md:text-3xl font-bold">{organization.name}</h1>
                      {organization.isVerified && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <span className="flex items-center">
                        <Building2 className="w-4 h-4 mr-1" />
                        {organization.type}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {organization.profile.location.city}, {organization.profile.location.country}
                      </span>
                    </div>

                    <p className="text-muted-foreground max-w-2xl">
                      {organization.profile.description}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 mt-4 md:mt-0">
                    <Link href="/organization/settings">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Button size="sm" onClick={handleDownloadESGReport}>
                      <Download className="w-4 h-4 mr-2" />
                      ESG Report
                    </Button>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-4 mt-4 p-4 bg-muted/30 rounded-lg">
                  <div className="space-y-2">
                    <h4 className="font-medium">Contact Person</h4>
                    <div className="text-sm space-y-1">
                      <div>{organization.profile.contactPerson.name} - {organization.profile.contactPerson.role}</div>
                      <div className="flex items-center">
                        <Mail className="w-3 h-3 mr-1" />
                        {organization.profile.contactPerson.email}
                      </div>
                      {organization.profile.contactPerson.phone && (
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {organization.profile.contactPerson.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Organization Details</h4>
                    <div className="text-sm space-y-1">
                      {organization.profile.website && (
                        <div className="flex items-center">
                          <Globe className="w-3 h-3 mr-1" />
                          <a href={organization.profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Website
                          </a>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {organization.profile.sdgFocus.map((sdg) => (
                          <Badge key={sdg} variant="sdg" sdgNumber={sdg} className="text-xs">
                            SDG {sdg}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Corporate Impact Score */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Corporate Impaktr Score™
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold brand-gradient-text mb-2">
                  {formatScore(organization.impaktrScore)}
                </div>
                <div className="text-sm text-muted-foreground mb-4">Current Score (0-100)</div>
                <Badge variant="secondary" className="px-3 py-1">
                  {organization.tier}
                </Badge>
              </div>

              <div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress to {nextTier}</span>
                    <span>{progressToNextTier}%</span>
                  </div>
                  <Progress value={progressToNextTier} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    Increase member engagement to reach the next tier
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Score Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Member Participation:</span>
                    <span className="font-medium">78%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hours/Member:</span>
                    <span className="font-medium">24.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Rating:</span>
                    <span className="font-medium">4.7/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SDG Diversity:</span>
                    <span className="font-medium">6/17</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-3 text-blue-500" />
              <div className="text-2xl font-bold">{organization.stats.totalMembers}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
              <div className="text-xs text-green-600 mt-1">
                {organization.stats.activeMembers} active
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-3 text-green-500" />
              <div className="text-2xl font-bold">{organization.stats.totalEvents}</div>
              <div className="text-sm text-muted-foreground">Events Created</div>
              <div className="text-xs text-blue-600 mt-1">
                {organization.stats.activeEvents} active
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-3 text-purple-500" />
              <div className="text-2xl font-bold">{organization.stats.totalHours.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Impact Hours</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-3 text-orange-500" />
              <div className="text-2xl font-bold">{organization.stats.certificatesIssued}</div>
              <div className="text-sm text-muted-foreground">Certificates Issued</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link href="/organization/members">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Manage Members</h3>
                <p className="text-sm text-muted-foreground">Invite and manage team members</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/organization/events">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Manage Events</h3>
                <p className="text-sm text-muted-foreground">Create and manage events</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/organization/certificates">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Award className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Issue Certificates</h3>
                <p className="text-sm text-muted-foreground">Create and manage certificates</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/organization/analytics">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-1">Analytics</h3>
                <p className="text-sm text-muted-foreground">View detailed reports</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
            <TabsTrigger value="insights">ESG Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Organization Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {organization.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                      {activity.user && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid gap-4">
              {organization.upcomingEvents.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">{event.date}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{event.participants} participants</div>
                        <Badge variant={event.status === 'active' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ESG Impact Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">Environmental</div>
                      <div className="text-3xl font-bold">67%</div>
                      <p className="text-sm text-muted-foreground">Climate action initiatives</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">Social</div>
                      <div className="text-3xl font-bold">84%</div>
                      <p className="text-sm text-muted-foreground">Community engagement</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">Governance</div>
                      <div className="text-3xl font-bold">91%</div>
                      <p className="text-sm text-muted-foreground">Transparency score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SDG Contribution Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {organization.profile.sdgFocus.map((sdg) => (
                      <div key={sdg} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="sdg" sdgNumber={sdg}>SDG {sdg}</Badge>
                          <span className="text-sm">SDG Name</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={Math.random() * 100} className="w-24 h-2" />
                          <span className="text-sm font-medium">{Math.floor(Math.random() * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}