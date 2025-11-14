'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search,
  MapPin,
  Clock,
  Users,
  Briefcase,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Globe,
  Building,
  GraduationCap,
  ChevronDown,
  Target,
  Microscope,
  Award,
  HeartHandshake,
  Heart,
  Laptop,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { LocationAutocomplete } from '@/components/ui/location-autocomplete';
import { getSDGById } from '@/constants/sdgs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';

// SDG Definitions (copied from events page)
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
    type: string;
  };
  stats: {
    totalApplications: number;
    spotsRemaining: number;
    appliedCount: number;
    acceptedCount: number;
    rejectedCount: number;
  };
  isBookmarked?: boolean;
  isApplied?: boolean;
}

function OpportunitiesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = searchParams.get('org');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('BOTH');
  const [sdgFilter, setSdgFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('recent');
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [bookmarkedOpportunities, setBookmarkedOpportunities] = useState<string[]>([]);
  const [appliedOpportunities, setAppliedOpportunities] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [statusSelectOpen, setStatusSelectOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  type AISuggestion = {
    id: string;
    title: string;
    description: string;
    organization?: Opportunity['organization'];
    location?: string | null;
    sdg?: string | null;
    skills?: string[];
    highlight?: string[];
    matchReason?: string | null;
    tags?: string[];
    isApplied?: boolean;
  };

  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAISuggestionsLoading, setIsAISuggestionsLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiInfo, setAiInfo] = useState<string | null>(null);
  const [aiInfoVariant, setAiInfoVariant] = useState<'default' | 'fallback'>('default');
  const [aiSuggestionsExpanded, setAiSuggestionsExpanded] = useState(true);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);
  const [appliedSuggestionIds, setAppliedSuggestionIds] = useState<string[]>([]);
  const [isBulkApplying, setIsBulkApplying] = useState(false);
  const [isBulkApplyMode, setIsBulkApplyMode] = useState(false);
  const [bulkApplyQueue, setBulkApplyQueue] = useState<string[]>([]);
  const isPromptReady = aiPrompt.trim().length > 0;
  const actionableSuggestionIds = aiSuggestions
    .filter((suggestion) => !appliedSuggestionIds.includes(suggestion.id))
    .map((suggestion) => suggestion.id);
  const selectedActionableIds = selectedSuggestionIds.filter((id) =>
    actionableSuggestionIds.includes(id)
  );
  const selectedActionableCount = selectedActionableIds.length;
  const allActionableSelected =
    actionableSuggestionIds.length > 0 &&
    selectedActionableCount === actionableSuggestionIds.length;
  
  // Application dialog state
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [applicationForm, setApplicationForm] = useState({
    agreeToShare: false,
    message: '',
    resumeFile: null as File | null,
    linkedinUrl: ''
  });
  const [isUploadingResume, setIsUploadingResume] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let response;
      if (activeTab === 'for-you') {
        // Fetch recommendations for "For You" tab
        response = await fetch('/api/recommendations?type=opportunities');
      } else {
        // Regular opportunities fetch
        const params = new URLSearchParams({
          status: statusFilter,
          search: searchTerm,
          location: locationFilter,
          sdg: sdgFilter.join(','),
          sort: sortBy,
        });
        
        if (orgId) {
          params.append('organizationId', orgId);
        }
        
        response = await fetch(`/api/opportunities?${params}`);
      }
      
      if (response.ok) {
        const data = await response.json();
        const oppData = activeTab === 'for-you' ? (data.recommendations || []) : (data.opportunities || []);
        setOpportunities(oppData);
        
        // Initialize bookmark and application states from API data
        const bookmarkedIds = oppData
          .filter((opp: Opportunity) => opp.isBookmarked)
          .map((opp: Opportunity) => opp.id);
        setBookmarkedOpportunities(bookmarkedIds);
        
        const appliedIds = oppData
          .filter((opp: Opportunity) => opp.isApplied)
          .map((opp: Opportunity) => opp.id);
        setAppliedOpportunities(appliedIds);
        
        // Extract organization name if filtering by organization
        if (orgId && oppData.length > 0 && oppData[0].organization) {
          setOrganizationName(oppData[0].organization.name);
        } else {
          setOrganizationName(null);
        }
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to fetch opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm, locationFilter, statusFilter, sdgFilter, sortBy, orgId]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  useEffect(() => {
    if (appliedOpportunities.length === 0) return;
    setAppliedSuggestionIds((prev) =>
      Array.from(new Set([...prev, ...appliedOpportunities]))
    );
  }, [appliedOpportunities]);

  const getOpportunityById = useCallback(
    async (opportunityId: string): Promise<Opportunity | null> => {
      const existing = opportunities.find((opp) => opp.id === opportunityId);
      if (existing) {
        return existing;
      }

      try {
        const response = await fetch(`/api/opportunities/${opportunityId}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Unable to fetch opportunity ${opportunityId}`);
        }

        const data = await response.json();
        return data as Opportunity;
      } catch (error) {
        console.error('Failed to load opportunity for application:', error);
        toast.error('Unable to load opportunity details. Please try again.');
        return null;
      }
    },
    [opportunities]
  );

  // Debug: Watch dialog state changes
  useEffect(() => {
    console.log('showApplicationDialog changed to:', showApplicationDialog);
    console.log('selectedOpportunity:', selectedOpportunity);
  }, [showApplicationDialog, selectedOpportunity]);

  // Reset organization name when orgId changes
  useEffect(() => {
    if (!orgId) {
      setOrganizationName(null);
    }
  }, [orgId]);

  const handleApply = async (opportunityId: string) => {
    if (!session) {
      toast.error('Please sign in to apply');
      return;
    }

    if (
      appliedOpportunities.includes(opportunityId) ||
      appliedSuggestionIds.includes(opportunityId)
    ) {
      toast.error('You have already applied to this opportunity.');
      return;
    }

    const opportunity = await getOpportunityById(opportunityId);
    if (!opportunity) {
      return;
    }

    if (opportunity.isApplied) {
      toast.error('You have already applied to this opportunity.');
      return;
    }

    setSelectedOpportunity(opportunity);
    setShowApplicationDialog(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedOpportunity || !session) return;

    if (!applicationForm.agreeToShare) {
      toast.error('Please agree to share your profile to continue');
      return;
    }

    try {
      setIsApplying(selectedOpportunity.id);

      let resumeUrl = '';
      if (applicationForm.resumeFile) {
        setIsUploadingResume(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', applicationForm.resumeFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json().catch(() => null);
          throw new Error(uploadError?.error || 'Failed to upload resume');
        }

        const uploadData = await uploadResponse.json();
        resumeUrl = uploadData.url || '';
        setIsUploadingResume(false);
      }

      const trimmedMessage = applicationForm.message.trim();
      const hasMessage = trimmedMessage.length > 0;
      const hasLinkedIn = applicationForm.linkedinUrl.trim().length > 0;
      const combinedMessage = (() => {
        if (hasMessage && hasLinkedIn) {
          return `${trimmedMessage}\n\nLinkedIn: ${applicationForm.linkedinUrl.trim()}`;
        }
        if (hasMessage) {
          return trimmedMessage;
        }
        if (hasLinkedIn) {
          return `LinkedIn: ${applicationForm.linkedinUrl.trim()}`;
        }
        return '';
      })();

      const response = await fetch(`/api/opportunities/${selectedOpportunity.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: combinedMessage || undefined,
          resumeUrl: resumeUrl || undefined,
        }),
      });

      if (response.ok) {
        const opportunityId = selectedOpportunity.id;
        const hasRemainingBulkTargets = isBulkApplyMode && bulkApplyQueue.length > 0;

        toast.success(
          hasRemainingBulkTargets
            ? 'Application submitted! Review the next opportunity.'
            : 'Application submitted successfully!'
        );

        setAppliedOpportunities(prev => [...prev, opportunityId]);
        setAppliedSuggestionIds((prev) => Array.from(new Set([...prev, opportunityId])));
        setSelectedSuggestionIds((prev) => prev.filter((id) => id !== opportunityId));

        if (isBulkApplyMode) {
          let remainingQueue = [...bulkApplyQueue];
          let nextOpportunity: Opportunity | null = null;

          while (remainingQueue.length > 0 && !nextOpportunity) {
            const nextId = remainingQueue[0];
            const loadedOpportunity = await getOpportunityById(nextId);
            if (loadedOpportunity) {
              nextOpportunity = loadedOpportunity;
              remainingQueue = remainingQueue.slice(1);
            } else {
              remainingQueue = remainingQueue.slice(1);
              setSelectedSuggestionIds((prev) => prev.filter((id) => id !== nextId));
            }
          }

          if (nextOpportunity) {
            setBulkApplyQueue(remainingQueue);
            setSelectedOpportunity(nextOpportunity);
            return;
          }

          setIsBulkApplyMode(false);
          setBulkApplyQueue([]);
          handleCloseDialog();
          fetchOpportunities();
        } else {
          handleCloseDialog();
          fetchOpportunities();
        }
      } else {
        const error = await response.json().catch(() => null);
        toast.error(error?.error || 'Failed to apply');
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to apply to opportunity');
    } finally {
      setIsApplying(null);
      setIsUploadingResume(false);
    }
  };

  const handleCloseDialog = () => {
    setShowApplicationDialog(false);
    setSelectedOpportunity(null);
    setIsUploadingResume(false);
    setIsBulkApplyMode(false);
    setBulkApplyQueue([]);
    setIsBulkApplying(false);
    setApplicationForm({
      agreeToShare: false,
      message: '',
      resumeFile: null,
      linkedinUrl: ''
    });
  };

  const handleBookmark = async (opportunityId: string) => {
    console.log('handleBookmark called with:', opportunityId);
    console.log('session:', session);
    
    if (!session) {
      toast.error('Please sign in to bookmark opportunities');
      return;
    }

    try {
      const isBookmarked = bookmarkedOpportunities.includes(opportunityId);
      console.log('isBookmarked:', isBookmarked);
      console.log('bookmarkedOpportunities:', bookmarkedOpportunities);
      
      const response = await fetch(`/api/opportunities/${opportunityId}/bookmark`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        if (isBookmarked) {
          setBookmarkedOpportunities(prev => prev.filter(id => id !== opportunityId));
          toast.success('Removed from bookmarks');
        } else {
          setBookmarkedOpportunities(prev => [...prev, opportunityId]);
          toast.success('Added to bookmarks');
        }
      } else {
        toast.error(responseData.error || 'Failed to update bookmark');
      }
    } catch (error) {
      console.error('Error bookmarking:', error);
      toast.error('Failed to bookmark opportunity');
    }
  };

  const handleShare = async (opportunityId: string) => {
    try {
      const opportunity = opportunities.find(opp => opp.id === opportunityId);
      const shareUrl = `${window.location.origin}/opportunities/${opportunityId}`;
      const shareTitle = opportunity?.title || 'Check out this opportunity';
      const shareText = opportunity?.description 
        ? `${shareTitle}\n\n${opportunity.description.substring(0, 150)}...` 
        : shareTitle;

      // Try Web Share API first (mobile/native sharing)
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          toast.success('Shared successfully!');
          return;
        } catch (err: any) {
          // User cancelled or error occurred, fall back to clipboard
          if (err.name !== 'AbortError') {
            console.error('Error sharing:', err);
          }
        }
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share opportunity');
    }
  };


  const toggleSDG = (sdgNumber: number) => {
    const currentSDGs = sdgFilter.map(s => parseInt(s));
    const newSDGs = currentSDGs.includes(sdgNumber)
      ? currentSDGs.filter(sdg => sdg !== sdgNumber)
      : [...currentSDGs, sdgNumber];
    
    setSdgFilter(newSDGs.map(s => s.toString()));
  };

  const removeSDG = (sdgNumber: number) => {
    const newSDGs = sdgFilter.filter(s => parseInt(s) !== sdgNumber);
    setSdgFilter(newSDGs);
  };

  const clearAllSDGs = () => {
    setSdgFilter([]);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setStatusFilter('BOTH');
    setSdgFilter([]);
    setSortBy('recent');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || 
                          locationFilter !== '' || 
                          statusFilter !== 'BOTH' || 
                          sdgFilter.length > 0 || 
                          sortBy !== 'recent';

  const handleFetchAISuggestions = async () => {
    const prompt = aiPrompt.trim();

    if (!prompt) {
      toast.error('Tell the assistant what you are looking for first.');
      return;
    }

    try {
      setIsAISuggestionsLoading(true);
      setAiError(null);
      setAiInfo(null);
      setAiInfoVariant('default');

      const response = await fetch('/api/opportunities/ai-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          filters: {
            sdg: sdgFilter,
            location: locationFilter,
            status: statusFilter,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Unexpected status ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data.suggestions)) {
        throw new Error('Malformed response from assistant API');
      }

      const summary =
        typeof data.summary === 'string' && data.summary.trim().length > 0
          ? data.summary.trim()
          : null;
      let infoMessage: string | null = null;

      if (data.reason === 'error') {
        setAiSuggestions([]);
        setSelectedSuggestionIds([]);
        setAppliedSuggestionIds(appliedOpportunities);
        setAiError('We had trouble generating suggestions. Please try again.');
        setAiInfoVariant('default');
        return;
      }

      let infoVariant: 'default' | 'fallback' = 'default';
      if (data.reason === 'fallback_prompt') {
        infoMessage = 'We need more detail to tailor results. Showing fresh opportunities instead.';
        infoVariant = 'fallback';
      } else if (data.reason === 'fallback_nomatch') {
        infoMessage = 'No direct matches found, so here are fresh openings you might like.';
        infoVariant = 'fallback';
      } else if (data.reason === 'success') {
        infoMessage = 'Suggestions based on your keywords, skills, and SDG filters.';
      }

      if (summary) {
        infoMessage = infoMessage ? `${infoMessage} — ${summary}` : summary;
      }

      setAiInfo(infoMessage);
      setAiInfoVariant(infoVariant);

      if (data.suggestions.length === 0) {
        setAiSuggestions([]);
        setSelectedSuggestionIds([]);
        setAppliedSuggestionIds(appliedOpportunities);
        setAiError('No opportunities available right now. Please check back later.');
        setAiInfoVariant('fallback');
        return;
      }

      setAiSuggestions(data.suggestions);

      const appliedFromSuggestions = data.suggestions
        .filter((suggestion: AISuggestion) => suggestion.isApplied)
        .map((suggestion: AISuggestion) => suggestion.id);

      const combinedAppliedSet = new Set([
        ...appliedOpportunities,
        ...appliedFromSuggestions,
      ]);

      setAppliedSuggestionIds((prev) =>
        Array.from(new Set([...prev, ...combinedAppliedSet]))
      );

      setSelectedSuggestionIds(
        data.suggestions
          .filter((suggestion: AISuggestion) => !combinedAppliedSet.has(suggestion.id))
          .map((suggestion: AISuggestion) => suggestion.id)
      );
      setAiSuggestionsExpanded(true);
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiError('We had trouble generating suggestions. Please try again.');
      setAiSuggestions([]);
      setSelectedSuggestionIds([]);
      setAppliedSuggestionIds(appliedOpportunities);
      setAiInfo(null);
      setAiInfoVariant('default');
    } finally {
      setIsAISuggestionsLoading(false);
    }
  };

  const handleToggleSuggestionSelection = (suggestionId: string) => {
    setSelectedSuggestionIds((prev) =>
      prev.includes(suggestionId)
        ? prev.filter((id) => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const handleToggleSelectAllSuggestions = () => {
    const actionableIds = aiSuggestions
      .filter((suggestion) => !appliedSuggestionIds.includes(suggestion.id))
      .map((suggestion) => suggestion.id);

    const allSelected = actionableIds.length > 0 && actionableIds.every((id) => selectedSuggestionIds.includes(id));

    if (allSelected) {
      setSelectedSuggestionIds((prev) => prev.filter((id) => !actionableIds.includes(id)));
    } else {
      setSelectedSuggestionIds((prev) => Array.from(new Set([...prev, ...actionableIds])));
    }
  };

  const handleBulkApplySuggestions = async () => {
    if (!session) {
      toast.error('Please sign in to apply.');
      router.push('/signin');
      return;
    }

    const actionableSuggestions = aiSuggestions.filter(
      (suggestion) =>
        selectedSuggestionIds.includes(suggestion.id) &&
        !appliedSuggestionIds.includes(suggestion.id)
    );

    if (actionableSuggestions.length === 0) {
      toast.error('Select at least one suggestion to apply.');
      return;
    }

    setIsBulkApplying(true);

    const [firstSuggestion, ...remainingSuggestions] = actionableSuggestions;
    const initialOpportunity = await getOpportunityById(firstSuggestion.id);

    if (!initialOpportunity) {
      setIsBulkApplying(false);
      return;
    }

    if (
      applicationForm.message.trim().length === 0 &&
      firstSuggestion.matchReason &&
      firstSuggestion.matchReason.length > 0
    ) {
      const assistantNote = `AI Assistant note: ${firstSuggestion.matchReason}`;
      const trimmedNote = assistantNote.length > 500 ? `${assistantNote.slice(0, 497)}...` : assistantNote;
      setApplicationForm((prev) => ({
        ...prev,
        message: trimmedNote,
      }));
    }

    setIsBulkApplyMode(true);
    setBulkApplyQueue(remainingSuggestions.map((suggestion) => suggestion.id));
    setSelectedOpportunity(initialOpportunity);
    setShowApplicationDialog(true);
    setIsBulkApplying(false);
  };

  const getFilteredOpportunities = () => {
    let filtered = opportunities;
    
    // Apply tab filtering
    switch (activeTab) {
      case 'for-you':
        // Already filtered from API, just return all
        break;
      case 'bookmarked':
        filtered = filtered.filter(opp => bookmarkedOpportunities.includes(opp.id));
        break;
      case 'applied':
        filtered = filtered.filter(opp => appliedOpportunities.includes(opp.id));
        break;
      case 'research-lab':
        // Filter for research and lab opportunities
        filtered = filtered.filter(opp => 
          opp.title.toLowerCase().includes('research') || 
          opp.title.toLowerCase().includes('lab') ||
          opp.title.toLowerCase().includes('assistant') ||
          opp.description.toLowerCase().includes('research') ||
          opp.description.toLowerCase().includes('laboratory') ||
          opp.description.toLowerCase().includes('experiment')
        );
        break;
      case 'scholarship':
        // Filter for scholarship opportunities
        filtered = filtered.filter(opp => 
          opp.title.toLowerCase().includes('scholarship') ||
          opp.title.toLowerCase().includes('grant') ||
          opp.title.toLowerCase().includes('fellowship') ||
          opp.description.toLowerCase().includes('scholarship') ||
          opp.description.toLowerCase().includes('financial aid') ||
          opp.description.toLowerCase().includes('tuition')
        );
        break;
      case 'sponsorship':
        // Filter for sponsorship opportunities
        filtered = filtered.filter(opp => 
          opp.title.toLowerCase().includes('sponsorship') ||
          opp.title.toLowerCase().includes('sponsor') ||
          opp.description.toLowerCase().includes('sponsorship') ||
          opp.description.toLowerCase().includes('sponsor')
        );
        break;
      case 'donation':
        // Filter for donation opportunities
        filtered = filtered.filter(opp => 
          opp.title.toLowerCase().includes('donation') ||
          opp.title.toLowerCase().includes('fundrais') ||
          opp.title.toLowerCase().includes('contribute') ||
          opp.description.toLowerCase().includes('donation') ||
          opp.description.toLowerCase().includes('fundraising') ||
          opp.description.toLowerCase().includes('charitable')
        );
        break;
      case 'internship':
        // Filter for internship opportunities
        filtered = filtered.filter(opp => 
          opp.title.toLowerCase().includes('intern') ||
          opp.title.toLowerCase().includes('trainee') ||
          opp.title.toLowerCase().includes('apprentice') ||
          opp.description.toLowerCase().includes('internship') ||
          opp.description.toLowerCase().includes('intern position') ||
          opp.description.toLowerCase().includes('training program')
        );
        break;
      default:
        // 'all' tab - no additional filtering
        break;
    }
    
    return filtered;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading opportunities..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <Card className="hover:shadow-lg transition-shadow mb-8 bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                  Opportunities
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                  Find meaningful opportunities to make an impact. Apply to positions that match your skills and interests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs - Inverted Triangle Layout */}
        <div className="mb-8" style={{ display: 'flex', flexDirection: 'column', gap: '1cm' }}>
          {/* First Row - Category Buttons (6 buttons spanning full width) */}
          <div className="flex flex-wrap justify-between gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 min-w-[150px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All Opportunities
            </button>
            <button
              onClick={() => setActiveTab('research-lab')}
              className={`flex-1 min-w-[150px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'research-lab'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Microscope className="w-4 h-4 inline-block mr-2" />
              Research & Lab
            </button>
            <button
              onClick={() => setActiveTab('scholarship')}
              className={`flex-1 min-w-[150px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'scholarship'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Award className="w-4 h-4 inline-block mr-2" />
              Scholarship
            </button>
            <button
              onClick={() => setActiveTab('sponsorship')}
              className={`flex-1 min-w-[150px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'sponsorship'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <HeartHandshake className="w-4 h-4 inline-block mr-2" />
              Sponsorship
            </button>
            <button
              onClick={() => setActiveTab('donation')}
              className={`flex-1 min-w-[150px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'donation'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Heart className="w-4 h-4 inline-block mr-2" />
              Donation
            </button>
            <button
              onClick={() => setActiveTab('internship')}
              className={`flex-1 min-w-[150px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'internship'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Laptop className="w-4 h-4 inline-block mr-2" />
              Internship
            </button>
          </div>
          
          {/* Second Row - Filter Buttons (3 buttons spanning full width) */}
          <div className="flex flex-wrap justify-between gap-2 px-12">
            <button
              onClick={() => setActiveTab('for-you')}
              className={`flex-1 min-w-[180px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'for-you'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Target className="w-4 h-4 inline-block mr-2" />
              For You
            </button>
            <button
              onClick={() => setActiveTab('bookmarked')}
              className={`flex-1 min-w-[180px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'bookmarked'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Bookmarked ({bookmarkedOpportunities.length})
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`flex-1 min-w-[180px] px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'applied'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Applied ({appliedOpportunities.length})
            </button>
          </div>
        </div>
        <div className="mt-6 space-y-6">
          {activeTab !== 'bookmarked' && activeTab !== 'applied' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Smart Opportunity Assistant
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Describe what you’re looking for and we’ll highlight opportunities that fit. We consider your profile, filters, and goals.
              </p>
            </div>
            <Textarea
              placeholder="e.g. Remote design internships focused on social impact"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(event) => {
                const isSubmitCombo = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
                if (isSubmitCombo && isPromptReady && !isAISuggestionsLoading) {
                  event.preventDefault();
                  void handleFetchAISuggestions();
                }
              }}
              rows={3}
              maxLength={200}
            />
            {isPromptReady && (
              <div className="flex items-center justify-start gap-3">
                <Button
                  onClick={handleFetchAISuggestions}
                  disabled={isAISuggestionsLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {isAISuggestionsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Thinking...
                    </>
                  ) : (
                    'Get Smart Suggestions'
                  )}
                </Button>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Press <kbd className="px-1 py-0.5 border rounded">Ctrl</kbd>/<kbd className="px-1 py-0.5 border rounded">⌘</kbd> + <kbd className="px-1 py-0.5 border rounded">Enter</kbd>
                </span>
              </div>
            )}
            {aiError && (
              <p className="text-xs text-red-500 dark:text-red-400">{aiError}</p>
            )}
            {aiInfo && !aiError && (
              aiInfoVariant === 'fallback' ? (
                <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/40 dark:text-amber-100" role="status">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="font-medium leading-relaxed">{aiInfo}</span>
                </div>
              ) : (
                <p className="text-xs text-blue-600 dark:text-blue-300">{aiInfo}</p>
              )
            )}
            {aiSuggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Suggested for you
                    </span>
                    <Badge variant="secondary">{aiSuggestions.length}</Badge>
                    {selectedActionableCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {selectedActionableCount} selected
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAiSuggestionsExpanded((prev) => !prev)}
                    >
                      {aiSuggestionsExpanded ? 'Collapse suggestions' : 'Expand suggestions'}
                    </Button>
                    <Button
                      onClick={handleBulkApplySuggestions}
                      disabled={selectedActionableCount === 0 || isBulkApplying || showApplicationDialog}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {isBulkApplying ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        `Apply to Selected (${selectedActionableCount})`
                      )}
                    </Button>
                  </div>
                </div>
                {aiSuggestionsExpanded && (
                  <>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allActionableSelected}
                          onChange={handleToggleSelectAllSuggestions}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {allActionableSelected ? 'Unselect all' : 'Select all'}
                      </label>
                      {appliedSuggestionIds.length > 0 && (
                        <span className="text-[11px] uppercase tracking-wide text-green-600 dark:text-green-300">
                          {appliedSuggestionIds.length} applied
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion) => {
                        const isApplied = appliedSuggestionIds.includes(suggestion.id);
                        const isSelected = selectedSuggestionIds.includes(suggestion.id);
                        return (
                          <div
                            key={suggestion.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-500 transition-colors"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isApplied || isBulkApplying}
                                  onChange={() => handleToggleSuggestionSelection(suggestion.id)}
                                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                  aria-label={`Select ${suggestion.title}`}
                                />
                                <div>
                                  <Link
                                    href={`/opportunities/${suggestion.id}`}
                                    className="text-sm font-semibold text-gray-900 dark:text-white hover:underline"
                                  >
                                    {suggestion.title}
                                  </Link>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {suggestion.organization?.name ?? 'Opportunity'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isApplied && (
                                  <Badge variant="secondary" className="text-xs">
                                    Applied
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {suggestion.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3 mt-2">
                                {suggestion.description}
                              </p>
                            )}
                            {suggestion.matchReason && (
                              <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
                                {suggestion.matchReason}
                              </p>
                            )}
                            {suggestion.highlight && suggestion.highlight.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {suggestion.highlight.map((token) => (
                                  <span
                                    key={`${suggestion.id}-${token}`}
                                    className="text-[10px] uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-1 rounded-full"
                                  >
                                    {token}
                                  </span>
                                ))}
                              </div>
                            )}
                            {suggestion.skills && suggestion.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {suggestion.skills.slice(0, 4).map((skill, idx) => (
                                  <span
                                    key={`${suggestion.id}-skill-${idx}`}
                                    className="text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-2 py-1 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                            {suggestion.tags && suggestion.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {suggestion.tags.slice(0, 4).map((tag, idx) => (
                                  <span
                                    key={`${suggestion.id}-tag-${idx}`}
                                    className="text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200 px-2 py-1 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          )}
        </div>
        <div className="mt-6 lg:grid lg:grid-cols-4 lg:gap-6">
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 lg:sticky lg:top-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      placeholder="Search opportunities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                <LocationAutocomplete
                  value={locationFilter}
                  onChange={setLocationFilter}
                  placeholder="Search location (e.g., California, United States)"
                  className="h-12"
                  open={locationDropdownOpen}
                  onOpenChange={(open) => {
                    setLocationDropdownOpen(open);
                    // Close other dropdowns when location dropdown opens
                    if (open) {
                      setShowAdvancedFilters(false);
                      setStatusSelectOpen(false);
                    }
                  }}
                />
                <Select 
                  value={statusFilter} 
                  open={statusSelectOpen}
                  onOpenChange={(open) => {
                    setStatusSelectOpen(open);
                    // Close location dropdown when Select opens
                    if (open) {
                      setLocationDropdownOpen(false);
                      setShowAdvancedFilters(false);
                    }
                  }}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    // Close Select after selection
                    setStatusSelectOpen(false);
                  }}
                >
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">Both (Open & Closed)</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                    <SelectItem value="FILLED">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const willOpen = !showAdvancedFilters;
                    setShowAdvancedFilters(willOpen);
                    // Close other dropdowns when advanced filters open
                    if (willOpen) {
                      setLocationDropdownOpen(false);
                      setStatusSelectOpen(false);
                    }
                  }}
                  className="w-full justify-between bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    <span>Advanced Filters</span>
                    {(sdgFilter && sdgFilter.length > 0) && (
                      <Badge variant="secondary" className="ml-2 text-xs px-3 py-1">
                        {sdgFilter.length} SDG{sdgFilter.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </Button>

                {showAdvancedFilters && (
                  <div className="mt-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Filter by SDG Categories
                        </label>
                        {(sdgFilter && sdgFilter.length > 0) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllSDGs}
                            className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>

                      {sdgFilter && sdgFilter.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex flex-wrap gap-2">
                            {sdgFilter.map(sdgString => {
                              const sdgNumber = parseInt(sdgString);
                              const sdgInfo = SDG_DEFINITIONS[sdgNumber as keyof typeof SDG_DEFINITIONS];
                              return (
                                <div
                                  key={sdgNumber}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${sdgInfo?.color || 'bg-gray-100 text-gray-800'}`}
                                >
                                  <span className="mr-2">SDG {sdgNumber}</span>
                                  <button
                                    onClick={() => removeSDG(sdgNumber)}
                                    className="ml-1 hover:bg-black/10 rounded-full w-4 h-4 flex items-center justify-center"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="max-h-[400px] overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(SDG_DEFINITIONS).map(([number, info]) => {
                            const sdgNumber = parseInt(number);
                            const isSelected = sdgFilter.includes(sdgNumber.toString());
                            return (
                              <button
                                key={sdgNumber}
                                onClick={() => toggleSDG(sdgNumber)}
                                className={`h-20 p-3 rounded-lg border-2 transition-all text-xs font-medium flex flex-col items-center justify-center ${
                                  isSelected
                                    ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                                    : 'border-gray-200 dark:border-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent'
                                }`}
                              >
                                <div className="text-center w-full">
                                  <div className="font-bold mb-1">SDG {sdgNumber}</div>
                                  <div className="text-xs leading-tight line-clamp-2">{info.name}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="deadline">Deadline Soon</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={fetchOpportunities}
                    className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 text-blue-700 dark:text-blue-300"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700 text-red-700 dark:text-red-300"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3">

            {organizationName && (
              <Card className="hover:shadow-lg transition-shadow mb-6 bg-white dark:bg-gray-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getFilteredOpportunities().length} opportunities from <Link href={`/organizations/${orgId}`} className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-purple-700 transition-all duration-200">{organizationName}</Link>
                    </h2>
                    <Link href="/opportunities">
                      <Button variant="outline" size="sm">
                        Clear Filter
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6 mt-8 lg:mt-0 min-h-[60vh]">
              {getFilteredOpportunities().length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {activeTab === 'bookmarked' 
                      ? 'No bookmarked opportunities'
                      : activeTab === 'applied'
                      ? 'No applied opportunities'
                      : activeTab === 'for-you'
                      ? 'No recommendations yet'
                      : activeTab === 'research-lab'
                      ? 'No research & lab opportunities found'
                      : activeTab === 'scholarship'
                      ? 'No scholarship opportunities found'
                      : activeTab === 'sponsorship'
                      ? 'No sponsorship opportunities found'
                      : activeTab === 'donation'
                      ? 'No donation opportunities found'
                      : activeTab === 'internship'
                      ? 'No internship opportunities found'
                      : 'No opportunities found'
                    }
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'bookmarked'
                      ? 'Bookmark opportunities you\'re interested in to see them here.'
                      : activeTab === 'applied'
                      ? 'Apply to opportunities to track your applications here.'
                      : activeTab === 'for-you'
                      ? 'Complete your profile and engage with opportunities to get personalized recommendations.'
                      : activeTab === 'research-lab'
                      ? 'No research or laboratory opportunities are currently available. Check back later for new postings.'
                      : activeTab === 'scholarship'
                      ? 'No scholarship opportunities are currently available. Check back later for new postings.'
                      : activeTab === 'sponsorship'
                      ? 'No sponsorship opportunities are currently available. Check back later for new postings.'
                      : activeTab === 'donation'
                      ? 'No donation opportunities are currently available. Check back later for new postings.'
                      : activeTab === 'internship'
                      ? 'No internship opportunities are currently available. Check back later for new postings.'
                      : 'Try adjusting your search criteria or check back later for new opportunities.'
                    }
                  </p>
                </div>
              ) : (
                getFilteredOpportunities().map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    isBookmarked={bookmarkedOpportunities.includes(opportunity.id)}
                    isApplied={appliedOpportunities.includes(opportunity.id)}
                    isApplying={isApplying === opportunity.id}
                    onBookmark={handleBookmark}
                    onApply={handleApply}
                    onShare={handleShare}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Application Dialog - Custom Modal */}
        {showApplicationDialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={handleCloseDialog}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6 z-10">
              {/* Close Button */}
              <button
                onClick={handleCloseDialog}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XCircle className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Apply for {selectedOpportunity?.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete your application to {selectedOpportunity?.organization.name}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Cover Message <span className="text-gray-500">(Optional)</span>
                  </label>
                  <Textarea
                    placeholder="Share why you're interested and what you can bring to this opportunity..."
                    value={applicationForm.message}
                    onChange={(e) =>
                      setApplicationForm(prev => ({ ...prev, message: e.target.value }))
                    }
                    rows={5}
                    maxLength={500}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {applicationForm.message.length}/500 characters
                  </p>
                </div>
                {/* LinkedIn URL */}
                <div className="space-y-2">
                  <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    LinkedIn Profile <span className="text-gray-500">(Optional)</span>
                  </label>
                  <Input
                    id="linkedinUrl"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={applicationForm.linkedinUrl}
                    onChange={(e) =>
                      setApplicationForm(prev => ({ ...prev, linkedinUrl: e.target.value }))
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Share your LinkedIn profile for additional context.
                  </p>
                </div>

                {/* Resume Upload */}
                <div className="space-y-2">
                  <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Resume <span className="text-gray-500">(Optional)</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setApplicationForm(prev => ({ ...prev, resumeFile: file }));
                      }}
                      className="cursor-pointer flex-1"
                    />
                    {applicationForm.resumeFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setApplicationForm(prev => ({ ...prev, resumeFile: null }))}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                  {applicationForm.resumeFile && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Selected: {applicationForm.resumeFile.name}
                    </p>
                  )}
                </div>

                {/* Profile Sharing Agreement */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="agreeToShare"
                      checked={applicationForm.agreeToShare}
                      onChange={(e) =>
                        setApplicationForm(prev => ({ ...prev, agreeToShare: e.target.checked }))
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="agreeToShare"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        I agree to share my profile information with {selectedOpportunity?.organization.name}
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        This includes your name, email, bio, skills, and any information you provide above.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isApplying === selectedOpportunity?.id}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitApplication}
                  disabled={
                    !applicationForm.agreeToShare ||
                    isApplying === selectedOpportunity?.id ||
                    isUploadingResume
                  }
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {isApplying === selectedOpportunity?.id || isUploadingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
      </div>
    </div>
  );
}

function OpportunitiesPageWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OpportunitiesPage />
    </Suspense>
  );
}

export default OpportunitiesPageWithSuspense;