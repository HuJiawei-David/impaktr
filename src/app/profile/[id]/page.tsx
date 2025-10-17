'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Award, 
  Calendar, 
  MapPin, 
  Globe, 
  Mail,
  Share2,
  TrendingUp,
  Clock,
  Star,
  Users,
  UserPlus,
  UserCheck,
  Trophy,
  Target,
  Heart,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getSDGById } from '@/constants/sdgs';

interface UserProfile {
  id: string;
  name: string;
  email?: string;
  image?: string;
  bio?: string;
  city?: string;
  country?: string;
  website?: string;
  tier: string;
  impactScore: number;
  volunteerHours: number;
  eventsJoined: number;
  badgesEarned: number;
  isFollowing: boolean;
  badges: {
    id: string;
    name: string;
    sdgNumber: number;
    tier: string;
    earnedAt: string;
  }[];
  recentActivities: {
    id: string;
    type: string;
    title: string;
    date: string;
    sdg?: number;
  }[];
  stats: {
    followers: number;
    following: number;
    rank: number;
  };
}

const getTierColor = (tier: string) => {
  const tierMap: Record<string, string> = {
    'BEGINNER': 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    'SUPPORTER': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    'ADVOCATE': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    'CHAMPION': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    'HERO': 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    'LEGEND': 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30',
  };
  return tierMap[tier] || tierMap['BEGINNER'];
};

const formatTierName = (tier: string) => {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
};

export default function PublicProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    // If viewing own profile, redirect to /profile
    if (session?.user?.id === userId) {
      router.push('/profile');
      return;
    }
    
    if (!session) {
      router.push('/signin');
      return;
    }
    
    fetchProfile();
  }, [session, status, userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/profile?id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data.profile);
      setIsFollowing(data.profile.isFollowing);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session?.user?.id) return;
    
    setFollowLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to follow user');
      }

      const data = await response.json();
      setIsFollowing(data.isFollowing);
      
      // Update follower count
      if (profile) {
        setProfile({
          ...profile,
          stats: {
            ...profile.stats,
            followers: profile.stats.followers + (data.isFollowing ? 1 : -1)
          }
        });
      }
    } catch (err) {
      console.error('Error following user:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full">
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Profile Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This user doesn't exist or their profile is private.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header Banner */}
        <Card className="mb-6 overflow-hidden border-0 shadow-lg">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
          <CardContent className="p-6 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* User Avatar */}
              <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl">
                {profile.image ? (
                  <AvatarImage src={profile.image} alt={profile.name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-3xl">
                    {profile.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {profile.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`${getTierColor(profile.tier)} border-0`}>
                        {formatTierName(profile.tier)}
                      </Badge>
                      {profile.city && profile.country && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4" />
                          {profile.city}, {profile.country}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        {profile.stats.followers} followers · {profile.stats.following} following
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'outline' : 'default'}
                      className={
                        isFollowing
                          ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0'
                      }
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="mt-4 text-gray-700 dark:text-gray-300">
                    {profile.bio}
                  </p>
                )}

                {/* Contact Info */}
                <div className="mt-4 flex flex-wrap gap-4">
                  {profile.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Impact Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.impactScore}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hours</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.volunteerHours}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.eventsJoined}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.badgesEarned}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Recent Activities */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.recentActivities && profile.recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {profile.recentActivities.map((activity) => {
                      const sdg = activity.sdg ? getSDGById(activity.sdg) : null;
                      
                      return (
                        <div key={activity.id} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-start gap-3">
                            {sdg && (
                              <div
                                className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                style={{ backgroundColor: sdg.color }}
                              >
                                <div className="text-[8px]">SDG</div>
                                <div className="text-sm">{sdg.id}</div>
                              </div>
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                {activity.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                  {activity.type}
                                </Badge>
                                <span>•</span>
                                <span>{new Date(activity.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                    No recent activities
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Badges */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    Badges
                  </CardTitle>
                  {profile.badgesEarned > 0 && (
                    <Badge variant="secondary">
                      {profile.badgesEarned}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {profile.badges && profile.badges.length > 0 ? (
                  <div className="space-y-3">
                    {profile.badges.slice(0, 5).map((badge) => {
                      const sdg = getSDGById(badge.sdgNumber);
                      return (
                        <div key={badge.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          {sdg && (
                            <div
                              className="w-8 h-8 rounded flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
                              style={{ backgroundColor: sdg.color }}
                            >
                              <div className="text-[8px]">SDG</div>
                              <div className="text-[10px]">{sdg.id}</div>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {badge.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {badge.tier}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {profile.badges.length > 5 && (
                      <Button variant="ghost" size="sm" className="w-full">
                        View All {profile.badgesEarned} Badges
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No badges earned yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Position */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardContent className="p-6 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  Leaderboard Rank
                </h3>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  #{profile.stats.rank}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Global ranking
                </p>
                <Link href="/leaderboards">
                  <Button variant="outline" size="sm" className="w-full">
                    View Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}

