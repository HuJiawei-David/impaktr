// home/ubuntu/impaktrweb/src/app/organization/members/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Award,
  Clock,
  TrendingUp,
  Shield,
  Edit,
  Trash2,
  Send
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { formatScore, formatHours, getInitials, formatTimeAgo } from '@/lib/utils';

interface OrganizationMember {
  id: string;
  user: {
    id: string;
    email: string;
    profile: {
      firstName: string;
      lastName: string;
      displayName: string;
      avatar: string;
      occupation: string;
    };
    impaktrScore: number;
    currentRank: string;
  };
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  lastActive: string;
  stats: {
    totalHours: number;
    eventsJoined: number;
    badgesEarned: number;
    certificates: number;
  };
  engagement: {
    participationRate: number;
    averageRating: number;
    completionRate: number;
  };
}

interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  averageScore: number;
  totalHours: number;
  memberGrowthRate: number;
  engagementRate: number;
}

export default function OrganizationMembersPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'member',
    message: ''
  });

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/signup');
      return;
    }

    if (user) {
      fetchMembersData();
    }
  }, [isLoading, user]);

  const fetchMembersData = async () => {
    try {
      const [membersResponse, statsResponse] = await Promise.all([
        fetch('/api/organization/members'),
        fetch('/api/organization/stats')
      ]);

      if (membersResponse.ok && statsResponse.ok) {
        const [membersData, statsData] = await Promise.all([
          membersResponse.json(),
          statsResponse.json()
        ]);

        setMembers(membersData.members);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching members data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInviteMember = async () => {
    try {
      const response = await fetch('/api/organization/members/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (response.ok) {
        setIsInviteDialogOpen(false);
        setInviteData({ email: '', role: 'member', message: '' });
        fetchMembersData();
        // Show success toast
      }
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        fetchMembersData();
      }
    } catch (error) {
      console.error('Error updating member role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembersData();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const handleBulkExport = () => {
    const csvData = members
      .filter(member => selectedMembers.length === 0 || selectedMembers.includes(member.id))
      .map(member => ({
        Name: member.user.profile.displayName,
        Email: member.user.email,
        Role: member.role,
        'Impaktr Score': member.user.impaktrScore,
        'Total Hours': member.stats.totalHours,
        'Events Joined': member.stats.eventsJoined,
        'Participation Rate': `${member.engagement.participationRate}%`,
        'Joined Date': new Date(member.joinedAt).toLocaleDateString()
      }));

    // Convert to CSV and download
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'organization-members.csv';
    a.click();
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user.profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="w-8 h-8 mr-3" />
            Team Members
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's members and their impact contributions
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="member@company.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Personal Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Welcome to our impact team..."
                    value={inviteData.message}
                    onChange={(e) => setInviteData(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteMember}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.memberGrowthRate || 0}%</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.engagementRate || 0}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatScore(stats?.averageScore || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Team performance metric
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impact Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(stats?.totalHours || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Collective impact contributed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Members Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <CardTitle>Team Members ({filteredMembers.length})</CardTitle>
            
            <div className="flex space-x-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                      }
                    }}
                    className="rounded border-input"
                  />
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user.profile.avatar} />
                    <AvatarFallback>
                      {getInitials(member.user.profile.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{member.user.profile.displayName}</p>
                      <Badge variant={
                        member.role === 'owner' ? 'default' :
                        member.role === 'admin' ? 'secondary' : 'outline'
                      }>
                        {member.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.profile.occupation} • Joined {formatTimeAgo(member.joinedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Member Stats */}
                  <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="text-center">
                      <div className="font-medium text-foreground">{formatScore(member.user.impaktrScore)}</div>
                      <div className="text-xs">Score</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{member.stats.eventsJoined}</div>
                      <div className="text-xs">Events</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-foreground">{member.engagement.participationRate}%</div>
                      <div className="text-xs">Participation</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        View Profile
                      </DropdownMenuItem>
                      {member.role !== 'owner' && (
                        <>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, member.role === 'admin' ? 'member' : 'admin')}>
                            <Shield className="mr-2 h-4 w-4" />
                            {member.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Member
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No members found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}