'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  Building,
  Globe,
  Briefcase,
  CheckCircle,
  Heart,
  Share2,
  ArrowLeft,
  Upload,
  Loader2,
  Target,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getSDGById } from '@/constants/sdgs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { XCircle } from 'lucide-react';

const getOrganizationTypeDisplay = (type?: string) => {
  if (!type) return 'Organization';
  
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

interface Opportunity {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  spots: number;
  spotsFilled: number;
  deadline?: string;
  location?: string;
  isRemote: boolean;
  skills: string[];
  sdg?: string;
  status: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    logo?: string;
    type?: string;
    description?: string;
  };
  stats: {
    totalApplications: number;
    spotsRemaining: number;
  };
  isBookmarked?: boolean;
  isApplied?: boolean;
}

interface UserApplication {
  id: string;
  userId: string;
  status: string;
  message?: string | null;
  resumeUrl?: string | null;
  appliedAt: string;
  opportunity: {
    id: string;
    title: string;
    status: string;
    deadline?: string | null;
    location?: string | null;
    organization: {
      id: string;
      name: string;
      logo?: string | null;
    };
  };
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [showApplicationsPanel, setShowApplicationsPanel] = useState(false);
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [agreeToShare, setAgreeToShare] = useState(false);

  const getOpportunityId = useCallback(() => {
    const paramId = (params as { id?: string | string[] })?.id;
    if (Array.isArray(paramId)) {
      return paramId[0];
    }
    return paramId || '';
  }, [params]);

  useEffect(() => {
    const opportunityId = getOpportunityId();
    if (opportunityId) {
      fetchOpportunity(opportunityId);
    }
  }, [getOpportunityId]);

  const fetchOpportunity = async (opportunityId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/opportunities/${opportunityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunity');
      }

      const data = await response.json();
      setOpportunity(data);
      setIsBookmarked(data.isBookmarked || false);
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      toast.error('Failed to load opportunity');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    const opportunityId = getOpportunityId();
    if (!opportunityId) {
      toast.error('Opportunity not found');
      return;
    }
    if (!session) {
      toast.error('Please sign in to bookmark opportunities');
      return;
    }

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
        toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      toast.error('Failed to bookmark opportunity');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: opportunity?.title,
          text: opportunity?.description,
          url: url,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleApplyClick = () => {
    const opportunityId = getOpportunityId();
    if (!opportunityId) {
      toast.error('Opportunity not found');
      return;
    }
    if (!session) {
      toast.error('Please sign in to apply');
      router.push('/signin');
      return;
    }

    if (opportunity?.status !== 'OPEN') {
      toast.error('This opportunity is no longer accepting applications');
      return;
    }

    if (opportunity?.stats.spotsRemaining <= 0) {
      toast.error('This opportunity is full');
      return;
    }

    setApplicationMessage('');
    setResumeFile(null);
    setLinkedinUrl('');
    setAgreeToShare(false);
    setShowApplyModal(true);
  };

  const handleSubmitApplication = async () => {
    const opportunityId = getOpportunityId();
    if (!opportunityId) {
      toast.error('Opportunity not found');
      return;
    }
    if (!opportunity) return;
    if (!agreeToShare) {
      toast.error('Please agree to share your profile to continue');
      return;
    }

    try {
      setIsApplying(true);

      let resumeUrl = '';
      if (resumeFile) {
        setIsUploadingResume(true);
        const formData = new FormData();
        formData.append('file', resumeFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          resumeUrl = uploadData.url;
        }
        setIsUploadingResume(false);
      }

      const combinedMessage = linkedinUrl
        ? `${applicationMessage ? applicationMessage.trim() : ''}${applicationMessage ? '\n\n' : ''}LinkedIn: ${linkedinUrl}`
        : applicationMessage;

      const response = await fetch(`/api/opportunities/${opportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: combinedMessage,
          resumeUrl: resumeUrl,
        }),
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setShowApplyModal(false);
        setApplicationMessage('');
        setResumeFile(null);
        setLinkedinUrl('');
        setAgreeToShare(false);
        fetchOpportunity(opportunityId); // Refresh to update applied status
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setIsApplying(false);
      setIsUploadingResume(false);
    }
  };

  const closeApplicationsPanel = () => {
    setShowApplicationsPanel(false);
    setApplications([]);
    setIsLoadingApplications(false);
  };

  const handleViewApplications = async () => {
    const opportunityId = getOpportunityId();
    if (!opportunityId) {
      toast.error('Opportunity not found');
      return;
    }
    if (!session) {
      toast.error('Please sign in to view your applications');
      router.push('/signin');
      return;
    }

    setShowApplicationsPanel(true);
    setIsLoadingApplications(true);

    try {
      const response = await fetch('/api/applications', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Failed to fetch applications');
      }

      const data = await response.json();
      console.log('[Detail Page] Received applications data:', data);
      console.log('[Detail Page] Current session user ID:', session?.user?.id);
      
      const allApplications = (Array.isArray(data.applications)
        ? data.applications
        : []) as UserApplication[];

      const targetOrganizationId = opportunity?.organization?.id;
      const organizationApplications = targetOrganizationId
        ? allApplications.filter(
            (app) => app.opportunity?.organization?.id === targetOrganizationId
          )
        : allApplications;

      const uniqueApplications = organizationApplications.filter(
        (app, index, self) =>
          index === self.findIndex(
            (otherApp) => otherApp.opportunity?.id === app.opportunity?.id
          )
      );

      console.log(`[Detail Page] Total applications after org filter: ${uniqueApplications.length}`);
      allApplications.forEach((app: any) => {
        console.log(`[Detail Page] Application: ${app.id}, Opportunity: ${app.opportunity?.title}`);
      });
      
      // The API already filters by user, so we can trust the response
      setApplications(uniqueApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to load applications'
      );
      setApplications([]);
    } finally {
      setIsLoadingApplications(false);
    }
  };

  const getBadgeColor = (text: string, type: 'requirement' | 'skill') => {
    const lowerText = text.toLowerCase();
    
    if (type === 'requirement') {
      if (lowerText.includes('experience') || lowerText.includes('year')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      if (lowerText.includes('education') || lowerText.includes('degree')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      if (lowerText.includes('language')) return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      if (lowerText.includes('availability')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    } else {
      const colors = [
        'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
        'bg-lime-100 text-lime-700 dark:bg-lime-900 dark:text-lime-300',
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
        'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
        'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
        'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
        'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-300',
        'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
      ];
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'CLOSED':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'FILLED':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading opportunity..." />;
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Opportunity Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This opportunity may have been removed or is no longer available.
            </p>
            <Button
              onClick={() => router.push('/opportunities')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              Browse Opportunities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sdgInfo = opportunity.sdg ? getSDGById(parseInt(opportunity.sdg!)) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/opportunities')}
          className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Opportunities
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {opportunity.title}
                      </h1>
                      <Badge className={`px-3 py-1 ${getStatusColor(opportunity.status)}`}>
                        {opportunity.status}
                      </Badge>
                      {opportunity.isRemote && (
                        <Badge variant="outline" className="px-3 py-1">
                          <Globe className="h-3 w-3 mr-1" />
                          Remote
                        </Badge>
                      )}
                    </div>
                    
                    <Link href={`/organizations/${opportunity.organization.id}`}>
                      <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                        <Avatar className="h-10 w-10">
                          {opportunity.organization.logo && (
                            <AvatarImage src={opportunity.organization.logo} alt={opportunity.organization.name} />
                          )}
                          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                            {opportunity.organization.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {opportunity.organization.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {getOrganizationTypeDisplay(opportunity.organization.type)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleBookmark}
                      className="hover:bg-transparent"
                    >
                      <Heart className={`h-4 w-4 ${isBookmarked ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleShare}
                      className="hover:bg-transparent"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {opportunity.location && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{opportunity.location}</span>
                    </div>
                  )}
                  {opportunity.deadline && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Apply By: {new Date(opportunity.deadline).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{opportunity.stats.spotsRemaining} of {opportunity.spots} spots left</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <Briefcase className="h-4 w-4" />
                    <span>{opportunity.stats.totalApplications} applications</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </CardContent>
            </Card>

            {/* Requirements */}
            {opportunity.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {opportunity.requirements.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {opportunity.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Skills You'll Gain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.skills.map((skill, index) => (
                      <Badge key={index} className={`px-3 py-1 ${getBadgeColor(skill, 'skill')}`}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organization Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">About the Organization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {opportunity.organization.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 mb-4">
                    {opportunity.organization.description}
                  </p>
                )}
                <Link href={`/organizations/${opportunity.organization.id}`}>
                  <Button variant="outline" className="w-full">
                    <Building className="h-4 w-4 mr-2" />
                    View Organization Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* SDG Alignment */}
            {sdgInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-sm">
                    <Target className="h-4 w-4 mr-2" />
                    SDG Alignment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3 p-3 border-2 rounded-lg bg-white dark:bg-gray-800" style={{ borderColor: sdgInfo.color }}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden shadow-md flex-shrink-0">
                      <img 
                        src={sdgInfo.image} 
                        alt={`SDG ${sdgInfo.id}: ${sdgInfo.title}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.parentElement) {
                            target.parentElement.style.backgroundColor = sdgInfo.color;
                            target.parentElement.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                                ${sdgInfo.id}
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        SDG {sdgInfo.id}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {sdgInfo.title}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Apply Card */}
            <Card>
              <CardContent className="p-6">
                {opportunity.isApplied ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Application Submitted
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Your application is being reviewed by the organization.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleViewApplications}
                      disabled={isLoadingApplications}
                    >
                      {isLoadingApplications ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'View My Applications'
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={handleApplyClick}
                      disabled={opportunity.status !== 'OPEN' || opportunity.stats.spotsRemaining <= 0}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white mb-4"
                      size="lg"
                    >
                      {opportunity.status !== 'OPEN' ? 'Closed' : 
                       opportunity.stats.spotsRemaining <= 0 ? 'Full' : 
                       'Apply Now'}
                    </Button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      You'll be able to include a message and resume
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowApplyModal(false)}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6 z-10">
            <button
              onClick={() => setShowApplyModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Apply for {opportunity.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Share your interest and optional supporting information. Your profile will only be shared if you agree below.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Cover Message <span className="text-gray-500">(Optional)</span>
                </label>
                <Textarea
                  placeholder="Share why you're interested and what you can bring to this opportunity..."
                  value={applicationMessage}
                  onChange={(e) => setApplicationMessage(e.target.value)}
                  rows={5}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {applicationMessage.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  LinkedIn Profile <span className="text-gray-500">(Optional)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Share your LinkedIn profile if you’d like the organization to review it.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Resume <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="flex-1 flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {resumeFile ? resumeFile.name : 'Upload Resume'}
                    </span>
                  </label>
                  {resumeFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PDF, DOC, or DOCX (max 5MB)
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="agreeToShare"
                    checked={agreeToShare}
                    onChange={(e) => setAgreeToShare(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="agreeToShare"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      I agree to share my profile information with {opportunity.organization.name}
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      This includes your name, email, bio, skills, and any information you provide above.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowApplyModal(false)}
                className="flex-1"
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                disabled={isApplying || isUploadingResume || !agreeToShare}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                {isApplying || isUploadingResume ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isUploadingResume ? 'Uploading...' : 'Submitting...'}
                  </>
                ) : (
                  'Submit Application'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showApplicationsPanel && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeApplicationsPanel}
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4 p-6 z-10">
            <button
              onClick={closeApplicationsPanel}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                My Applications
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Review the opportunities you have applied for and track their status.
              </p>
            </div>

            {isLoadingApplications ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600 dark:text-gray-300">
                <Loader2 className="w-6 h-6 animate-spin mb-3" />
                Loading applications...
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Applications Yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Submit your first application to start tracking it here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
                    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                    SHORTLISTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                  };

                  const statusLabel =
                    application.status.charAt(0) +
                    application.status.slice(1).toLowerCase();
                  const isCurrentOpportunity =
                    application.opportunity?.id === opportunity.id;

                  const metaItems: { key: string; label: string; className?: string }[] = [
                    {
                      key: 'applied',
                      label: `Applied ${new Date(application.appliedAt).toLocaleString()}`
                    }
                  ];

                  if (isCurrentOpportunity) {
                    metaItems.push({
                      key: 'current',
                      label: 'This opportunity',
                      className: 'text-blue-600 dark:text-blue-300 font-medium'
                    });
                  }

                  if (application.opportunity.deadline) {
                    metaItems.push({
                      key: 'deadline',
                      label: `Deadline ${new Date(application.opportunity.deadline).toLocaleDateString()}`
                    });
                  }

                  if (application.opportunity.location) {
                    metaItems.push({
                      key: 'location',
                      label: application.opportunity.location
                    });
                  }

                  return (
                    <div
                      key={application.id}
                      className={`border rounded-lg p-4 transition-shadow ${
                        isCurrentOpportunity
                          ? 'border-blue-400 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/opportunities/${application.opportunity.id}`}
                              className="text-lg font-semibold text-gray-900 dark:text-white hover:underline"
                              onClick={closeApplicationsPanel}
                            >
                              {application.opportunity.title}
                            </Link>
                            <Badge
                              className={`px-2 py-1 text-xs ${statusColors[application.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                            >
                              {statusLabel}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {metaItems.map((item, index) => (
                              <React.Fragment key={`${application.id}-${item.key}`}>
                                {index > 0 && (
                                  <span className="text-gray-300 dark:text-gray-600">•</span>
                                )}
                                <span className={item.className}>{item.label}</span>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="relative flex shrink-0 overflow-hidden rounded-full h-10 w-10">
                            {application.opportunity.organization.logo ? (
                              <img
                                src={application.opportunity.organization.logo}
                                alt={application.opportunity.organization.name}
                                className="aspect-square h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                                {application.opportunity.organization.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {application.opportunity.organization.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Opportunity status: {application.opportunity.status}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(application.message || application.resumeUrl) && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                          {application.message && (
                            <div>
                              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold mb-1">
                                Message
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                {application.message}
                              </p>
                            </div>
                          )}
                          {application.resumeUrl && (
                            <div className="flex items-center gap-2">
                              <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold">
                                Resume
                              </p>
                              <a
                                href={application.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                View resume
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

