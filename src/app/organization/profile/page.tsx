// home/ubuntu/impaktrweb/src/app/organization/profile/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Globe,
  Users,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Star,
  Share2,
  Edit3,
  Briefcase,
  Phone,
  Mail,
  Leaf
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'react-hot-toast';
import { formatTimeAgo, getInitials } from '@/lib/utils';

interface OrganizationProfile {
  id: string;
  name: string;
  email: string;
  website?: string;
  description?: string;
  industry: string;
  companySize: string;
  country: string;
  address?: string;
  city?: string;
  phone?: string;
  logo?: string;
  banner?: string;
  createdAt: string;
  stats: {
    totalMembers: number;
    totalEvents: number;
    totalVolunteerHours: number;
    impactScore: number;
    badgesEarned: number;
    esgScore: number;
  };
  recentEvents: Array<{
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate?: string;
    location: {
      city: string;
      country: string;
    };
    status: string;
    participantCount: number;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier: string;
    earnedAt: string;
  }>;
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
    avatar?: string;
  }>;
}

export default function OrganizationProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [isLoading, user, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/organizations/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.organization);
      }
    } catch (error) {
      console.error('Error fetching organization profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name}'s Organization Profile`,
          text: `Check out ${profile?.name}'s impact on Impaktr`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const handleEdit = () => {
    router.push('/organization/settings/profile');
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-4">You are not part of any organization.</p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg dark:border dark:border-gray-700">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="w-24 h-24 border-4 border-background">
                  <AvatarImage src={profile.logo} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                      <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                        {profile.industry && (
                          <div className="flex items-center">
                            <Briefcase className="w-4 h-4 mr-1" />
                            <span>{profile.industry.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                        {profile.companySize && (
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            <span>{profile.companySize}</span>
                          </div>
                        )}
                        {profile.country && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{profile.country}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Joined {formatTimeAgo(profile.createdAt)}</span>
                        </div>
                      </div>
                      {profile.description && (
                        <p className="text-muted-foreground mb-4 max-w-2xl">
                          {profile.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button variant="outline" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button onClick={handleEdit} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-wrap items-center space-x-6 text-sm text-muted-foreground">
                    {profile.website && (
                      <div className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          {profile.website}
                        </a>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-xl font-bold">{profile.stats?.impactScore || 0}</div>
              <div className="text-xs text-muted-foreground">Impact Score</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-xl font-bold">{profile.stats?.totalMembers || 0}</div>
              <div className="text-xs text-muted-foreground">Members</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-xl font-bold">{profile.stats?.totalEvents || 0}</div>
              <div className="text-xs text-muted-foreground">Events</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-orange-500" />
              <div className="text-xl font-bold">{profile.stats?.totalVolunteerHours || 0}</div>
              <div className="text-xs text-muted-foreground">Volunteer Hours</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-xl font-bold">{profile.stats?.badgesEarned || 0}</div>
              <div className="text-xs text-muted-foreground">Badges</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Leaf className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-xl font-bold">{profile.stats?.esgScore?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-muted-foreground">ESG Score</div>
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
              Overview
            </Button>
            <Button
              variant={activeTab === 'events' ? 'default' : 'outline'}
              onClick={() => setActiveTab('events')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'events' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Events
            </Button>
            <Button
              variant={activeTab === 'members' ? 'default' : 'outline'}
              onClick={() => setActiveTab('members')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'members' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Members
            </Button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About {profile.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Organization Details</h4>
                      <div className="space-y-2 text-sm">
                        {profile.industry && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Industry:</span>
                            <span>{profile.industry.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                        {profile.companySize && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Size:</span>
                            <span>{profile.companySize}</span>
                          </div>
                        )}
                        {profile.country && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Country:</span>
                            <span>{profile.country}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Founded:</span>
                          <span>{formatTimeAgo(profile.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <div className="space-y-2 text-sm">
                        {profile.address && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Address:</span>
                            <span>{profile.address}</span>
                          </div>
                        )}
                        {profile.city && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">City:</span>
                            <span>{profile.city}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country:</span>
                          <span>{profile.country}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Events Tab Content */}
          {activeTab === 'events' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.recentEvents && profile.recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {profile.recentEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>{event.location.city}, {event.location.country}</span>
                            <span>{formatTimeAgo(event.startDate)}</span>
                            <span>{event.participantCount} participants</span>
                          </div>
                        </div>
                        <Badge variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No events yet</p>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {/* Members Tab Content */}
          {activeTab === 'members' && (
            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                {profile.members && profile.members.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {profile.members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{member.name}</h4>
                          <p className="text-xs text-muted-foreground">{member.role}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatTimeAgo(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No members yet</p>
                )}
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
