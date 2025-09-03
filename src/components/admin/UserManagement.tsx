// home/ubuntu/impaktrweb/src/components/admin/UserManagement.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Ban, 
  CheckCircle, 
  XCircle,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Eye,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatDate, formatScore, getInitials, formatTimeAgo } from '@/lib/utils';

interface AdminUser {
  id: string;
  auth0Id: string;
  email: string;
  userType: 'INDIVIDUAL' | 'NGO' | 'CORPORATE' | 'SCHOOL' | 'HEALTHCARE';
  isVerified: boolean;
  onboardingComplete: boolean;
  impaktrScore: number;
  currentRank: string;
  createdAt: string;
  lastActiveAt: string;
  profile: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatar?: string;
    location?: {
      city: string;
      country: string;
    };
    organization?: string;
  };
  stats: {
    totalHours: number;
    verifiedHours: number;
    eventsJoined: number;
    badgesEarned: number;
    certificates: number;
  };
  flags: {
    isSuspended: boolean;
    isFlagged: boolean;
    hasUnverifiedHours: boolean;
  };
}

interface UserFilters {
  search: string;
  userType: string;
  verificationStatus: string;
  rankRange: string;
  location: string;
  activityLevel: string;
  joinedDate: string;
  sortBy: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [bulkActions, setBulkActions] = useState<string[]>([]);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    userType: 'all',
    verificationStatus: 'all',
    rankRange: 'all',
    location: 'all',
    activityLevel: 'all',
    joinedDate: 'all',
    sortBy: 'lastActive'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, filters]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.profile.displayName?.toLowerCase().includes(searchLower) ||
        `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase().includes(searchLower) ||
        user.profile.organization?.toLowerCase().includes(searchLower)
      );
    }

    // User type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(user => user.userType === filters.userType);
    }

    // Verification status filter
    if (filters.verificationStatus !== 'all') {
      switch (filters.verificationStatus) {
        case 'verified':
          filtered = filtered.filter(user => user.isVerified);
          break;
        case 'unverified':
          filtered = filtered.filter(user => !user.isVerified);
          break;
        case 'onboarded':
          filtered = filtered.filter(user => user.onboardingComplete);
          break;
        case 'incomplete':
          filtered = filtered.filter(user => !user.onboardingComplete);
          break;
      }
    }

    // Rank range filter
    if (filters.rankRange !== 'all') {
      const rankOrder = ['HELPER', 'SUPPORTER', 'CONTRIBUTOR', 'BUILDER', 'ADVOCATE', 'CHANGEMAKER', 'MENTOR', 'LEADER', 'AMBASSADOR', 'GLOBAL_CITIZEN'];
      switch (filters.rankRange) {
        case 'beginner':
          filtered = filtered.filter(user => rankOrder.indexOf(user.currentRank) <= 2);
          break;
        case 'intermediate':
          filtered = filtered.filter(user => {
            const index = rankOrder.indexOf(user.currentRank);
            return index >= 3 && index <= 6;
          });
          break;
        case 'advanced':
          filtered = filtered.filter(user => rankOrder.indexOf(user.currentRank) >= 7);
          break;
      }
    }

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(user => 
        user.profile.location?.country.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Activity level filter
    if (filters.activityLevel !== 'all') {
      switch (filters.activityLevel) {
        case 'high':
          filtered = filtered.filter(user => user.stats.totalHours >= 100);
          break;
        case 'medium':
          filtered = filtered.filter(user => user.stats.totalHours >= 25 && user.stats.totalHours < 100);
          break;
        case 'low':
          filtered = filtered.filter(user => user.stats.totalHours < 25);
          break;
        case 'inactive':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filtered = filtered.filter(user => new Date(user.lastActiveAt) < thirtyDaysAgo);
          break;
      }
    }

    // Joined date filter
    if (filters.joinedDate !== 'all') {
      const now = new Date();
      switch (filters.joinedDate) {
        case 'last-week':
          const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => new Date(user.createdAt) >= lastWeek);
          break;
        case 'last-month':
          const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => new Date(user.createdAt) >= lastMonth);
          break;
        case 'last-quarter':
          const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(user => new Date(user.createdAt) >= lastQuarter);
          break;
      }
    }

    // Sort results
    switch (filters.sortBy) {
      case 'score':
        filtered.sort((a, b) => b.impaktrScore - a.impaktrScore);
        break;
      case 'joined':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => {
          const nameA = a.profile.displayName || `${a.profile.firstName} ${a.profile.lastName}`;
          const nameB = b.profile.displayName || `${b.profile.firstName} ${b.profile.lastName}`;
          return nameA.localeCompare(nameB);
        });
        break;
      case 'lastActive':
      default:
        filtered.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
      }
    } catch (error) {
      console.error(`Error performing ${action} on user:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (bulkActions.length === 0) return;

    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: bulkActions,
          action
        })
      });

      if (response.ok) {
        setBulkActions([]);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `impaktr-users-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  const getUserTypeColor = (userType: string) => {
    const colors = {
      INDIVIDUAL: 'bg-blue-100 text-blue-800',
      NGO: 'bg-green-100 text-green-800',
      CORPORATE: 'bg-orange-100 text-orange-800',
      SCHOOL: 'bg-purple-100 text-purple-800',
      HEALTHCARE: 'bg-red-100 text-red-800'
    };
    return colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRankColor = (rank: string) => {
    const colors = {
      HELPER: 'bg-gray-100 text-gray-800',
      SUPPORTER: 'bg-blue-100 text-blue-800',
      CONTRIBUTOR: 'bg-green-100 text-green-800',
      BUILDER: 'bg-yellow-100 text-yellow-800',
      ADVOCATE: 'bg-pink-100 text-pink-800',
      CHANGEMAKER: 'bg-purple-100 text-purple-800',
      MENTOR: 'bg-indigo-100 text-indigo-800',
      LEADER: 'bg-orange-100 text-orange-800',
      AMBASSADOR: 'bg-red-100 text-red-800',
      GLOBAL_CITIZEN: 'bg-emerald-100 text-emerald-800'
    };
    return colors[rank as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Users className="w-6 h-6 mr-2" />
            User Management
          </h2>
          <p className="text-muted-foreground">
            Manage all platform users, verify accounts, and monitor activity
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          {bulkActions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  Bulk Actions ({bulkActions.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('verify')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('suspend')}>
                  <Ban className="w-4 h-4 mr-2" />
                  Suspend Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('email')}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* User Type */}
            <Select value={filters.userType} onValueChange={(value) => setFilters(prev => ({ ...prev, userType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INDIVIDUAL">Individuals</SelectItem>
                <SelectItem value="NGO">NGOs</SelectItem>
                <SelectItem value="CORPORATE">Corporates</SelectItem>
                <SelectItem value="SCHOOL">Schools</SelectItem>
                <SelectItem value="HEALTHCARE">Healthcare</SelectItem>
              </SelectContent>
            </Select>

            {/* Verification Status */}
            <Select value={filters.verificationStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, verificationStatus: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="onboarded">Onboarded</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastActive">Last Active</SelectItem>
                <SelectItem value="score">Impaktr Score</SelectItem>
                <SelectItem value="joined">Date Joined</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="hours">Total Hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Select value={filters.rankRange} onValueChange={(value) => setFilters(prev => ({ ...prev, rankRange: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Rank Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranks</SelectItem>
                <SelectItem value="beginner">Beginner (Helper-Contributor)</SelectItem>
                <SelectItem value="intermediate">Intermediate (Builder-Changemaker)</SelectItem>
                <SelectItem value="advanced">Advanced (Mentor-Global Citizen)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.activityLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, activityLevel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Activity Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="high">High (100+ hours)</SelectItem>
                <SelectItem value="medium">Medium (25-99 hours)</SelectItem>
                <SelectItem value="low">Low (1-24 hours)</SelectItem>
                <SelectItem value="inactive">Inactive (30+ days)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.joinedDate} onValueChange={(value) => setFilters(prev => ({ ...prev, joinedDate: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Joined Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-quarter">Last Quarter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isVerified).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active This Month</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return new Date(u.lastActiveAt) >= lastMonth;
                  }).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged/Suspended</p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.flags.isSuspended || u.flags.isFlagged).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Users ({filteredUsers.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                search: '',
                userType: 'all',
                verificationStatus: 'all',
                rankRange: 'all',
                location: 'all',
                activityLevel: 'all',
                joinedDate: 'all',
                sortBy: 'lastActive'
              })}
            >
              Clear Filters
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="w-20 h-8 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                    bulkActions.includes(user.id) ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={bulkActions.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkActions(prev => [...prev, user.id]);
                      } else {
                        setBulkActions(prev => prev.filter(id => id !== user.id));
                      }
                    }}
                    className="rounded border-input"
                  />

                  {/* Avatar */}
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.profile.avatar} alt={user.profile.displayName} />
                    <AvatarFallback>
                      {getInitials(user.profile.displayName || `${user.profile.firstName} ${user.profile.lastName}`)}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">
                        {user.profile.displayName || `${user.profile.firstName} ${user.profile.lastName}`}
                      </h4>
                      
                      {/* Status Indicators */}
                      <div className="flex items-center space-x-1">
                        {user.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {user.flags.isSuspended && (
                          <Ban className="w-4 h-4 text-red-500" />
                        )}
                        {user.flags.isFlagged && (
                          <XCircle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="truncate">{user.email}</span>
                      
                      {user.profile.location && (
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {user.profile.location.city}, {user.profile.location.country}
                        </span>
                      )}
                      
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatTimeAgo(user.lastActiveAt)}
                      </span>
                    </div>
                  </div>

                  {/* User Type */}
                  <Badge className={getUserTypeColor(user.userType)}>
                    {user.userType}
                  </Badge>

                  {/* Rank */}
                  <Badge className={getRankColor(user.currentRank)}>
                    {user.currentRank.replace('_', ' ')}
                  </Badge>

                  {/* Impaktr Score */}
                  <div className="text-center min-w-0">
                    <div className="font-bold text-lg text-primary">
                      {formatScore(user.impaktrScore)}
                    </div>
                    <div className="text-xs text-muted-foreground">Score</div>
                  </div>

                  {/* Stats */}
                  <div className="hidden lg:block text-center min-w-0">
                    <div className="font-medium">{user.stats.totalHours}h</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>

                  <div className="hidden lg:block text-center min-w-0">
                    <div className="font-medium">{user.stats.eventsJoined}</div>
                    <div className="text-xs text-muted-foreground">Events</div>
                  </div>

                  <div className="hidden lg:block text-center min-w-0">
                    <div className="font-medium">{user.stats.badgesEarned}</div>
                    <div className="text-xs text-muted-foreground">Badges</div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'edit')}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {!user.isVerified && (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'verify')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify Account
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleUserAction(user.id, 'email')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {user.flags.isSuspended ? (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'unsuspend')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Unsuspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'suspend')}>
                          <Ban className="w-4 h-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    No users match your current filters. Try adjusting your search criteria.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredUsers.length > 50 && (
        <div className="flex items-center justify-center space-x-2">
          <Button variant="outline" size="sm">Previous</Button>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="bg-primary text-primary-foreground">1</Button>
            <Button variant="ghost" size="sm">2</Button>
            <Button variant="ghost" size="sm">3</Button>
            <span className="text-muted-foreground">...</span>
            <Button variant="ghost" size="sm">10</Button>
          </div>
          <Button variant="outline" size="sm">Next</Button>
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedUser?.profile.avatar} />
                <AvatarFallback>
                  {selectedUser && getInitials(selectedUser.profile.displayName || `${selectedUser.profile.firstName} ${selectedUser.profile.lastName}`)}
                </AvatarFallback>
              </Avatar>
              <span>
                {selectedUser?.profile.displayName || `${selectedUser?.profile.firstName} ${selectedUser?.profile.lastName}`}
              </span>
            </DialogTitle>
            <DialogDescription>
              Detailed user information and activity history
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Type:</span>
                      <Badge className={getUserTypeColor(selectedUser.userType)}>
                        {selectedUser.userType}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification Status:</span>
                      <Badge className={selectedUser.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Onboarding:</span>
                      <Badge className={selectedUser.onboardingComplete ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {selectedUser.onboardingComplete ? 'Complete' : 'Incomplete'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Active:</span>
                      <span className="font-medium">{formatTimeAgo(selectedUser.lastActiveAt)}</span>
                    </div>
                    {selectedUser.profile.organization && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Organization:</span>
                        <span className="font-medium">{selectedUser.profile.organization}</span>
                      </div>
                    )}
                    {selectedUser.profile.location && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {selectedUser.profile.location.city}, {selectedUser.profile.location.country}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Impact Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impaktr Score:</span>
                      <span className="font-bold text-primary text-lg">
                        {formatScore(selectedUser.impaktrScore)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Rank:</span>
                      <Badge className={getRankColor(selectedUser.currentRank)}>
                        {selectedUser.currentRank.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Hours:</span>
                      <span className="font-medium">{selectedUser.stats.totalHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verified Hours:</span>
                      <span className="font-medium">{selectedUser.stats.verifiedHours}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Events Joined:</span>
                      <span className="font-medium">{selectedUser.stats.eventsJoined}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Badges Earned:</span>
                      <span className="font-medium">{selectedUser.stats.badgesEarned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certificates:</span>
                      <span className="font-medium">{selectedUser.stats.certificates}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Flags and Warnings */}
              {(selectedUser.flags.isSuspended || selectedUser.flags.isFlagged || selectedUser.flags.hasUnverifiedHours) && (
                <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                      Account Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedUser.flags.isSuspended && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <Ban className="w-4 h-4" />
                          <span>Account is suspended</span>
                        </div>
                      )}
                      {selectedUser.flags.isFlagged && (
                        <div className="flex items-center space-x-2 text-orange-600">
                          <XCircle className="w-4 h-4" />
                          <span>Account has been flagged for review</span>
                        </div>
                      )}
                      {selectedUser.flags.hasUnverifiedHours && (
                        <div className="flex items-center space-x-2 text-yellow-600">
                          <Clock className="w-4 h-4" />
                          <span>Has unverified hours pending review</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/profile/${selectedUser.id}`, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Public Profile
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUserAction(selectedUser.id, 'email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                
                {!selectedUser.isVerified && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUserAction(selectedUser.id, 'verify')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Account
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleUserAction(selectedUser.id, 'reset-score')}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Recalculate Score
                </Button>
                
                {selectedUser.flags.isSuspended ? (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleUserAction(selectedUser.id, 'unsuspend')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unsuspend
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleUserAction(selectedUser.id, 'suspend')}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Suspend
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}