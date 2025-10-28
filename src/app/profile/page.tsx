// home/ubuntu/impaktrweb/src/app/profile/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  User, 
  Award, 
  Calendar, 
  MapPin, 
  Globe, 
  Mail,
  Phone,
  Edit3,
  Share2,
  Download,
  TrendingUp,
  Clock,
  Star,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { ActivityTimeline } from '@/components/profile/ActvityTimeline';
import { BadgeCollection } from '@/components/profile/BadgeCollection';
import { CertificatesGrid } from '@/components/profile/CertificatesGrid';
import { ImpactStatistics } from '@/components/profile/ImpactStatistics';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatScore, formatTimeAgo, getInitials, getRankColor } from '@/lib/utils';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  website: string;
  phone?: string;
  languages: string[];
  occupation: string;
  organization: string;
  impaktrScore: number;
  currentRank: string;
  joinedAt: string;
  sdgFocus: number[];
  stats: {
    totalHours: number;
    verifiedHours: number;
    eventsJoined: number;
    badgesEarned: number;
    certificates: number;
    followers: number;
    following: number;
  };
  badges: Array<{
    id: string;
    sdgNumber: number;
    tier: string;
    name: string;
    earnedAt: string;
    progress: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    date: string;
    points: number;
  }>;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/api/auth/login');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [isLoading, user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name}'s Impaktr Profile`,
          text: `Check out ${profile?.name}'s social impact journey on Impaktr`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const handleDownloadCertificate = () => {
    // Implement certificate download
    console.log('Downloading impact certificate...');
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  if (isEditing) {
    return (
      <ProfileEditor 
        profile={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          banner: profile.banner,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          phone: profile.phone,
          languages: profile.languages,
          occupation: profile.occupation,
          organization: profile.organization,
          impaktrScore: profile.impaktrScore,
          currentRank: profile.currentRank,
          joinedAt: profile.joinedAt,
          sdgFocus: profile.sdgFocus,
          stats: profile.stats,
        }} 
        onSave={(updatedProfile) => {
          setProfile({...profile, ...updatedProfile});
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Profile Header - No Banner */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar with gradient ring */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
              <Avatar className="relative w-24 h-24 md:w-32 md:h-32 border-4 border-background">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-3">
                  {/* Name and Rank */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-bold">{profile.name}</h1>
                    <Badge 
                      className="px-3 py-1.5 text-sm font-semibold"
                      style={{ 
                        backgroundColor: getRankColor(profile.currentRank) + '20', 
                        color: getRankColor(profile.currentRank),
                        borderColor: getRankColor(profile.currentRank) + '40'
                      }}
                    >
                      <Star className="w-4 h-4 mr-1" style={{ color: getRankColor(profile.currentRank) }} />
                      {profile.currentRank}
                    </Badge>
                  </div>
                  
                  {/* Occupation and Location */}
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    {profile.occupation && (
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1.5" />
                        <span className="font-medium">{profile.occupation}</span>
                        {profile.organization && <span className="ml-1">@ {profile.organization}</span>}
                      </span>
                    )}
                    
                    {profile.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        {profile.location.city}, {profile.location.country}
                      </span>
                    )}
                    
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5" />
                      Joined {formatTimeAgo(profile.joinedAt)}
                    </span>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="text-muted-foreground max-w-2xl leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Links */}
                  <div className="flex items-center gap-4 pt-2">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-primary hover:underline font-medium"
                      >
                        <Globe className="w-4 h-4 mr-1.5" />
                        Website
                      </a>
                    )}
                    
                    {profile.phone && (
                      <a
                        href={`tel:${profile.phone}`}
                        className="flex items-center text-sm text-primary hover:underline font-medium"
                      >
                        <Phone className="w-4 h-4 mr-1.5" />
                        Phone
                      </a>
                    )}
                    
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center text-sm text-primary hover:underline font-medium"
                    >
                      <Mail className="w-4 h-4 mr-1.5" />
                      Contact
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    className="py-3 px-4"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3 px-4"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Impact Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Impact Score Card */}
        <Card className="mb-8 overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <TrendingUp className="w-6 h-6 text-white" />
                  <span className="text-white/90 text-sm font-medium uppercase tracking-wide">Impaktr Score™</span>
                </div>
                <div className="text-5xl md:text-6xl font-bold text-white mb-2">
                  {formatScore(profile.impaktrScore)}
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 text-white/90 text-sm">
                  <span>Rank: {profile.currentRank}</span>
                  <span>•</span>
                  <span>75% to next level</span>
                </div>
              </div>
              
              <div className="w-full md:w-auto md:min-w-[200px]">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-white/90 text-xs mb-2">Progress to Next Rank</div>
                  <Progress value={75} className="h-3 bg-white/20" />
                  <div className="text-white text-xs mt-2 text-right">75%</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{profile.stats?.totalHours || 0}</div>
              <div className="text-sm text-muted-foreground">Volunteer Hours</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{profile.stats?.badgesEarned || 0}</div>
              <div className="text-sm text-muted-foreground">Badges Earned</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{profile.stats?.eventsJoined || 0}</div>
              <div className="text-sm text-muted-foreground">Events Joined</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{profile.stats?.followers || 0}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
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
              variant={activeTab === 'badges' ? 'default' : 'outline'}
              onClick={() => setActiveTab('badges')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'badges' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Badges
            </Button>
            <Button
              variant={activeTab === 'activity' ? 'default' : 'outline'}
              onClick={() => setActiveTab('activity')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'activity' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Activity
            </Button>
            <Button
              variant={activeTab === 'certificates' ? 'default' : 'outline'}
              onClick={() => setActiveTab('certificates')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'certificates' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Certificates
            </Button>
            <Button
              variant={activeTab === 'statistics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('statistics')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'statistics' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Statistics
            </Button>
          </div>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
            {/* SDG Focus */}
            <Card>
              <CardHeader>
                <CardTitle>SDG Focus Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.sdgFocus && profile.sdgFocus.map((sdgNumber) => (
                    <Badge key={sdgNumber} variant="sdg" sdgNumber={sdgNumber}>
                      SDG {sdgNumber}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Activity</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setActiveTab('activity')}
                    className="text-blue-600 hover:text-purple-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    View All →
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.recentActivity?.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">+{activity.points}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(activity.date)}
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Languages & Skills */}
            {(profile.languages && profile.languages.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages & Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.languages && profile.languages.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Languages</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.languages.map((language) => (
                            <Badge key={language} variant="secondary">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {/* Badges Tab Content */}
          {activeTab === 'badges' && (
            <div>
            <BadgeCollection badges={profile.badges ? profile.badges.map(badge => ({
              ...badge,
              tier: badge.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN',
              requirements: {
                minHours: 10,
                minActivities: 5,
                minQuality: 3.0,
              },
              currentStats: {
                hours: badge.progress * 10,
                activities: badge.progress * 5,
                avgQuality: 4.0,
              },
            })) : []} />
            </div>
          )}

          {/* Activity Tab Content */}
          {activeTab === 'activity' && (
            <div>
            <ActivityTimeline activities={profile.recentActivity ? profile.recentActivity.map(activity => ({
              ...activity,
              type: activity.type as 'event_joined' | 'event_completed' | 'badge_earned' | 'rank_up' | 'milestone' | 'verification' | 'certificate_shared',
            })) : []} />
            </div>
          )}

          {/* Certificates Tab Content */}
          {activeTab === 'certificates' && (
            <div>
            <CertificatesGrid userId={profile.id} />
            </div>
          )}

          {/* Statistics Tab Content */}
          {activeTab === 'statistics' && (
            <div>
            <ImpactStatistics userId={profile.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}