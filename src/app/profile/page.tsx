// home/ubuntu/impaktrweb/src/app/profile/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useRouter } from 'next/navigation';
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
  Users,
  Building2,
  Zap,
  Target,
  CheckCircle,
  ChevronRight,
  Trophy,
  Lock,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getSDGById } from '@/constants/sdgs';
import { getSDGColor } from '@/lib/utils';
import { 
  getSDGBadgeImage,
  getRankBadgeImage
} from '@/lib/badge-config';
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

// Helper: generate deterministic color classes for skill badges
function getSkillBadgeClasses(skillName: string): string {
  const predefined: Record<string, string> = {
    'Community Service': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Empathy': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Communication': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };
  if (predefined[skillName]) return predefined[skillName];
  const palette = [
    'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
    'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  ];
  let hash = 0;
  for (let i = 0; i < skillName.length; i++) {
    hash = (hash * 31 + skillName.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

// Helper: generate deterministic color classes for language badges
function getLanguageBadgeClasses(language: string): string {
  const predefined: Record<string, string> = {
    'English': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Spanish': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'French': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'Mandarin': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'German': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Japanese': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'Portuguese': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Italian': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'Arabic': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'Russian': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  };
  if (predefined[language]) return predefined[language];
  const palette = [
    'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
    'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
  ];
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = (hash * 31 + language.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
}

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
  country?: string;
  website: string;
  phone?: string;
  languages: string[];
  occupation: string;
  organization: string;
  impaktrScore: number;
  currentRank: string;
  joinedAt: string;
  sdgFocus: number[];
  isPublic?: boolean;
  showEmail?: boolean;
  showProgress?: boolean;
  allowMessages?: boolean;
  stats: {
    totalHours: number;
    verifiedHours: number;
    eventsJoined: number;
    eventsCompleted?: number;
    badgesEarned: number;
    certificates: number;
    followers: number;
    following: number;
    localRank?: number;
    localTotal?: number;
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
    description?: string;
    date: string;
    points?: number;
    scoreBreakdown?: {
      hoursComponent: number;
      intensityComponent: number;
      skillComponent: number;
      qualityComponent: number;
      verificationComponent: number;
      locationComponent: number;
      change: number;
    } | null;
  }>;
  organizationsWorkedWith?: Array<{
    id: string;
    name: string;
    logo: string | null;
    events: number;
    hours: number;
  }>;
  autoTaggedSkills?: Array<{
    skill: string;
    eventCount: number;
  }>;
  sdgParticipations?: Array<{
    sdgNumber: number;
    eventCount: number;
  }>;
  certificateCount?: number;
  certificates?: Array<{
    id: string;
    title: string;
    description?: string;
    type: string;
    issuedAt: string;
    issuedBy?: string;
    certificateUrl?: string;
    event?: {
      id: string;
      title: string;
      organization?: {
        id: string;
        name: string;
        logo?: string;
      };
    };
  }>;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [badgeProgressData, setBadgeProgressData] = useState<{
    rankProgress: {
      currentRank: { rank: string; name: string; icon: string };
      nextRank: { rank: string; name: string; requirements: { minScore: number; minHours: number; minBadges: number }; progress: { score: number; hours: number; badges: number } } | null;
      currentProgress: { score: number; hours: number; badges: number };
    };
    sdgBadges: Array<{
      sdgNumber: number;
      sdgName: string;
      icon: string;
      color: string;
      tiers: Array<{
        tier: string;
        name: string;
        description: string;
        requirements: { minHours: number; minActivities: number };
        progress: { hours: number; activities: number; percentage: number };
        earned: boolean;
      }>;
    }>;
  } | null>(null);
  const [badgeProgressLoading, setBadgeProgressLoading] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [leaderboardTotal, setLeaderboardTotal] = useState<number | null>(null);
  const [participations, setParticipations] = useState<any[]>([]);
  const [isLoadingParticipations, setIsLoadingParticipations] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/api/auth/login');
      return;
    }

    if (user) {
      fetchProfile();
      fetchLeaderboardRank();
    }
  }, [isLoading, user]);

  useEffect(() => {
    if (activeTab === 'certificates' && profile?.id) {
      fetchParticipations();
    }
  }, [activeTab, profile?.id]);

  const fetchLeaderboardRank = async () => {
    try {
      const response = await fetch('/api/leaderboards?type=individuals&period=all_time&limit=1');
      if (response.ok) {
        const data = await response.json();
        if (data.currentUser) {
          setLeaderboardRank(data.currentUser.rank);
          setLeaderboardTotal(data.totalUsers || data.total);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard rank:', error);
    }
  };

  const fetchParticipations = async () => {
    if (!profile?.id) return;
    try {
      setIsLoadingParticipations(true);
      // Try the participations API first
      const response = await fetch(`/api/users/${profile.id}/participations?status=VERIFIED&status=ATTENDED&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setParticipations(data.participations || []);
      } else {
        // Fallback: use participations from profile API response if available
        // The profile API includes participations in the response
        console.log('Participations API not available, using profile data');
        setParticipations([]);
      }
    } catch (error) {
      console.error('Error fetching participations:', error);
      setParticipations([]);
    } finally {
      setIsLoadingParticipations(false);
    }
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string | null | undefined): string => {
    if (!dateOfBirth) return '';
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age.toString();
    } catch (e) {
      return '';
    }
  };

  // Helper function to get first name from participation
  const getParticipantFirstName = (participation: any): string => {
    if (participation?.user?.firstName) {
      return participation.user.firstName;
    }
    // Parse from name field if firstName is not available
    // First name is all parts except the last one (e.g., "Li Yuan" from "Li Yuan Peng")
    if (participation?.user?.name) {
      const parts = participation.user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts.slice(0, -1).join(' ') || '-';
      }
      return parts[0] || '-';
    }
    return '-';
  };

  // Helper function to get last name from participation
  const getParticipantLastName = (participation: any): string => {
    if (participation?.user?.lastName) {
      return participation.user.lastName;
    }
    // Parse from name field if lastName is not available
    // Last name is the last part (e.g., "Peng" from "Li Yuan Peng")
    if (participation?.user?.name) {
      const parts = participation.user.name.trim().split(/\s+/);
      if (parts.length > 1) {
        return parts[parts.length - 1] || '-';
      }
    }
    return '-';
  };


  const handleGenerateCertificate = async (participation: any) => {
    // Navigate to certificate preview page instead of opening dialog
    router.push(`/profile/certificates/${participation.id}`);
  };

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        
        console.log('📥 Profile API Response (full):', JSON.stringify(user, null, 2));
        console.log('📊 Stats:', user.stats);
        console.log('🏅 Badges:', user.badges);
        console.log('📋 Activities (raw):', user.recentActivities);
        console.log('📋 Activities (count):', user.recentActivities?.length || 0);
        console.log('🏢 Organizations:', user.organizationsWorkedWith);
        console.log('📜 Certificates:', user.certificates);
        
        // Map API response to component interface
        const mappedProfile: UserProfile = {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.image || '',
          banner: '',
          bio: user.profile?.bio || '',
          location: {
            city: user.profile?.city || '',
            state: user.profile?.state || '',
            country: user.profile?.country || '',
          },
          country: user.profile?.country || user.country || '',
          website: user.profile?.website || '',
          phone: user.profile?.phone || user.phone || '',
          languages: user.profile?.languages || user.languages || [],
          occupation: user.profile?.occupation || user.occupation || '',
          organization: user.profile?.organization || user.organization || '',
          impaktrScore: user.impactScore || 0,
          currentRank: user.tier || 'HELPER',
          joinedAt: user.createdAt || user.profile?.createdAt || new Date().toISOString(),
          sdgFocus: user.profile?.sdgFocus || [],
          isPublic: user.profile?.isPublic ?? user.isPublic ?? true,
          showEmail: user.profile?.showEmail ?? user.showEmail ?? false,
          showProgress: user.profile?.showProgress ?? user.showProgress ?? true,
          allowMessages: user.profile?.allowMessages ?? user.allowMessages ?? true,
          stats: {
            totalHours: user.stats?.volunteerHours || 0,
            verifiedHours: user.stats?.volunteerHours || 0,
            eventsJoined: user.stats?.eventsJoined || 0,
            eventsCompleted: user.stats?.eventsCompleted || 0,
            badgesEarned: user.stats?.badgesEarned || 0,
            localRank: user.stats?.localRank,
            localTotal: user.stats?.localTotal,
            certificates: user.certificateCount || 0,
            followers: user.stats?.followers || 0,
            following: user.stats?.following || 0,
          },
          badges: (user.badges || []).map((badge: {
            id: string;
            name: string;
            sdgNumber: number;
            tier: string;
            earnedAt: string;
          }) => ({
            ...badge,
            progress: 100, // Badge is earned, so 100% progress
          })),
          recentActivity: (user.recentActivities || []).map((activity: {
            id: string;
            type: string;
            title: string;
            date: string;
            sdg?: number;
            sdgs?: number[];
            points?: number;
            hours?: number;
            scoreBreakdown?: {
              hoursComponent: number;
              intensityComponent: number;
              skillComponent: number;
              qualityComponent: number;
              verificationComponent: number;
              locationComponent: number;
              change: number;
            } | null;
          }) => {
            // Convert date string to proper date
            const activityDate = activity.date ? new Date(activity.date).toISOString() : new Date().toISOString();
            
            return {
              id: activity.id,
              type: activity.type || 'event_joined',
              title: activity.title || 'Untitled Event',
              description: activity.hours 
                ? `Participated in ${activity.title} (${activity.hours} hours)` 
                : `Participated in ${activity.title}`,
              date: activityDate,
              points: activity.points || 0,
              scoreBreakdown: activity.scoreBreakdown || null,
            };
          }),
          organizationsWorkedWith: user.organizationsWorkedWith || [],
          autoTaggedSkills: user.autoTaggedSkills || [],
          sdgParticipations: user.sdgParticipations || [],
          certificateCount: user.certificateCount || 0,
          certificates: user.certificates || [],
        };
        
        console.log('✅ Mapped Profile:', mappedProfile);
        console.log('📋 Mapped Activities:', mappedProfile.recentActivity);
        console.log('📋 Mapped Activities Count:', mappedProfile.recentActivity?.length || 0);
        setProfile(mappedProfile);
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

  const fetchBadgeProgress = useCallback(async () => {
    if (!profile?.id) return;
    
    setBadgeProgressLoading(true);
    try {
      const response = await fetch(`/api/badges?type=individual&userId=${profile.id}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Badge progress data:', data);
        setBadgeProgressData({
          rankProgress: {
            currentRank: data.currentRank,
            nextRank: data.nextRank,
            currentProgress: data.currentProgress
          },
          sdgBadges: data.sdgBadges || []
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch badge progress:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching badge progress:', error);
    } finally {
      setBadgeProgressLoading(false);
    }
  }, [profile?.id]);

  // Fetch badge progress when badges tab becomes active
  useEffect(() => {
    if (activeTab === 'badges' && profile && !badgeProgressData && !badgeProgressLoading) {
      fetchBadgeProgress();
    }
  }, [activeTab, profile, badgeProgressData, badgeProgressLoading, fetchBadgeProgress]);

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
          isPublic: profile.isPublic,
          showEmail: profile.showEmail,
          showProgress: profile.showProgress,
          allowMessages: profile.allowMessages,
          stats: profile.stats,
        }} 
        onSave={async (updatedProfile) => {
          // Refresh profile data from API to ensure everything is synced
          await fetchProfile();
          // Keep user in edit mode after saving
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header with Banner */}
            <div className="relative">
        {/* Banner */}
        <div className="h-64 md:h-80 relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 relative">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-7xl md:text-9xl font-bold opacity-20">
                {profile.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
            </div>

        {/* Profile Info Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-48 pb-6">
            <Card className="border-2 border-gray-100 dark:border-gray-800 shadow-xl bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                {/* Tier Badge - Top Right */}
                <div className="absolute top-4 right-4">
                    <Badge 
                    className="px-3 py-1 text-sm font-medium"
                      style={{ 
                        backgroundColor: getRankColor(profile.currentRank) + '20', 
                        color: getRankColor(profile.currentRank),
                      borderColor: getRankColor(profile.currentRank) + '40',
                      border: '1px solid'
                      }}
                    >
                      {profile.currentRank}
                    </Badge>
                  </div>
                  
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar with glow */}
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-75"></div>
                    <Avatar className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-gray-900 shadow-lg">
                      {profile.avatar ? (
                        <AvatarImage src={profile.avatar} alt={profile.name} />
                      ) : (
                        <AvatarFallback className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {profile.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 w-full md:w-auto min-w-0">
                    <div className="space-y-4">
                      {/* Name */}
                      <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight text-center md:text-left">
                        {profile.name}
                      </h1>

                  {/* Bio */}
                  {profile.bio && (
                        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl leading-relaxed text-center md:text-left">
                      {profile.bio}
                    </p>
                  )}

                      {/* Stats */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-base">
                    {profile.location && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                              <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">
                              {profile.location.city && profile.location.country 
                                ? `${profile.location.city}, ${profile.location.country}`
                                : profile.location.city || profile.location.country || 'Global'
                              }
                      </span>
                          </div>
                        )}
                        
                        {profile.stats?.followers !== undefined && (
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-semibold">{profile.stats.followers}</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {profile.stats.followers === 1 ? 'Connection' : 'Connections'}
                    </span>
                  </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Active since {new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Contact Info */}
                    {profile.website && (
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                            <Globe className="w-4 h-4" />
                        Website
                      </a>
                        </div>
                      )}

                {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                  <Button 
                    variant="outline" 
                          className="flex-1 sm:flex-none text-sm px-4 py-2"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                          Share Profile
                  </Button>
                  <Button 
                          className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 text-sm px-4 py-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
              </CardContent>
            </Card>
        </div>
                </div>
              </div>
              
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Impact Score</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.impaktrScore}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Hours</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.stats?.totalHours || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.stats?.eventsJoined || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Badges</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {profile.stats?.badgesEarned || 0}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
          {/* Pill-like Navigation */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'about' ? 'default' : 'outline'}
              onClick={() => setActiveTab('about')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'about' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              About
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
              variant={activeTab === 'badges' ? 'default' : 'outline'}
              onClick={() => setActiveTab('badges')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'badges' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Badges & Progress
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
              variant={activeTab === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveTab('analytics')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'analytics' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Analytics
            </Button>
          </div>

          {/* About Tab Content */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* SDG Focus Areas */}
            {profile.sdgFocus && profile.sdgFocus.length > 0 && (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    SDG Focus Areas ({profile.sdgFocus.length})
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Sustainable Development Goals of interest
                  </p>
                <div className="flex flex-wrap gap-2">
                    {profile.sdgFocus.map((sdgId: number) => {
                      const sdgInfo = getSDGById(sdgId);
                      if (!sdgInfo) return null;
                      
                      return (
                        <Badge 
                          key={sdgId} 
                          variant="outline" 
                          className="px-3 py-1 text-sm flex items-center gap-1.5"
                          style={{ borderColor: sdgInfo.color }}
                        >
                          <Image 
                            src={sdgInfo.image || ''} 
                            alt={`SDG ${sdgInfo.id}`}
                            width={16}
                            height={16}
                            className="w-4 h-4 flex-shrink-0"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <span className="font-semibold">SDG {sdgInfo.id}</span>
                          <span className="text-gray-600 dark:text-gray-400">{sdgInfo.title}</span>
                    </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organizations Worked With */}
            {profile.organizationsWorkedWith && profile.organizationsWorkedWith.length > 0 && (
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Organizations Worked With ({profile.organizationsWorkedWith.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.organizationsWorkedWith.map((org) => (
                      <Link 
                        key={org.id} 
                        href={`/organizations/${org.id}`}
                        className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                      >
                        <Avatar className="w-12 h-12 flex-shrink-0">
                          {org.logo ? (
                            <AvatarImage src={org.logo} alt={org.name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                              {org.name.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {org.name}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {org.events} events
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {org.hours}h
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                      </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Auto-Tagged Skills & SDG Participation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demonstrated Skills */}
              {profile.autoTaggedSkills && profile.autoTaggedSkills.length > 0 && (
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                      Demonstrated Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Skills automatically verified through event participation
                    </p>
                    <div className="space-y-3">
                      {profile.autoTaggedSkills.map((skill, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"></div>
                            <span className="font-medium text-sm">
                              {skill.skill}
                            </span>
                          </div>
                          <Badge variant="secondary" className={`px-3 py-1 ${getSkillBadgeClasses(skill.skill)}`}>
                            {skill.eventCount} {skill.eventCount === 1 ? 'event' : 'events'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SDG Participation */}
              {profile.sdgParticipations && profile.sdgParticipations.length > 0 && (
                <Card className="bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      SDG Participation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      UN Sustainable Development Goals contributions
                    </p>
                    <div className="space-y-3">
                      {profile.sdgParticipations.map((sdgData, index) => {
                        const sdgInfo = getSDGById(sdgData.sdgNumber);
                        if (!sdgInfo) return null;
                        
                        return (
                          <div key={index} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                <Image 
                                  src={sdgInfo.image} 
                                  alt={`SDG ${sdgInfo.id}`}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    if (target.parentElement) {
                                      target.parentElement.style.backgroundColor = sdgInfo.color;
                                      target.parentElement.innerHTML = `
                                        <div class="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                          ${sdgInfo.id}
                                        </div>
                                      `;
                                    }
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm">
                                  SDG {sdgInfo.id}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {sdgInfo.title}
                                </p>
                              </div>
                            </div>
                            <Badge className="px-3 py-1 text-white text-xs whitespace-nowrap flex-shrink-0" style={{ backgroundColor: sdgInfo.color }}>
                              {sdgData.eventCount} {sdgData.eventCount === 1 ? 'event' : 'events'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Certificates Badge */}
            {profile.certificateCount && profile.certificateCount > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {profile.certificateCount} Verified {profile.certificateCount === 1 ? 'Certificate' : 'Certificates'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Issued by verified organizations for completed volunteer work
                      </p>
                    </div>
                    <Badge className="px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Verified ✓
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Preview */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
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
                    {profile.recentActivity && profile.recentActivity.length > 0 ? (
                      profile.recentActivity.slice(0, 3).map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white">{activity.title}</h4>
                            {activity.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{activity.description}</p>
                            )}
                      </div>
                      <div className="text-right flex-shrink-0">
                            {activity.points && activity.points > 0 && (
                              <div className="text-sm font-bold text-green-600 dark:text-green-400 mb-1">
                                +{activity.points.toFixed(1)} pts
                              </div>
                            )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatTimeAgo(activity.date)}
                        </div>
                      </div>
                    </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            </div>
          )}

          {/* Badges Tab Content */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              {/* Overall Rank Progress */}
              <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                
                <CardHeader className="relative">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    Overall Rank Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {/* Current Rank - Large Display */}
                  <div className="text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                      <Award className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {profile.currentRank}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Current Rank
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile.impaktrScore.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Impact Score</div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile.stats?.totalHours || 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Hours</div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 text-center">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                        <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {profile.stats?.eventsJoined || 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                    </div>
                  </div>

                  {/* Next Rank Progress */}
                  {badgeProgressLoading ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ) : badgeProgressData?.rankProgress?.nextRank ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                      <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Rank</p>
                          <Badge className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                            {badgeProgressData.rankProgress.nextRank.name}
                            </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {Math.round((badgeProgressData.rankProgress.currentProgress.score / badgeProgressData.rankProgress.nextRank.requirements.minScore) * 100)}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Complete</p>
                      </div>
                  </div>
                      <Progress 
                        value={(badgeProgressData.rankProgress.currentProgress.score / badgeProgressData.rankProgress.nextRank.requirements.minScore) * 100} 
                        className="h-3 mb-4" 
                      />
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {badgeProgressData.rankProgress.currentProgress.score}/{badgeProgressData.rankProgress.nextRank.requirements.minScore}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">Score</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {badgeProgressData.rankProgress.currentProgress.hours}/{badgeProgressData.rankProgress.nextRank.requirements.minHours}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">Hours</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {badgeProgressData.rankProgress.currentProgress.badges}/{badgeProgressData.rankProgress.nextRank.requirements.minBadges}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400">Badges</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-center gap-2 text-yellow-900 dark:text-yellow-200">
                        <Star className="w-6 h-6 fill-current" />
                        <p className="font-semibold text-lg">Maximum Rank Achieved!</p>
                      </div>
                      <p className="text-center text-sm text-yellow-800 dark:text-yellow-300 mt-2">
                        You&apos;ve reached the highest rank. Keep making an impact!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* All Badges */}
              <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-600" />
                      All Badges ({profile.stats?.badgesEarned || 0})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.badges && profile.badges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.badges.map((badge) => {
                        const sdg = getSDGById(badge.sdgNumber);
                        return (
                          <div key={badge.id} className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            {sdg && (
                              <div
                                className="w-12 h-12 rounded flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
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
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                Earned {new Date(badge.earnedAt).toLocaleDateString()}
                              </p>
            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                      No badges earned yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* SDG Badge Progress */}
              {badgeProgressLoading ? (
                <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      SDG Badge Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                          <div className="flex gap-3">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : badgeProgressData && badgeProgressData.sdgBadges && badgeProgressData.sdgBadges.length > 0 && badgeProgressData.sdgBadges.filter(sdg => sdg.tiers.some(t => t.progress.hours > 0 || t.earned || t.progress.activities > 0)).length > 0 ? (
                <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-green-500/10" />
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      SDG Badge Progress
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Track your progress across UN Sustainable Development Goals
                    </p>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {badgeProgressData.sdgBadges
                        .filter(sdg => sdg.tiers.some(t => t.progress.hours > 0 || t.earned || t.progress.activities > 0))
                        .map((sdgBadge) => {
                          const sdgInfo = getSDGById(sdgBadge.sdgNumber);
                          const earnedTiers = sdgBadge.tiers.filter(tier => tier.earned);
                          const currentTier = earnedTiers.length > 0 ? earnedTiers[earnedTiers.length - 1] : null;
                          const nextTier = sdgBadge.tiers.find(tier => !tier.earned);
                          const totalHours = sdgBadge.tiers.length > 0 ? sdgBadge.tiers[0].progress.hours : 0;
                          const totalActivities = sdgBadge.tiers.length > 0 ? sdgBadge.tiers[0].progress.activities : 0;
                          
                          const tierInfo = {
                            SUPPORTER: { 
                              name: 'Supporter', 
                              color: 'bg-blue-100 text-blue-800 border-blue-200',
                              icon: '🌱'
                            },
                            BUILDER: { 
                              name: 'Builder', 
                              color: 'bg-green-100 text-green-800 border-green-200',
                              icon: '🏗️'
                            },
                            CHAMPION: { 
                              name: 'Champion', 
                              color: 'bg-purple-100 text-purple-800 border-purple-200',
                              icon: '🏆'
                            },
                            GUARDIAN: { 
                              name: 'Guardian', 
                              color: 'bg-gold-100 text-gold-800 border-gold-200',
                              icon: '🛡️'
                            }
                          };
                          
                          const getTierInfo = (tier: string) => {
                            return tierInfo[tier as keyof typeof tierInfo] || tierInfo.SUPPORTER;
                          };

                          return (
                            <Card key={sdgBadge.sdgNumber} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                              currentTier ? 'ring-2 ring-primary/20 bg-primary/5' : 
                              (totalHours > 0 || totalActivities > 0) ? 'ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800' : 
                              'opacity-75 hover:opacity-100'
                            }`}>
                              {/* Status Indicator */}
                              <div className="absolute top-2 right-2">
                                {earnedTiers.length > 0 && (
                                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <Star className="w-3 h-3 text-white fill-white" />
                                  </div>
                                )}
                                {!currentTier && totalHours === 0 && totalActivities === 0 && (
                                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                                    <Lock className="w-3 h-3 text-gray-600" />
                                  </div>
                                )}
                              </div>

                              <CardContent className="p-6">
                                {/* Header: SDG Badge Centered */}
                                <div className="text-center mb-4">
                                  <div className="flex flex-col justify-center items-center gap-2 mb-4">
                                    <Badge 
                                      variant="outline" 
                                      className="px-3 py-1 text-sm inline-flex items-center gap-1.5 whitespace-nowrap"
                                      style={{ borderColor: sdgInfo?.color || '#000' }}
                                    >
                                      {sdgInfo && (
                                        <Image 
                                          src={sdgInfo.image || ''} 
                                          alt={`SDG ${sdgBadge.sdgNumber}`}
                                          width={16}
                                          height={16}
                                          className="w-4 h-4 flex-shrink-0"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <span className="font-semibold">SDG {sdgBadge.sdgNumber}</span>
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className="px-3 py-1 text-sm"
                                      style={{ 
                                        borderColor: sdgInfo?.color || '#000',
                                        backgroundColor: sdgInfo?.color ? `${sdgInfo.color}20` : 'transparent'
                                      }}
                                    >
                                      <span className="text-gray-600 dark:text-gray-400">{sdgBadge.sdgName}</span>
                                    </Badge>
                                  </div>
                                  <div className="flex justify-center my-4">
                                    <div className="relative w-20 h-20">
                                      {currentTier ? (
                                        <Image
                                          src={getSDGBadgeImage(sdgBadge.sdgNumber, currentTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                                          alt={`${currentTier.name} - SDG ${sdgBadge.sdgNumber}`}
                                          width={80}
                                          height={80}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : nextTier ? (
                                        <Image 
                                          src={getSDGBadgeImage(sdgBadge.sdgNumber, nextTier.tier as 'SUPPORTER' | 'BUILDER' | 'CHAMPION' | 'GUARDIAN')}
                                          alt={`${nextTier.name} - SDG ${sdgBadge.sdgNumber}`}
                                          width={80}
                                          height={80}
                                          className="w-full h-full object-contain opacity-50"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                          <Award className="w-8 h-8 text-gray-400" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Badge Name and Tier */}
                                  <div className="mb-4 space-y-2">
                                    {(currentTier || nextTier) && (() => {
                                      const tier = (currentTier || nextTier)!;
                                      const tierData = getTierInfo(tier.tier);
                                      return (
                                        <>
                                          <div className="font-bold text-xl text-gray-900 dark:text-white">
                                            {tier.name}
                                          </div>
                                          <div>
                                            <Badge className={`text-xs ${tierData.color}`}>
                                              {tier.tier}
                                            </Badge>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Progress Section */}
                                {!currentTier && nextTier && (
                                  <div className="space-y-3 mb-4">
                                    {/* Overall Progress */}
                                    <div>
                                      <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                                        <span className="font-medium">{Math.round(nextTier.progress.percentage)}%</span>
                                      </div>
                                      <Progress value={nextTier.progress.percentage} className="h-2" />
                                    </div>
                                    
                                    {/* Hours Progress */}
                                    <div>
                                      <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Hours</span>
                                        <span className={totalHours >= nextTier.requirements.minHours ? 'text-green-600 dark:text-green-400 font-medium' : 'font-medium'}>
                                          {totalHours}/{nextTier.requirements.minHours}
                                        </span>
                                      </div>
                                      <Progress 
                                        value={(totalHours / nextTier.requirements.minHours) * 100} 
                                        className="h-2" 
                                      />
                                    </div>

                                    {/* Activities Progress */}
                                    <div>
                                      <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Activities</span>
                                        <span className={totalActivities >= nextTier.requirements.minActivities ? 'text-green-600 dark:text-green-400 font-medium' : 'font-medium'}>
                                          {totalActivities}/{nextTier.requirements.minActivities}
                                        </span>
                                      </div>
                                      <Progress 
                                        value={(totalActivities / nextTier.requirements.minActivities) * 100} 
                                        className="h-2" 
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Earned Badge Info */}
                                {earnedTiers.length > 0 && !nextTier && (
                                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
                                      <CheckCircle className="w-4 h-4" />
                                      <span className="text-sm font-semibold">All Tiers Completed!</span>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Achievement Summary */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                      Achievement Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {profile.stats?.badgesEarned || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Badges Earned
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {badgeProgressData?.sdgBadges?.filter(sdg => sdg.tiers.some(t => t.progress.hours > 0 || t.earned || t.progress.activities > 0)).length || 0}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          SDG Areas
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                      Keep participating in events to earn more badges and advance your rank!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activity Tab Content */}
          {activeTab === 'activity' && (
            <div>
              {profile.recentActivity && profile.recentActivity.length > 0 ? (
                <ActivityTimeline 
                  activities={profile.recentActivity.map(activity => ({
              ...activity,
              type: activity.type as 'event_joined' | 'event_completed' | 'badge_earned' | 'rank_up' | 'milestone' | 'verification' | 'certificate_shared',
                    description: activity.description || `Participated in ${activity.title}`,
                    points: activity.points || 0,
                    scoreBreakdown: activity.scoreBreakdown || null,
                  }))}
                  eventsJoined={profile.stats?.eventsJoined}
                  eventsCompleted={profile.stats?.eventsCompleted}
                />
              ) : (
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardContent className="p-12 text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">No Activities Yet</h3>
                    <p className="text-muted-foreground">
                      {profile.stats?.eventsJoined === 0 
                        ? "You haven't joined any events yet. Start your impact journey by joining an event!"
                        : "Your activities will appear here once you participate in events."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Events Joined: {profile.stats?.eventsJoined || 0} | 
                      Events Completed: {profile.stats?.eventsCompleted || 0}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Certificates Tab Content */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {/* Event Cards Section */}
              <div>
                {isLoadingParticipations ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : participations.length > 0 ? (
                  <div className="space-y-4">
                    {participations.map((participation) => {
                      const event = participation.event;
                      if (!event) return null;
                      
                      // Parse location data
                      let locationData: any = {};
                      if (event.location) {
                        try {
                          locationData = typeof event.location === 'string' 
                            ? JSON.parse(event.location) 
                            : event.location;
                        } catch (e) {
                          locationData = { city: 'Unknown', country: 'Unknown', isVirtual: false };
                        }
                      }
                      
                      // Parse SDG data
                      let sdgData: number[] = [];
                      if (event.sdg) {
                        try {
                          sdgData = typeof event.sdg === 'string' 
                            ? JSON.parse(event.sdg) 
                            : Array.isArray(event.sdg) 
                            ? event.sdg 
                            : [event.sdg];
                        } catch (e) {
                          sdgData = [];
                        }
                      }
                      
                      const mainImage = event.imageUrl || (event.images && event.images.length > 0 ? event.images[0] : null);
                      
                      const formatEventDate = (dateString: string) => {
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        });
                      };
                      
                      const formatEventTimeRange = (startDate: string, endDate?: string) => {
                        const start = new Date(startDate);
                        const end = endDate ? new Date(endDate) : null;
                        const startTime = start.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        if (end && end.getTime() !== start.getTime()) {
                          const endTime = end.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          });
                          return `${startTime} - ${endTime}`;
                        }
                        return startTime;
                      };
                      
                      return (
                        <Card key={participation.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden">
                          <div className="flex">
                            {/* Event Card Content */}
                            <div className="flex-1 flex">
                              {/* Event Image */}
                              <div className="relative w-48 h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 flex-shrink-0">
                                {mainImage ? (
                                  <Image 
                                    src={mainImage} 
                                    alt={event.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Calendar className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                {event.status === 'COMPLETED' && (
                                  <Badge className="absolute top-2 left-2 bg-gray-500 text-white border border-white dark:border-transparent px-3 py-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Event Details */}
                              <CardContent className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
                                </div>
                                
                                {/* Organization Info */}
                                {event.organization && (
                                  <div className="flex items-center gap-2 mb-3">
                                    {event.organization.logo ? (
                                      <Image 
                                        src={event.organization.logo} 
                                        alt={event.organization.name}
                                        width={20}
                                        height={20}
                                        className="rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Building2 className="w-3 h-3 text-white" />
                                      </div>
                                    )}
                                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                      {event.organization.name}
                                    </span>
                                  </div>
                                )}
                                
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                                  {event.startDate && (
                                    <>
                                      <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {formatEventDate(event.startDate)}
                                      </div>
                                      {event.endDate && (
                                        <div className="flex items-center ml-6">
                                          <Clock className="w-4 h-4 mr-2" />
                                          {formatEventTimeRange(event.startDate, event.endDate)}
                                        </div>
                                      )}
                                    </>
                                  )}
                                  
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-2" />
                                    {locationData.isVirtual ? 'Virtual Event' : `${locationData.city || 'Unknown'}, ${locationData.country || 'Unknown'}`}
                                  </div>
                                  
                                  {participation.hoursVerified && (
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-2" />
                                      <span>{participation.hoursVerified} hours verified</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-auto">
                                  {participation.status && (
                                    <Badge className={participation.status === 'VERIFIED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}>
                                      {participation.status}
                                    </Badge>
                                  )}
                                  {sdgData && sdgData.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {sdgData.slice(0, 3).map((sdg: number) => {
                                        const sdgInfo = getSDGById(sdg);
                                        return (
                                          <Badge 
                                            key={sdg} 
                                            className="text-xs px-2 py-0.5"
                                            style={{ 
                                              backgroundColor: `${getSDGColor(sdg)}20`,
                                              color: getSDGColor(sdg),
                                              borderColor: getSDGColor(sdg)
                                            }}
                                          >
                                            SDG {sdg}
                                          </Badge>
                                        );
                                      })}
                                      {sdgData.length > 3 && (
                                        <Badge className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                          +{sdgData.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </div>
                            
                            {/* Generate Certificate Button */}
                            <div className="flex items-center p-4 border-l border-gray-200 dark:border-gray-700">
                              <Button
                                onClick={() => handleGenerateCertificate(participation)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 whitespace-nowrap"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                {participation.certificate ? 'View Certificate' : 'Generate Certificate'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        No Completed Events Yet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete and verify participation in events to generate certificates
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab Content */}
          {activeTab === 'analytics' && (
            <div>
            <ImpactStatistics userId={profile.id} />
            </div>
          )}
        </div>
          {/* End Left Column */}

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Current Rank */}
            <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-gray-800">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
              
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Current Rank
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                {/* Current Rank - Large Display */}
                <div className="text-center py-6 px-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {profile.currentRank}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Current Rank
                  </p>
                </div>
                <Link href="/profile/badges" className="block mt-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    View All Badge Progress
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Leaderboard Ranking */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg mb-4 text-center text-gray-900 dark:text-white">
                  Leaderboard Ranking
                </h3>
                
                {/* Rankings Side by Side */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Global Rank */}
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Global
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {leaderboardRank ? `#${leaderboardRank.toLocaleString()}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {leaderboardTotal ? `${leaderboardTotal.toLocaleString()} total` : '-'}
                    </p>
                  </div>
                  
                  {/* Local Rank */}
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Local {profile?.country ? `(${profile.country})` : ''}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profile?.stats?.localRank ? `#${profile.stats.localRank.toLocaleString()}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {profile?.stats?.localTotal ? `${profile.stats.localTotal.toLocaleString()} total` : '-'}
                    </p>
                  </div>
                </div>

                <Link href="/leaderboards">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
                  >
                    View Leaderboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Languages & Skills */}
            {(profile.languages && profile.languages.length > 0) && (
              <Card className="bg-white dark:bg-gray-800">
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
                            <Badge key={language} variant="secondary" className={getLanguageBadgeClasses(language)}>
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {profile.autoTaggedSkills && profile.autoTaggedSkills.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.autoTaggedSkills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className={getSkillBadgeClasses(skill.skill)}>
                              {skill.skill}
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
        </div>
      </div>

    </div>
  );
}