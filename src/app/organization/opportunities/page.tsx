'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Briefcase,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';

// SDG Definitions
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
  16: { name: 'Peace & Justice', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  17: { name: 'Partnerships', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
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
    tier: string;
  };
  stats: {
    totalApplications: number;
    spotsRemaining: number;
  };
  hasApplied: boolean;
  applicationStatus?: string;
}

interface Application {
  id: string;
  status: string;
  message?: string;
  resumeUrl?: string;
  appliedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    bio?: string;
    city?: string;
    country?: string;
    skills?: string[];
    interests?: string[];
    impaktrScore?: number;
    totalHoursVolunteered?: number;
    totalActivitiesCompleted?: number;
    recentBadges?: Array<{
      name: string;
      type: string;
      earnedAt: string;
    }>;
  };
}

export default function OrganizationOpportunitiesPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOpportunity, setIsCreatingOpportunity] = useState(false);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
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

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      redirect('/signin');
    }

    fetchOpportunities();
  }, [session, status]);

  const fetchOpportunities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/organization/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/organization/opportunities/${opportunityId}/applications`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleCreateOpportunity = async () => {
    if (!newOpportunity.title.trim() || !newOpportunity.description.trim()) return;

    try {
      setIsCreatingOpportunity(true);
      const response = await fetch('/api/organization/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOpportunity),
      });

      if (response.ok) {
        const data = await response.json();
        setOpportunities([data.opportunity, ...opportunities]);
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
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
    } finally {
      setIsCreatingOpportunity(false);
    }
  };

  const handleUpdateApplication = async (applicationId: string, status: string) => {
    try {
      const response = await fetch(`/api/organization/opportunities/${selectedOpportunity?.id}/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh applications
        if (selectedOpportunity) {
          await fetchApplications(selectedOpportunity.id);
        }
        // Refresh opportunities to update spots filled
        await fetchOpportunities();
      }
    } catch (error) {
      console.error('Error updating application:', error);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[10px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="pt-2 pb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Opportunities
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      Post volunteer opportunities and manage applications
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateOpportunity(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post Opportunity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="pt-3 pb-8">
          <div className="space-y-6">
            {/* Pill-like Navigation */}
            <div className="flex space-x-2">
              <Button
                variant={activeTab === 'opportunities' ? 'default' : 'outline'}
                onClick={() => setActiveTab('opportunities')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'opportunities' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Opportunities
              </Button>
              <Button
                variant={activeTab === 'applications' ? 'default' : 'outline'}
                onClick={() => setActiveTab('applications')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'applications' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Applications
              </Button>
            </div>

            {/* Opportunities Tab Content */}
            {activeTab === 'opportunities' && (
              <div className="space-y-6">
              {/* Create Opportunity Modal */}
              {showCreateOpportunity && (
                <Card>
                  <CardHeader>
                    <CardTitle>Post New Opportunity</CardTitle>
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
                        Requirements
                      </label>
                      <Input
                        placeholder="Add requirement (press Enter)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
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
                        disabled={isCreatingOpportunity || !newOpportunity.title.trim() || !newOpportunity.description.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {isCreatingOpportunity ? 'Posting...' : 'Post Opportunity'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Opportunities List */}
              <div className="space-y-4">
                {opportunities.map((opportunity) => (
                  <Card key={opportunity.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {opportunity.title}
                            </h3>
                            <Badge className={opportunity.status === 'OPEN' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                              {opportunity.status === 'OPEN' ? 'Open' : 'Closed'}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {opportunity.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{opportunity.spotsFilled}/{opportunity.spots} filled</span>
                            </div>
                            {opportunity.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{opportunity.location}</span>
                              </div>
                            )}
                            {opportunity.deadline && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                            {opportunity.isRemote && (
                              <Badge variant="outline">Remote</Badge>
                            )}
                          </div>

                          {opportunity.requirements.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements:</h4>
                              <div className="flex flex-wrap gap-1">
                                {opportunity.requirements.map((req, index) => (
                                  <Badge key={index} className={`text-xs ${getBadgeColor(req, 'requirement')}`}>
                                    {req}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {opportunity.skills.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills:</h4>
                              <div className="flex flex-wrap gap-1">
                                {opportunity.skills.map((skill, index) => (
                                  <Badge key={index} className={`text-xs ${getBadgeColor(skill, 'skill')}`}>
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">
                                {opportunity.stats.totalApplications} applications
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                Posted {new Date(opportunity.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => {
                                  setSelectedOpportunity(opportunity);
                                  fetchApplications(opportunity.id);
                                  setActiveTab('applications');
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Applications
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="px-3 py-2 hover:bg-transparent">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>
            )}

            {/* Applications Tab Content */}
            {activeTab === 'applications' && (
              <div className="space-y-6">
              {selectedOpportunity ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Applications for &quot;{selectedOpportunity.title}&quot;</CardTitle>
                    </CardHeader>
                  </Card>

                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12">
                              {application.user.image && (
                                <AvatarImage src={application.user.image} alt={application.user.name} />
                              )}
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold">
                                {application.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {application.user.name}
                                </h3>
                                <Badge className={getStatusColor(application.status)}>
                                  {getStatusIcon(application.status)}
                                  <span className="ml-1">{application.status}</span>
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {application.user.email}
                              </p>
                              
                              {application.user.city && application.user.country && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  {application.user.city}, {application.user.country}
                                </p>
                              )}
                              
                              {application.user.bio && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                  {application.user.bio}
                                </p>
                              )}

                              {/* Volunteer Stats */}
                              {(application.user.impaktrScore || application.user.totalHoursVolunteered || application.user.totalActivitiesCompleted) && (
                                <div className="grid grid-cols-3 gap-4 mb-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                                  {application.user.impaktrScore !== undefined && (
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Impaktr Score</p>
                                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{application.user.impaktrScore}</p>
                                    </div>
                                  )}
                                  {application.user.totalHoursVolunteered !== undefined && (
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
                                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{application.user.totalHoursVolunteered}</p>
                                    </div>
                                  )}
                                  {application.user.totalActivitiesCompleted !== undefined && (
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Activities</p>
                                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{application.user.totalActivitiesCompleted}</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Skills & Interests */}
                              {application.user.skills && application.user.skills.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {application.user.skills.map((skill, idx) => (
                                      <Badge key={idx} className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {application.user.interests && application.user.interests.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SDG Interests:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {application.user.interests.slice(0, 5).map((interest, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        SDG {interest}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Recent Badges */}
                              {application.user.recentBadges && application.user.recentBadges.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Badges:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {application.user.recentBadges.slice(0, 3).map((badge, idx) => (
                                      <Badge key={idx} className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs">
                                        {badge.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {application.message && (
                                <div className="mb-3">
                                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message:</h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                    {application.message}
                                  </p>
                                </div>
                              )}
                              
                              {application.resumeUrl && (
                                <div className="mb-3">
                                  <a 
                                    href={application.resumeUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                  >
                                    View Resume →
                                  </a>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                                </span>
                                
                                {application.status === 'PENDING' && (
                                  <div className="flex space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleUpdateApplication(application.id, 'REJECTED')}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleUpdateApplication(application.id, 'APPROVED')}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select an Opportunity
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose an opportunity from the Opportunities tab to view applications
                  </p>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
