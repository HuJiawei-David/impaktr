'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Settings, 
  Users, 
  Shield, 
  Globe,
  Lock,
  ArrowLeft,
  Save,
  MoreHorizontal,
  Crown,
  UserX,
  Trash2,
  Star,
  MessageCircle,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { countries } from '@/constants/countries';
import { languages } from '@/constants/languages';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'react-hot-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

interface CommunityData {
  id: string;
  name: string;
  description: string;
  category: string;
  privacy: string;
  country?: string;
  city?: string;
  state?: string;
  language?: string;
  tags: string[];
  rules: string[];
  whoShouldJoin?: string;
  whatWeDo?: string;
  userRole: string | null;
  locationData?: {
    country?: string;
    city?: string;
    state?: string;
  };
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    impactScore: number;
    tier: string | null;
  };
}

export default function CommunitySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const communityId = params.id as string;
  
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [initialData, setInitialData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Check for tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'members', 'privacy', 'danger'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [membersTab, setMembersTab] = useState<'members' | 'admins'>('members');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }

    fetchCommunityData();
  }, [session, status, router, communityId]);

  useEffect(() => {
    if (activeTab === 'members' && communityData) {
      fetchMembers();
    }
  }, [activeTab, communityData]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/communities/${communityId}`);
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch community data');
      }

      const data = await response.json();
      const community = data.community;
      
      // Check if user has permission (OWNER or ADMIN)
      if (!community.userRole || !['OWNER', 'ADMIN'].includes(community.userRole)) {
        router.push(`/community/${communityId}`);
        return;
      }

      // Parse locationData if it exists
      const locationData = community.locationData as any;
      const country = locationData?.country || '';
      const city = locationData?.city || '';
      const state = locationData?.state || '';

      const formData = {
        id: community.id,
        name: community.name,
        description: community.description,
        category: community.category,
        privacy: community.privacy,
        country,
        city,
        state,
        language: community.language,
        tags: community.tags || [],
        rules: community.rules || [],
        whoShouldJoin: community.whoShouldJoin,
        whatWeDo: community.whatWeDo,
        userRole: community.userRole,
        locationData,
      };
      setCommunityData(formData);
      setInitialData(JSON.parse(JSON.stringify(formData))); // Deep copy for comparison
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching community data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch(`/api/communities/${communityId}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!communityData) return;
    
    try {
      const response = await fetch(`/api/communities/${communityId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      toast.success(`Member role updated to ${newRole}`);
      await fetchMembers();
      await fetchCommunityData(); // Refresh to update userRole if it changed
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  const handleRemoveMember = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this community?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/members?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove member');
      }

      toast.success('Member removed successfully');
      await fetchMembers();
    } catch (err) {
      console.error('Error removing member:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const handleTransferOwnership = async (newOwnerId: string, newOwnerName: string) => {
    if (!confirm(`Are you sure you want to transfer ownership to ${newOwnerName}? You will become an admin.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer ownership');
      }

      toast.success('Ownership transferred successfully');
      await fetchCommunityData();
      await fetchMembers();
    } catch (err) {
      console.error('Error transferring ownership:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to transfer ownership');
    }
  };

  // Check if form has unsaved changes
  const isDirty = useMemo(() => {
    if (!communityData || !initialData) return false;
    
    // Compare all editable fields
    return (
      communityData.name !== initialData.name ||
      communityData.description !== initialData.description ||
      communityData.category !== initialData.category ||
      communityData.privacy !== initialData.privacy ||
      communityData.country !== initialData.country ||
      communityData.city !== initialData.city ||
      communityData.state !== initialData.state ||
      communityData.language !== initialData.language ||
      JSON.stringify(communityData.tags) !== JSON.stringify(initialData.tags) ||
      JSON.stringify(communityData.rules) !== JSON.stringify(initialData.rules) ||
      (communityData.whoShouldJoin?.trim() || '') !== (initialData.whoShouldJoin?.trim() || '') ||
      (communityData.whatWeDo?.trim() || '') !== (initialData.whatWeDo?.trim() || '')
    );
  }, [communityData, initialData]);

  const handleSave = async () => {
    if (!communityData) return;

    try {
      setSaving(true);
      setError(null);

      // Build location string and locationData
      const locationParts = [communityData.city, communityData.state, communityData.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : '';
      const locationData = {
        country: communityData.country || null,
        city: communityData.city || null,
        state: communityData.state || null,
      };

      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: communityData.name,
          description: communityData.description,
          category: communityData.category,
          privacy: communityData.privacy,
          location,
          locationData,
          language: communityData.language || null,
          tags: communityData.tags,
          rules: communityData.rules,
          whoShouldJoin: communityData.whoShouldJoin?.trim() || null,
          whatWeDo: communityData.whatWeDo?.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Update error:', errorData);
        throw new Error(errorData.error || errorData.message || 'Failed to update community');
      }

      // Show success toast
      toast.success('Community settings saved successfully');
      
      // Refresh data to update initial state
      await fetchCommunityData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating community:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCommunity = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/communities/${communityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete community');
      }

      toast.success('Community deleted successfully');
      router.push('/community');
    } catch (err) {
      console.error('Error deleting community:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete community');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !communityData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push(`/community/${communityId}`)} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!communityData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push(`/community/${communityId}`)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Community
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Community Settings</h1>
              <p className="text-muted-foreground">
                Manage your community's settings and preferences
              </p>
            </div>
          </div>
          {communityData.userRole === 'OWNER' && (
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-md">
              <Star className="w-4 h-4 mr-1.5 fill-current" />
              Owner
            </Badge>
          )}
          {communityData.userRole === 'ADMIN' && (
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-md">
              Admin
            </Badge>
          )}
        </div>

        {/* Settings Navigation */}
        <div className="space-y-6">
          {/* Pill-like Navigation */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('profile')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Profile
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
              <Users className="w-4 h-4 mr-2" />
              Members
            </Button>
            <Button
              variant={activeTab === 'privacy' ? 'default' : 'outline'}
              onClick={() => setActiveTab('privacy')}
              className={`rounded-full px-6 py-2 ${
                activeTab === 'privacy' 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </Button>
            {communityData?.userRole === 'OWNER' && (
              <Button
                variant={activeTab === 'danger' ? 'default' : 'outline'}
                onClick={() => setActiveTab('danger')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'danger' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-red-200 dark:border-red-800'
                }`}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Delete Group
              </Button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-6 h-6 mr-2" />
                    Community Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Community Name *</Label>
                    <Input
                      id="name"
                      value={communityData.name}
                      onChange={(e) => setCommunityData({ ...communityData, name: e.target.value })}
                      placeholder="Enter community name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={communityData.description}
                      onChange={(e) => setCommunityData({ ...communityData, description: e.target.value })}
                      placeholder="Describe your community"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={communityData.category}
                      onValueChange={(value) => setCommunityData({ ...communityData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Environment">Environment</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Social">Social</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <SearchableSelect
                      options={countries.map(country => ({
                        value: country.name,
                        label: country.name,
                        flag: country.flag
                      }))}
                      value={communityData.country || ''}
                      placeholder="Search country..."
                      onValueChange={(value) => setCommunityData({ ...communityData, country: value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={communityData.city || ''}
                        onChange={(e) => setCommunityData({ ...communityData, city: e.target.value })}
                        placeholder="Enter city name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        value={communityData.state || ''}
                        onChange={(e) => setCommunityData({ ...communityData, state: e.target.value })}
                        placeholder="Enter state or province"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="language">Primary Language</Label>
                    <SearchableSelect
                      options={languages.map(language => ({
                        value: language.name,
                        label: language.name
                      }))}
                      value={communityData.language || ''}
                      placeholder="Search language..."
                      onValueChange={(value) => setCommunityData({ ...communityData, language: value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whoShouldJoin">Who Should Join</Label>
                    <Textarea
                      id="whoShouldJoin"
                      value={communityData.whoShouldJoin || ''}
                      onChange={(e) => setCommunityData({ ...communityData, whoShouldJoin: e.target.value })}
                      placeholder="Describe who should join this community..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Help potential members understand if this community is right for them.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="whatWeDo">What We Do</Label>
                    <Textarea
                      id="whatWeDo"
                      value={communityData.whatWeDo || ''}
                      onChange={(e) => setCommunityData({ ...communityData, whatWeDo: e.target.value })}
                      placeholder="Describe what your community does and its activities..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Explain the activities, initiatives, and goals of your community.
                    </p>
                  </div>
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Members Settings */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-6 h-6 mr-2" />
                    Members Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Manage community members, roles, and permissions.
                  </p>

                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      variant={membersTab === 'members' ? 'default' : 'outline'}
                      onClick={() => setMembersTab('members')}
                      className={`rounded-full px-6 py-2 ${
                        membersTab === 'members' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Members ({members.filter(m => m.user.id !== session?.user?.id && m.role !== 'OWNER' && m.role !== 'ADMIN').length})
                    </Button>
                    <Button
                      variant={membersTab === 'admins' ? 'default' : 'outline'}
                      onClick={() => setMembersTab('admins')}
                      className={`rounded-full px-6 py-2 ${
                        membersTab === 'admins' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      Admins ({members.filter(m => m.user.id !== session?.user?.id && (m.role === 'OWNER' || m.role === 'ADMIN')).length})
                    </Button>
                  </div>

                  {/* Search */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder={`Search ${membersTab === 'members' ? 'members' : 'admins'} by name or email...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Members/Admins List */}
                  {loadingMembers ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        let filteredMembers = members.filter(m => m.user.id !== session?.user?.id);
                        
                        // Filter by tab
                        if (membersTab === 'admins') {
                          filteredMembers = filteredMembers.filter(m => m.role === 'OWNER' || m.role === 'ADMIN');
                        } else {
                          filteredMembers = filteredMembers.filter(m => m.role !== 'OWNER' && m.role !== 'ADMIN');
                        }
                        
                        // Filter by search query
                        if (searchQuery) {
                          const query = searchQuery.toLowerCase();
                          filteredMembers = filteredMembers.filter(m =>
                            m.user.name?.toLowerCase().includes(query) ||
                            m.user.email?.toLowerCase().includes(query)
                          );
                        }

                        // Sort: OWNER first, then ADMIN, then others
                        filteredMembers.sort((a, b) => {
                          const roleOrder = { 'OWNER': 0, 'ADMIN': 1, 'MODERATOR': 2, 'MEMBER': 3 };
                          const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 4;
                          const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 4;
                          if (aOrder !== bOrder) return aOrder - bOrder;
                          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
                        });

                        if (filteredMembers.length === 0) {
                          return (
                            <Card>
                              <CardContent className="p-12 text-center">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No {membersTab === 'members' ? 'members' : 'admins'} found</h3>
                                <p className="text-muted-foreground">
                                  {membersTab === 'admins' 
                                    ? 'This community doesn\'t have any admins yet.' 
                                    : 'This community doesn\'t have any regular members yet.'}
                                </p>
                              </CardContent>
                            </Card>
                          );
                        }

                        return filteredMembers.map((member) => (
                          <Card key={member.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <Avatar className="w-12 h-12">
                                    <AvatarImage src={member.user.image || undefined} />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                      {member.user.name?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">{member.user.name}</h4>
                                      {member.role === 'OWNER' && (
                                        <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 font-semibold">
                                          <Star className="w-3 h-3 mr-1 fill-current" />
                                          Owner
                                        </Badge>
                                      )}
                                      {member.role === 'ADMIN' && (
                                        <Badge className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 font-semibold">
                                          Admin
                                        </Badge>
                                      )}
                                      {member.role === 'MODERATOR' && (
                                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-xs px-2 py-0.5">
                                          Moderator
                                        </Badge>
                                      )}
                                      {member.role === 'MEMBER' && (
                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs px-2 py-0.5">
                                          Member
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {member.user.tier}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/profile/${member.user.id}`)}
                                    className="flex items-center h-10 px-4"
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Connect
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => router.push(`/messages?userId=${member.user.id}`)}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 h-10 px-4"
                                  >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Message
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {communityData?.userRole === 'OWNER' && member.role !== 'OWNER' && (
                                        <DropdownMenuItem onClick={() => handleTransferOwnership(member.user.id, member.user.name || 'User')}>
                                          <Star className="w-4 h-4 mr-2" />
                                          Transfer Ownership
                                        </DropdownMenuItem>
                                      )}
                                      {member.role !== 'OWNER' && (
                                        <>
                                          {membersTab === 'members' && member.role !== 'ADMIN' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, 'ADMIN')}>
                                              <Crown className="w-4 h-4 mr-2" />
                                              Make Admin
                                            </DropdownMenuItem>
                                          )}
                                          {member.role !== 'MODERATOR' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, 'MODERATOR')}>
                                              <Shield className="w-4 h-4 mr-2" />
                                              Make Moderator
                                            </DropdownMenuItem>
                                          )}
                                          {member.role !== 'MEMBER' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, 'MEMBER')}>
                                              <Users className="w-4 h-4 mr-2" />
                                              Make Member
                                            </DropdownMenuItem>
                                          )}
                                          {membersTab === 'admins' && member.role === 'ADMIN' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, 'MEMBER')}>
                                              <Users className="w-4 h-4 mr-2" />
                                              Remove Admin
                                            </DropdownMenuItem>
                                          )}
                                          {(() => {
                                            // Only owner can remove admins, owner or admin can remove members
                                            const canRemove = 
                                              (membersTab === 'admins' && communityData?.userRole === 'OWNER') ||
                                              (membersTab === 'members' && (communityData?.userRole === 'OWNER' || communityData?.userRole === 'ADMIN'));
                                            
                                            return canRemove && (
                                              <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem 
                                                  onClick={() => handleRemoveMember(member.user.id, member.user.name || 'User')}
                                                  className="text-red-600"
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  Remove {membersTab === 'admins' ? 'Admin' : 'Member'}
                                                </DropdownMenuItem>
                                              </>
                                            );
                                          })()}
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-6 h-6 mr-2" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="privacy">Community Privacy *</Label>
                    <Select
                      value={communityData.privacy}
                      onValueChange={(value) => setCommunityData({ ...communityData, privacy: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select privacy level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Public - Anyone can join
                          </div>
                        </SelectItem>
                        <SelectItem value="PRIVATE">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Private - Requires approval
                          </div>
                        </SelectItem>
                        <SelectItem value="INVITE_ONLY">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Invite Only - Invitation required
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !isDirty}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Delete Group */}
          {activeTab === 'danger' && communityData?.userRole === 'OWNER' && (
            <div className="space-y-6">
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    Delete Group
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                          Delete Community
                        </h4>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          Once you delete a community, there is no going back. This will permanently delete:
                        </p>
                        <ul className="list-disc list-inside text-sm text-red-800 dark:text-red-200 space-y-1 mb-4">
                          <li>All community posts and content</li>
                          <li>All member relationships</li>
                          <li>All community resources</li>
                          <li>All community data and settings</li>
                        </ul>
                        <p className="text-sm font-medium text-red-900 dark:text-red-100">
                          This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold mb-1">Delete {communityData.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete this community and all its data.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Community
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteCommunity}
        title="Delete Community"
        description={
          communityData
            ? `Are you absolutely sure you want to delete "${communityData.name}"? This action cannot be undone and will permanently delete all community data, posts, members, and resources.`
            : "Are you absolutely sure you want to delete this community? This action cannot be undone and will permanently delete all community data, posts, members, and resources."
        }
        confirmText={deleting ? "Deleting..." : "Delete Community"}
        cancelText="Cancel"
        variant="destructive"
        icon="trash"
      />
    </div>
  );
}

