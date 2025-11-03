// home/ubuntu/impaktrweb/src/app/organization/profile/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
  Leaf,
  Target,
  Heart,
  CheckCircle,
  ExternalLink,
  Eye,
  Camera,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Shield,
  Zap,
  Activity,
  BarChart3,
  ChevronRight,
  ArrowRight,
  Plus,
  X,
  Trophy,
  MessageCircle,
  Trash2
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UnifiedFeed } from '@/components/dashboard/UnifiedFeed';
import { EventCard } from '@/components/events/EventCard';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { FollowersList } from '@/components/organization/FollowersList';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { toast } from 'react-hot-toast';
import { formatTimeAgo, getInitials } from '@/lib/utils';
import { getSDGById, getSDGColor as getSDGColorHelper } from '@/constants/sdgs';

interface OrganizationProfile {
  id: string;
  name: string;
  email: string;
  website?: string;
  description?: string;
  mission?: string;
  vision?: string;
  values?: string[];
  industry?: string | null;
  companySize?: string | null;
  country: string;
  address?: string;
  city?: string;
  phone?: string;
  logo?: string;
  banner?: string;
  type?: string;
  createdAt: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  sdgFocus?: number[];
  stats: {
    totalMembers: number;
    totalEvents: number;
    totalVolunteerHours: number;
    impactScore: number;
    badgesEarned: number;
    esgScore: number;
    participationRate?: number;
    activeProjects?: number;
    globalRank?: number;
    globalTotal?: number;
    localRank?: number;
    localTotal?: number;
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
    imageUrl?: string;
  }>;
  upcomingEvents?: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    location: string | object;
    status: string;
    imageUrl?: string;
    sdg?: string | number | number[];
    organization?: {
      id: string;
      name: string;
      logo?: string | null;
    };
    _count?: {
      participations: number;
    };
  }>;
  pastEvents?: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate?: string;
    location: string | object;
    status: string;
    imageUrl?: string;
    sdg?: string | number | number[];
    organization?: {
      id: string;
      name: string;
      logo?: string | null;
    };
    _count?: {
      participations: number;
    };
  }>;
  opportunities?: Array<{
    id: string;
    title: string;
    description: string;
    location?: string;
    spots: number;
    spotsFilled: number;
    deadline?: string;
    status: string;
    sdg?: string;
    skills: string[];
    requirements: string[];
    isRemote: boolean;
    createdAt: string;
    stats?: {
      totalApplications: number;
      spotsRemaining: number;
    };
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
    id?: string;
    userId: string;
    role: string;
    name?: string;
    email?: string;
    avatar?: string;
    impactScore?: number;
    user?: {
    id: string;
      name: string | null;
    email: string;
      image: string | null;
    };
  }>;
  sdgs?: number[];
  impactScore?: number;
  memberCount?: number;
  eventCount?: number;
  totalHours?: number;
  followerCount?: number;
  topVolunteers?: Array<{
    id: string;
    name: string;
    image?: string;
    avatar?: string;
    hours: number;
    impactScore?: number;
  }>;
  esgData?: {
    environmental: { total: number };
    social: { total: number };
    governance: { total: number };
    overall: number;
  };
  achievements?: Array<{
    id: string;
    title: string;
    description: string;
    date: string;
    icon: string;
  }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
  }>;
  partnerships?: Array<{
    id: string;
    name: string;
    logo?: string;
    type: string;
  }>;
}

export default function OrganizationProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('about');
  const [isAdmin, setIsAdmin] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<string[]>([]);
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [isCreatingOpportunity, setIsCreatingOpportunity] = useState(false);
  const [newOpportunity, setNewOpportunity] = useState({
    title: '',
    description: '',
    requirements: [] as string[],
    spots: 1,
    deadline: '',
    location: '',
    isRemote: false,
    skills: [] as string[],
    sdg: '',
  });

  // SDG Definitions (matching opportunities page)
  const SDG_DEFINITIONS = {
    1: { name: 'No Poverty', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    2: { name: 'Zero Hunger', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    3: { name: 'Good Health', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    4: { name: 'Quality Education', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    5: { name: 'Gender Equality', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    6: { name: 'Clean Water', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
    7: { name: 'Affordable Energy', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    8: { name: 'Decent Work', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
    9: { name: 'Innovation', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    10: { name: 'Reduced Inequalities', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
    11: { name: 'Sustainable Cities', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    12: { name: 'Responsible Consumption', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    13: { name: 'Climate Action', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    14: { name: 'Life Below Water', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    15: { name: 'Life on Land', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    16: { name: 'Peace, Justice', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    17: { name: 'Partnerships', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  };

  // Helper function to get badge color based on content
  const getBadgeColor = (text: string, type: 'requirement' | 'skill') => {
    const lowerText = text.toLowerCase();
    
    if (type === 'requirement') {
      // Requirements color scheme
      if (lowerText.includes('experience') || lowerText.includes('years')) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      } else if (lowerText.includes('skill') || lowerText.includes('ability')) {
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      } else if (lowerText.includes('available') || lowerText.includes('time')) {
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      } else if (lowerText.includes('check') || lowerText.includes('background')) {
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      } else if (lowerText.includes('transportation') || lowerText.includes('location')) {
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      } else {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      }
    } else {
      // Skills color scheme
      if (lowerText.includes('leadership') || lowerText.includes('management')) {
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      } else if (lowerText.includes('teaching') || lowerText.includes('education')) {
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      } else if (lowerText.includes('computer') || lowerText.includes('technical') || lowerText.includes('data')) {
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      } else if (lowerText.includes('communication') || lowerText.includes('patience')) {
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      } else if (lowerText.includes('environmental') || lowerText.includes('sustainability')) {
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      } else if (lowerText.includes('research') || lowerText.includes('analysis')) {
        return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
      } else {
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
      }
    }
  };

  const addRequirement = (requirement: string) => {
    if (requirement.trim() && !newOpportunity.requirements.includes(requirement.trim())) {
      setNewOpportunity(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirement.trim()]
      }));
    }
  };

  const removeRequirement = (requirementToRemove: string) => {
    setNewOpportunity(prev => ({
      ...prev,
      requirements: prev.requirements.filter(req => req !== requirementToRemove)
    }));
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !newOpportunity.skills.includes(skill.trim())) {
      setNewOpportunity(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setNewOpportunity(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleCreateOpportunity = async () => {
    if (!newOpportunity.title.trim() || !newOpportunity.description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    if (newOpportunity.requirements.length === 0) {
      toast.error('Please add at least one requirement');
      return;
    }

    try {
      setIsCreatingOpportunity(true);
      
      // Convert deadline from datetime-local format to ISO string if provided
      const opportunityData = {
        ...newOpportunity,
        deadline: newOpportunity.deadline 
          ? new Date(newOpportunity.deadline).toISOString()
          : undefined,
      };
      
      const response = await fetch('/api/organization/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(opportunityData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Opportunity posted successfully!');
        
        // Refresh profile data to get updated opportunities
        await fetchProfile();
        
        // Reset form
        setNewOpportunity({
          title: '',
          description: '',
          requirements: [],
          spots: 1,
          deadline: '',
          location: '',
          isRemote: false,
          skills: [],
          sdg: '',
        });
        setShowCreateOpportunity(false);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create opportunity' }));
        toast.error(errorData.error || 'Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to create opportunity');
    } finally {
      setIsCreatingOpportunity(false);
    }
  };

  const handleMessageUser = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!isAdmin) return;
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to remove member' }));
        throw new Error(errorData.error || 'Failed to remove member');
      }

      toast.success('Member removed successfully');
      // Refresh profile data
      fetchProfile();
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/organizations/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.organization);
        
        // Check if current user is admin or owner
        if (user?.id && data.organization.members) {
          const currentUserMembership = data.organization.members.find(
            (m: { userId?: string; email?: string; role: string }) => 
              m.userId === user.id || m.email === user.email
          );
          setIsAdmin(currentUserMembership?.role === 'admin' || currentUserMembership?.role === 'owner');
        }
      }
      
      // Load favorites
      try {
        const favoritesResponse = await fetch('/api/events/favorites');
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json();
          setFavorites(new Set(favoritesData.favorites?.map((f: { eventId: string }) => f.eventId) || []));
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
      
      // Load bookmarks
      try {
        const bookmarksResponse = await fetch('/api/events/bookmarks');
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json();
          setBookmarks(new Set(bookmarksData.bookmarks?.map((b: { eventId: string }) => b.eventId) || []));
        }
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
      
      // Load opportunity bookmarks and applications
      try {
        const oppBookmarksResponse = await fetch('/api/opportunities/bookmarks');
        if (oppBookmarksResponse.ok) {
          const oppBookmarksData = await oppBookmarksResponse.json();
          setBookmarkedOpportunities(oppBookmarksData.bookmarks?.map((b: { opportunityId: string }) => b.opportunityId) || []);
        }
      } catch (error) {
        console.error('Error loading opportunity bookmarks:', error);
      }
      
      try {
        const oppApplicationsResponse = await fetch('/api/opportunities/applications');
        if (oppApplicationsResponse.ok) {
          const oppApplicationsData = await oppApplicationsResponse.json();
          setAppliedOpportunities(oppApplicationsData.applications?.map((a: { opportunityId: string }) => a.opportunityId) || []);
        }
      } catch (error) {
        console.error('Error loading opportunity applications:', error);
      }
    } catch (error) {
      console.error('Error fetching organization profile:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [isLoading, user, router, fetchProfile]);

  const toggleFavorite = (eventId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const toggleBookmark = async (eventId: string) => {
    try {
      const isBookmarked = bookmarks.has(eventId);
      const response = await fetch(`/api/events/${eventId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setBookmarks(prev => {
          const newSet = new Set(prev);
          if (isBookmarked) {
            newSet.delete(eventId);
          } else {
            newSet.add(eventId);
          }
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleOpportunityBookmark = async (opportunityId: string) => {
    if (!user?.id) return;
    
    try {
      const isBookmarked = bookmarkedOpportunities.includes(opportunityId);
      const response = await fetch(`/api/opportunities/${opportunityId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setBookmarkedOpportunities(prev => 
          isBookmarked 
            ? prev.filter(id => id !== opportunityId)
            : [...prev, opportunityId]
        );
      }
    } catch (error) {
      console.error('Error bookmarking opportunity:', error);
    }
  };

  const handleOpportunityApply = async (opportunityId: string) => {
    if (!user?.id) return;
    
    setIsApplying(opportunityId);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setAppliedOpportunities(prev => [...prev, opportunityId]);
      }
    } catch (error) {
      console.error('Error applying:', error);
    } finally {
      setIsApplying(null);
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

  const getOrganizationTypeDisplay = (type?: string) => {
    switch (type) {
      case 'NGO': return 'Non-Profit Organization';
      case 'CORPORATE': return 'Corporation';
      case 'SCHOOL': return 'Education Institute';
      case 'HEALTHCARE': return 'Healthcare Organization';
      default: return 'Organization';
    }
  };

  const getSDGColor = (sdgNumber: number) => {
    return getSDGColorHelper(sdgNumber);
  };

  const getSDGTitle = (sdgNumber: number) => {
    const sdg = getSDGById(sdgNumber);
    return sdg?.title || `SDG ${sdgNumber}`;
  };

  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 dark:text-white">Organization Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">You are not part of any organization.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 h-80">
        {profile.banner ? (
          <Image 
            src={profile.banner} 
            alt="Organization Banner"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Edit Banner Button */}
        <Button 
          variant="outline" 
          size="sm"
          className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
          onClick={handleEdit}
        >
          <Camera className="w-4 h-4 mr-2" />
          Change Cover
        </Button>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Profile Header Card - Overlaps Banner */}
        <Card className="relative -mt-20 mb-6 border-0 shadow-xl bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Logo */}
              <div className="relative">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-gray-800 shadow-lg">
                  {profile.logo ? (
                    <AvatarImage src={profile.logo} alt={profile.name} />
                  ) : (
                    <AvatarFallback className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-white dark:bg-gray-700 shadow-md"
                  onClick={handleEdit}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              {/* Organization Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
                      {profile.stats?.badgesEarned > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-3">
                      {getOrganizationTypeDisplay(profile.type)}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {profile.industry && (
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1.5" />
                          <span>{profile.industry.replace(/_/g, ' ')}</span>
                        </div>
                      )}
                      {profile.companySize && (
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1.5" />
                          <span>{profile.companySize}</span>
                        </div>
                      )}
                      {profile.city && profile.country && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1.5" />
                          <span>{profile.city}, {profile.country}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5" />
                        <span>Joined {formatTimeAgo(profile.createdAt)}</span>
                      </div>
                    </div>

                    {profile.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-3xl leading-relaxed">
                        {profile.description}
                      </p>
                    )}

                    {/* Contact & Social Links */}
                    <div className="flex flex-wrap items-center gap-4">
                      {profile.website && (
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Globe className="w-4 h-4 mr-1.5" />
                          <span className="text-sm">Website</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                      {profile.email && (
                        <a 
                          href={`mailto:${profile.email}`}
                          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                          <Mail className="w-4 h-4 mr-1.5" />
                          <span className="text-sm">Contact</span>
                        </a>
                      )}
                      
                      {/* Social Media Icons */}
                      <div className="flex items-center gap-2 ml-2">
                        {profile.socialLinks?.linkedin && (
                          <a 
                            href={profile.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          >
                            <Linkedin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </a>
                        )}
                        {profile.socialLinks?.twitter && (
                          <a 
                            href={profile.socialLinks.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          >
                            <Twitter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </a>
                        )}
                        {profile.socialLinks?.facebook && (
                          <a 
                            href={profile.socialLinks.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          >
                            <Facebook className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </a>
                        )}
                        {profile.socialLinks?.instagram && (
                          <a 
                            href={profile.socialLinks.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                          >
                            <Instagram className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleShare} className="dark:border-gray-600 dark:text-gray-300">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button onClick={handleEdit} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.stats?.impactScore?.toFixed(1) || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Impact Score</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.stats?.totalMembers || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Team Members</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.stats?.totalEvents || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Events Hosted</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.stats?.totalVolunteerHours?.toLocaleString() || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Volunteer Hours</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.stats?.badgesEarned || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Badges Earned</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{profile.stats?.esgScore?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">ESG Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pill Navigation */}
            <div className="flex flex-wrap gap-2 mb-6">
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
                variant={activeTab === 'feed' ? 'default' : 'outline'}
                onClick={() => setActiveTab('feed')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'feed' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Latest Posts
              </Button>
              <Button
                variant={activeTab === 'impact' ? 'default' : 'outline'}
                onClick={() => setActiveTab('impact')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'impact' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                >
                  Impact
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
                variant={activeTab === 'opportunities' ? 'default' : 'outline'}
                onClick={() => setActiveTab('opportunities')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'opportunities' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Opportunities ({profile?.opportunities?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'followers' ? 'default' : 'outline'}
                onClick={() => setActiveTab('followers')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'followers' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Followers ({profile?.followerCount || 0})
              </Button>
              <Button
                variant={activeTab === 'volunteers' ? 'default' : 'outline'}
                onClick={() => setActiveTab('volunteers')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'volunteers' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Top Volunteers ({profile?.topVolunteers?.length || 0})
              </Button>
              <Button
                variant={activeTab === 'team' ? 'default' : 'outline'}
                onClick={() => setActiveTab('team')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'team' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                >
                  Team
              </Button>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Latest Posts Tab */}
              {activeTab === 'feed' && (
              <div className="mt-6">
                {profile && (
                  <UnifiedFeed 
                    type="organizations" 
                    limit={10} 
                    showCreatePost={isAdmin}
                    organizationId={profile.id}
                    isOrganizationAdmin={isAdmin}
                  />
                )}
              </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
              <div className="mt-6 space-y-6">
                {/* Organization Information */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      Organization Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About Us</h4>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {profile.description || 'No description available.'}
                      </p>
                        </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Industry</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {profile.industry ? profile.industry.replace(/_/g, ' ') : 'Not specified'}
                        </p>
                        </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Company Size</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {profile.companySize && profile.companySize !== '0' ? profile.companySize : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Location</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {profile.city && profile.country 
                            ? `${profile.city}, ${profile.country}`
                            : profile.country || 'Not specified'
                          }
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Website</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {profile.website ? (
                            <a 
                              href={profile.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {profile.website}
                            </a>
                          ) : 'Not provided'}
                        </p>
                      </div>
                    </div>
                    </CardContent>
                  </Card>

                {/* SDG Focus Areas */}
                {profile.sdgs && profile.sdgs.length > 0 && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-600" />
                        Our SDG Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {profile.sdgs.map((sdgId) => {
                          const sdg = getSDGById(sdgId);
                          return sdg ? (
                            <div key={sdgId} className="flex items-center space-x-3 p-3 border rounded-lg bg-white dark:bg-gray-800">
                              <Image 
                                src={sdg.image} 
                                alt={`SDG ${sdgId}`} 
                                width={32} 
                                height={32} 
                                className="w-8 h-8"
                              />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  SDG {sdgId}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {sdg.title}
                              </p>
                            </div>
                          </div>
                          ) : null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Team & Leadership */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Team & Leadership
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.members && profile.members.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.members.slice(0, 6).map((member) => {
                          const memberName = member.user?.name || member.name || member.user?.email || member.email || 'Unknown User';
                          const memberImage = member.user?.image || member.avatar;
                          const memberEmail = member.user?.email || member.email;
                          const memberId = member.id || member.userId;
                          const userId = member.userId || member.user?.id;
                          return (
                            <div key={member.userId || member.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <Avatar className="w-12 h-12">
                                {memberImage ? (
                                  <AvatarImage src={memberImage} alt={memberName} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                                    {memberName ? memberName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {memberName}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                  {member.role}
                                </p>
                                {memberEmail && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {memberEmail}
                                  </p>
                                )}
                              </div>
                              {/* Action buttons for admins */}
                              {isAdmin && userId && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMessageUser(userId)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Message user"
                                  >
                                    <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </Button>
                                  {member.role !== 'owner' && memberId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(memberId, memberName)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                      title="Remove member"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {profile.members.length > 6 && (
                          <div className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              +{profile.members.length - 6} more team members
                            </p>
                          </div>
                        )}
                          </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                        No team members found
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
              )}

              {/* Impact Tab */}
              {activeTab === 'impact' && (
              <div className="mt-6 space-y-6">
                {/* Impact Overview */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Impact Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="w-8 h-8 text-white" />
                          </div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                          {profile.impactScore?.toLocaleString() || profile.stats?.impactScore?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                          Total Impact Score
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Lives positively impacted
                        </div>
                      </div>
                      
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          {profile.totalHours?.toLocaleString() || profile.stats?.totalVolunteerHours?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                          Volunteer Hours
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          Hours of service contributed
                        </div>
                      </div>
                      
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                          {profile.memberCount?.toLocaleString() || profile.stats?.totalMembers?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                          Active Members
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-400">
                          Committed volunteers
                        </div>
                      </div>
                      </div>
                    </CardContent>
                  </Card>

                {/* ESG Impact Dashboard */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      ESG Impact Dashboard
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Environmental, Social, and Governance metrics based on actual organization activities
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* ESG Progress Bars */}
                      <div className="space-y-4">
                      <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Environmental Impact</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {profile.esgData?.environmental?.total?.toFixed(1) || '0'}%
                            </span>
                        </div>
                          <Progress 
                            value={profile.esgData?.environmental?.total || 0} 
                            className="h-3" 
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Based on SDG 6, 7, 11, 12, 13, 14, 15 activities and environmental initiatives
                          </p>
                      </div>
                    
                    <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Social Impact</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {profile.esgData?.social?.total?.toFixed(1) || '0'}%
                            </span>
                      </div>
                          <Progress 
                            value={profile.esgData?.social?.total || 0} 
                            className="h-3" 
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Based on SDG 1, 2, 3, 4, 5, 8, 10 activities and community engagement
                          </p>
                    </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Governance Impact</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {profile.esgData?.governance?.total?.toFixed(1) || '0'}%
                            </span>
                        </div>
                          <Progress 
                            value={profile.esgData?.governance?.total || 0} 
                            className="h-3" 
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Based on SDG 16, 17 activities and organizational transparency
                          </p>
                      </div>
                      </div>

                      {/* Overall ESG Score */}
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {profile.esgData?.overall?.toFixed(1) || '0'}
                          </div>
                          <div className="text-lg font-medium text-purple-700 dark:text-purple-300 mb-1">
                            Overall ESG Score
                          </div>
                          <div className="text-sm text-purple-600 dark:text-purple-400">
                            Calculated from Environmental (40%), Social (35%), and Governance (25%) metrics
                          </div>
                        </div>
                      </div>

                      {/* Real Performance Indicators */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {profile.totalHours?.toLocaleString() || profile.stats?.totalVolunteerHours?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Volunteer Hours</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {profile.eventCount || profile.stats?.totalEvents || '0'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Events Completed</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {profile.memberCount || profile.stats?.totalMembers || '0'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {profile.followerCount || '0'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
              <div className="mt-6 space-y-6">
                {/* Upcoming Events */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                    <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Upcoming Events
                      </CardTitle>
                      <Link href={`/events?org=${profile?.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-transparent hover:text-blue-600 dark:hover:text-blue-400">
                          View All
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                    </CardHeader>
                    <CardContent>
                    {profile.upcomingEvents && profile.upcomingEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profile.upcomingEvents
                          .slice(0, 6)
                          .map((event) => (
                            <EventCard 
                              key={event.id} 
                              event={{
                                ...event,
                                isBookmarked: bookmarks.has(event.id),
                                isFavorite: favorites.has(event.id),
                                currentParticipants: event._count?.participations || 0
                              }} 
                              onToggleFavorite={toggleFavorite}
                              onToggleBookmark={toggleBookmark}
                              showOrganization={false} 
                            />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No Upcoming Events
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          This organization doesn&apos;t have any upcoming events scheduled.
                        </p>
                        {isAdmin && (
                          <Link href="/events/create">
                            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                              <Calendar className="w-4 h-4 mr-2" />
                              Create Event
                            </Button>
                          </Link>
                        )}
                          </div>
                    )}
                  </CardContent>
                </Card>

                {/* Past Events */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      Recent Past Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.pastEvents && profile.pastEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {profile.pastEvents
                          .slice(0, 6)
                          .map((event) => (
                            <EventCard 
                              key={event.id} 
                              event={{
                                ...event,
                                isBookmarked: bookmarks.has(event.id),
                                isFavorite: favorites.has(event.id),
                                currentParticipants: event._count?.participations || 0
                              }} 
                              onToggleFavorite={toggleFavorite}
                              onToggleBookmark={toggleBookmark}
                              showOrganization={false} 
                            />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Clock className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No past events to display
                        </p>
                      </div>
                    )}
                    </CardContent>
                  </Card>

                {/* Event Statistics */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Event Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {profile.eventCount || profile.stats?.totalEvents || '0'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Events</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {profile.upcomingEvents?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {profile.pastEvents?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {profile.totalHours?.toLocaleString() || profile.stats?.totalVolunteerHours?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              )}

              {/* Opportunities Tab */}
              {activeTab === 'opportunities' && (
              <div className="mt-6 space-y-6">
                {/* Opportunities Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Opportunities
                  </h2>
                  <div className="flex items-center gap-2">
                    <Link href={`/opportunities?org=${profile?.id}`}>
                      <Button variant="outline" size="sm">
                        View All
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    {isAdmin && !showCreateOpportunity && (
                      <Button
                        onClick={() => setShowCreateOpportunity(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Post Opportunity
                      </Button>
                    )}
                  </div>
                </div>

                {/* Create Opportunity Form */}
                {showCreateOpportunity && isAdmin && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Post New Opportunity</CardTitle>
                      <Button 
                          variant="ghost"
                        size="sm"
                          onClick={() => setShowCreateOpportunity(false)}
                      >
                          <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Title *
                        </label>
                        <Input
                          placeholder="e.g., Beach Cleanup Volunteers Needed"
                          value={newOpportunity.title}
                          onChange={(e) => setNewOpportunity(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description *
                        </label>
                        <Textarea
                          placeholder="Describe the opportunity, what volunteers will do, impact, etc."
                          value={newOpportunity.description}
                          onChange={(e) => setNewOpportunity(prev => ({ ...prev, description: e.target.value }))}
                          className="min-h-[100px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Number of Spots
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={newOpportunity.spots}
                            onChange={(e) => setNewOpportunity(prev => ({ ...prev, spots: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Application Deadline
                          </label>
                          <Input
                            type="datetime-local"
                            value={newOpportunity.deadline}
                            onChange={(e) => setNewOpportunity(prev => ({ ...prev, deadline: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <LocationAutocomplete
                          value={newOpportunity.location}
                          onChange={(value) => setNewOpportunity(prev => ({ ...prev, location: value }))}
                          placeholder="Search or enter location (e.g., California, United States)"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Type to search from popular locations or enter your own
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isRemote"
                          checked={newOpportunity.isRemote}
                          onChange={(e) => setNewOpportunity(prev => ({ ...prev, isRemote: e.target.checked }))}
                          className="rounded"
                        />
                        <label htmlFor="isRemote" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Remote opportunity
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Requirements *
                        </label>
                        <Input
                          placeholder="Add requirement (press Enter)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addRequirement(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        {newOpportunity.requirements.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newOpportunity.requirements.map((req, index) => (
                              <Badge key={index} className={`cursor-pointer ${getBadgeColor(req, 'requirement')}`} onClick={() => removeRequirement(req)}>
                                {req} ×
                              </Badge>
                            ))}
                              </div>
                            )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Skills
                        </label>
                        <Input
                          placeholder="Add skill (press Enter)"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill(e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        {newOpportunity.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newOpportunity.skills.map((skill, index) => (
                              <Badge key={index} className={`cursor-pointer ${getBadgeColor(skill, 'skill')}`} onClick={() => removeSkill(skill)}>
                                {skill} ×
                                </Badge>
                            ))}
                              </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          SDG Alignment
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Select the Sustainable Development Goal this opportunity aligns with
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {Object.entries(SDG_DEFINITIONS).map(([number, info]) => {
                            const sdgNumber = parseInt(number);
                            const isSelected = newOpportunity.sdg === sdgNumber.toString();
                            return (
                              <button
                                key={sdgNumber}
                                type="button"
                                onClick={() => setNewOpportunity(prev => ({ 
                                  ...prev, 
                                  sdg: isSelected ? '' : sdgNumber.toString() 
                                }))}
                                className={`p-3 rounded-lg border-2 transition-all text-xs font-medium ${
                                  isSelected
                                    ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                    : 'border-gray-200 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                                }`}
                              >
                                <div className="text-center">
                                  <div className="font-bold mb-1">SDG {sdgNumber}</div>
                                  <div className="text-xs leading-tight">{info.name}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {newOpportunity.sdg && (
                          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700 dark:text-blue-300">
                                Selected: SDG {newOpportunity.sdg} - {SDG_DEFINITIONS[parseInt(newOpportunity.sdg) as keyof typeof SDG_DEFINITIONS]?.name}
                                </span>
                              <button
                                type="button"
                                onClick={() => setNewOpportunity(prev => ({ ...prev, sdg: '' }))}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                              >
                                ×
                              </button>
                              </div>
                            </div>
                        )}
                          </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setShowCreateOpportunity(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleCreateOpportunity}
                          disabled={isCreatingOpportunity || !newOpportunity.title.trim() || !newOpportunity.description.trim() || newOpportunity.requirements.length === 0}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {isCreatingOpportunity ? 'Posting...' : 'Post Opportunity'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Opportunities List */}
                <div className="grid gap-4">
                  {profile?.opportunities && profile.opportunities.length > 0 ? (
                    profile.opportunities.map((opportunity) => (
                      <OpportunityCard
                        key={opportunity.id}
                        opportunity={{
                          ...opportunity,
                          organization: { name: profile.name },
                          stats: {
                            totalApplications: opportunity.stats?.totalApplications || 0,
                            spotsRemaining: opportunity.stats?.spotsRemaining || (opportunity.spots - opportunity.spotsFilled)
                          }
                        }}
                        isBookmarked={bookmarkedOpportunities.includes(opportunity.id)}
                        isApplied={appliedOpportunities.includes(opportunity.id)}
                        isApplying={isApplying === opportunity.id}
                        onBookmark={handleOpportunityBookmark}
                        onApply={handleOpportunityApply}
                      />
                    ))
                  ) : (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
                      <CardContent className="p-12 text-center">
                        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                          No opportunities yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          This organization hasn&apos;t posted any opportunities yet.
                        </p>
                        {isAdmin && !showCreateOpportunity && (
                        <Button 
                            onClick={() => setShowCreateOpportunity(true)}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Post Your First Opportunity
                        </Button>
                    )}
                  </CardContent>
                </Card>
                  )}
                      </div>
                      </div>
              )}

              {/* Followers Tab */}
              {activeTab === 'followers' && (
              <div className="mt-6">
                {profile?.id && (
                  <FollowersList 
                    organizationId={profile.id} 
                    isAdmin={isAdmin}
                    onRefresh={fetchProfile}
                  />
                )}
              </div>
              )}

              {/* Top Volunteers Tab */}
              {activeTab === 'volunteers' && (
              <div className="mt-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Users className="w-5 h-5 text-blue-600" />
                      Top Volunteers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {profile.topVolunteers && profile.topVolunteers.length > 0 ? (
                      <div className="space-y-3">
                        {profile.topVolunteers.map((volunteer, index) => (
                          <Link key={volunteer.id} href={`/profile/${volunteer.id}`}>
                            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                              <div className="text-sm font-bold text-gray-400 w-6">
                                #{index + 1}
                              </div>
                              <Avatar className="h-8 w-8">
                                {volunteer.avatar ? (
                                  <AvatarImage src={volunteer.avatar} />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                                    {volunteer.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {volunteer.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {volunteer.hours} hours
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                        No volunteers yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
              )}

              {/* Team Tab */}
              {activeTab === 'team' && (
              <div className="mt-6 space-y-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-gray-900 dark:text-white">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        Team Members
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/organization/members')}
                        className="dark:border-gray-600"
                      >
                        Manage Team
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.members && profile.members.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {profile.members.map((member) => {
                          const memberName = member.user?.name || member.name || member.user?.email || member.email || 'Unknown User';
                          const memberImage = member.user?.image || member.avatar;
                          const memberEmail = member.user?.email || member.email;
                          const memberId = member.id || member.userId;
                          const userId = member.userId || member.user?.id;
                          return (
                            <div 
                              key={member.userId || member.id}
                              className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-700"
                            >
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={memberImage || undefined} alt={memberName} />
                                <AvatarFallback>{getInitials(memberName || 'Unknown')}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{memberName}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                                {member.impactScore !== undefined && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-3 h-3 text-yellow-500" />
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{member.impactScore} impact</span>
                                  </div>
                                )}
                              </div>
                              {/* Action buttons for admins */}
                              {isAdmin && userId && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMessageUser(userId)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    title="Message user"
                                  >
                                    <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </Button>
                                  {member.role !== 'owner' && memberId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMember(memberId, memberName)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                                      title="Remove member"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No team members yet</p>
                        <Button 
                          onClick={() => router.push('/organization/members/invite')}
                          className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        >
                          Invite Team Members
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              )}
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
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
                      {profile.stats?.globalRank ? `#${profile.stats.globalRank.toLocaleString()}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {profile.stats?.globalTotal ? `${profile.stats.globalTotal.toLocaleString()} total` : '-'}
                    </p>
                  </div>
                  
                  {/* Local Rank */}
                  <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Local {profile.country ? `(${profile.country})` : ''}
                    </p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {profile.stats?.localRank ? `#${profile.stats.localRank.toLocaleString()}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {profile.stats?.localTotal ? `${profile.stats.localTotal.toLocaleString()} total` : '-'}
                    </p>
                  </div>
                </div>

                <Link href="/leaderboards?type=organizations">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-2"
                  >
                    View Leaderboard
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Badges */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <Award className="w-5 h-5 text-yellow-600" />
                  Badges Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.badges && profile.badges.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {profile.badges.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Total badges earned
                    </p>
                    <Link href="/organization/achievements">
                      <Button variant="outline" size="sm" className="w-full mt-4">
                        View All Badges
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                    No badges earned yet
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Profile Strength</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Completeness</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Basic information completed
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Logo uploaded
                    </div>
                    <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                      <div className="w-4 h-4 mr-2 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      Add cover photo
                    </div>
                    <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                      <div className="w-4 h-4 mr-2 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                      Add social media links
                    </div>
                  </div>
                  <Button 
                    onClick={handleEdit}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                  >
                    Complete Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Views */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profile Views</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">1,234</p>
                    <p className="text-xs text-green-600 dark:text-green-400">+12% this month</p>
                  </div>
                  <Eye className="w-10 h-10 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <a href={`mailto:${profile.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                        {profile.email}
                      </a>
                    </div>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <a href={`tel:${profile.phone}`} className="text-sm text-gray-900 dark:text-white">
                        {profile.phone}
                      </a>
                    </div>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Website</p>
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all">
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
