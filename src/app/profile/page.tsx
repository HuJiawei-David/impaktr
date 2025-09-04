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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { ActivityTimeline } from '@/components/profile/ActvityTimeline';
import { BadgeCollection } from '@/components/profile/BadgeCollection';
import { CertificatesGrid } from '@/components/profile/CertificatesGrid';
import { ImpactStatistics } from '@/components/profile/ImpactStatistics';
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-48 md:h-64 bg-gradient-to-r from-primary-500 to-primary-700"
          style={{
            backgroundImage: profile.banner ? `url(${profile.banner})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        {/* Profile Info Overlay */}
        <div className="container mx-auto px-4">
          <div className="relative -mt-16 md:-mt-20">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
                {/* Avatar */}
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-2xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Profile Details */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
                      
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        {profile.occupation && (
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {profile.occupation}
                            {profile.organization && ` @ ${profile.organization}`}
                          </span>
                        )}
                        
                        {profile.location && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {profile.location.city}, {profile.location.country}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge 
                          variant="secondary" 
                          className="px-3 py-1"
                          style={{ backgroundColor: getRankColor(profile.currentRank) + '20', color: getRankColor(profile.currentRank) }}
                        >
                          {profile.currentRank}
                        </Badge>
                        
                        <div className="text-sm text-muted-foreground">
                          Joined {formatTimeAgo(profile.joinedAt)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 mt-4 md:mt-0">
                      <Button variant="outline" size="sm" onClick={handleShare}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadCertificate}>
                        <Download className="w-4 h-4 mr-2" />
                        Certificate
                      </Button>
                      <Button onClick={() => setIsEditing(true)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile.bio && (
                    <p className="mt-4 text-muted-foreground max-w-2xl">
                      {profile.bio}
                    </p>
                  )}

                  {/* Links */}
                  <div className="flex items-center space-x-4 mt-4">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary hover:underline"
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Website
                      </a>
                    )}
                    
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center text-primary hover:underline"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      Contact
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Impact Score Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Main Score */}
          <Card className="md:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold brand-gradient-text mb-2">
                {formatScore(profile.impaktrScore)}
              </div>
              <div className="text-sm text-muted-foreground mb-4">Impaktr Score™</div>
              <Progress value={75} className="h-2" />
              <div className="text-xs text-muted-foreground mt-2">
                75% to next rank
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                <div className="text-xl font-bold">{profile.stats.totalHours}</div>
                <div className="text-xs text-muted-foreground">Total Hours</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <div className="text-xl font-bold">{profile.stats.badgesEarned}</div>
                <div className="text-xs text-muted-foreground">Badges</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                <div className="text-xl font-bold">{profile.stats.eventsJoined}</div>
                <div className="text-xs text-muted-foreground">Events</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <Users className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                <div className="text-xl font-bold">{profile.stats.followers}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* SDG Focus */}
            <Card>
              <CardHeader>
                <CardTitle>SDG Focus Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.sdgFocus.map((sdgNumber) => (
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
                  Recent Activity
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('activity')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.recentActivity.slice(0, 3).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground">{activity.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">+{activity.points}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Languages & Skills */}
            {(profile.languages.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Languages & Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.languages.length > 0 && (
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
          </TabsContent>

          <TabsContent value="badges">
            <BadgeCollection badges={profile.badges.map(badge => ({
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
            }))} />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTimeline activities={profile.recentActivity.map(activity => ({
              ...activity,
              type: activity.type as 'event_joined' | 'event_completed' | 'badge_earned' | 'rank_up' | 'milestone' | 'verification' | 'certificate_shared',
            }))} />
          </TabsContent>

          <TabsContent value="certificates">
            <CertificatesGrid userId={profile.id} />
          </TabsContent>

          <TabsContent value="statistics">
            <ImpactStatistics userId={profile.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}