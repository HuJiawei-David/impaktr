// home/ubuntu/impaktrweb/src/app/organization/profile/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  industry: string;
  companySize: string;
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
    impactScore?: number;
  }>;
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start bg-white dark:bg-gray-800 border-b dark:border-gray-700 rounded-none h-auto p-0">
                <TabsTrigger 
                  value="about" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  About
                </TabsTrigger>
                <TabsTrigger 
                  value="impact" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  Impact
                </TabsTrigger>
                <TabsTrigger 
                  value="events" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  Events
                </TabsTrigger>
                <TabsTrigger 
                  value="team" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none pb-3"
                >
                  Team
                </TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                {/* Mission & Vision */}
                {(profile.mission || profile.vision) && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-900 dark:text-white">
                        <Target className="w-5 h-5 mr-2 text-blue-600" />
                        Our Purpose
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {profile.mission && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Mission</h4>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.mission}</p>
                        </div>
                      )}
                      {profile.vision && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Vision</h4>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.vision}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* SDG Focus Areas */}
                {profile.sdgFocus && profile.sdgFocus.length > 0 && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-900 dark:text-white">
                        <Zap className="w-5 h-5 mr-2 text-blue-600" />
                        UN SDG Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {profile.sdgFocus.map((sdgNumber) => (
                          <div 
                            key={sdgNumber}
                            className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 hover:shadow-md transition-shadow"
                          >
                            <div 
                              className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white flex-shrink-0"
                              style={{ backgroundColor: getSDGColor(sdgNumber) }}
                            >
                              <div className="text-xs font-bold">SDG</div>
                              <div className="text-sm font-bold leading-none">{sdgNumber}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                {getSDGTitle(sdgNumber)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Organization Details */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900 dark:text-white">
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      Organization Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {profile.industry && (
                          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Industry</span>
                            <span className="font-medium text-gray-900 dark:text-white">{profile.industry.replace(/_/g, ' ')}</span>
                          </div>
                        )}
                        {profile.companySize && (
                          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Organization Size</span>
                            <span className="font-medium text-gray-900 dark:text-white">{profile.companySize}</span>
                          </div>
                        )}
                        {profile.type && (
                          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Type</span>
                            <span className="font-medium text-gray-900 dark:text-white">{getOrganizationTypeDisplay(profile.type)}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        {profile.country && (
                          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Country</span>
                            <span className="font-medium text-gray-900 dark:text-white">{profile.country}</span>
                          </div>
                        )}
                        {profile.city && (
                          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">City</span>
                            <span className="font-medium text-gray-900 dark:text-white">{profile.city}</span>
                          </div>
                        )}
                        {profile.address && (
                          <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Address</span>
                            <span className="font-medium text-gray-900 dark:text-white text-right">{profile.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Values */}
                {profile.values && profile.values.length > 0 && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-900 dark:text-white">
                        <Heart className="w-5 h-5 mr-2 text-blue-600" />
                        Our Values
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {profile.values.map((value, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300">{value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Impact Tab */}
              <TabsContent value="impact" className="mt-6 space-y-6">
                {/* Impact Highlights */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center text-gray-900 dark:text-white">
                      <Activity className="w-5 h-5 mr-2 text-blue-600" />
                      Impact Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Participation Rate */}
                    {profile.stats?.participationRate !== undefined && (
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Participation Rate</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{profile.stats.participationRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={profile.stats.participationRate} className="h-2" />
                      </div>
                    )}
                    
                    {/* ESG Score */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">ESG Score</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{profile.stats?.esgScore?.toFixed(1) || '0.0'}</span>
                      </div>
                      <Progress value={(profile.stats?.esgScore || 0) * 10} className="h-2" />
                    </div>

                    {/* Active Projects */}
                    {profile.stats?.activeProjects !== undefined && (
                      <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Projects</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{profile.stats.activeProjects}</p>
                        </div>
                        <Target className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-20" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Badges & Achievements */}
                {profile.badges && profile.badges.length > 0 && (
                  <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center text-gray-900 dark:text-white">
                        <Award className="w-5 h-5 mr-2 text-blue-600" />
                        Badges & Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {profile.badges.map((badge) => (
                          <div 
                            key={badge.id}
                            className="flex flex-col items-center p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="text-4xl mb-2">{badge.icon}</div>
                            <h4 className="font-semibold text-sm text-center text-gray-900 dark:text-white mb-1">{badge.name}</h4>
                            <Badge variant="outline" className="text-xs">{badge.tier}</Badge>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {formatTimeAgo(badge.earnedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Events Tab */}
              <TabsContent value="events" className="mt-6 space-y-6">
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-800 dark:border dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-gray-900 dark:text-white">
                        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                        Recent Events
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/organization/events')}
                        className="dark:border-gray-600"
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {profile.recentEvents && profile.recentEvents.length > 0 ? (
                      <div className="space-y-4">
                        {profile.recentEvents.slice(0, 5).map((event) => (
                          <div 
                            key={event.id} 
                            className="flex items-start gap-4 p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/events/${event.id}`)}
                          >
                            {event.imageUrl && (
                              <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <Image 
                                  src={event.imageUrl} 
                                  alt={event.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                                <Badge variant={event.status === 'ACTIVE' ? 'default' : 'secondary'} className="flex-shrink-0">
                                  {event.status === 'ACTIVE' ? 'Active' : event.status === 'DRAFT' ? 'Draft' : event.status === 'COMPLETED' ? 'Completed' : event.status === 'CANCELLED' ? 'Cancelled' : event.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{event.description}</p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {event.location.city}, {event.location.country}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatTimeAgo(event.startDate)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {event.participantCount} participants
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">No events yet</p>
                        <Button 
                          onClick={() => router.push('/organization/events/create')}
                          className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                        >
                          Create Your First Event
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-6 space-y-6">
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
                        {profile.members.map((member) => (
                          <div 
                            key={member.id}
                            className="flex items-center gap-3 p-4 border dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{member.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
                              {member.impactScore !== undefined && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{member.impactScore} impact</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
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
