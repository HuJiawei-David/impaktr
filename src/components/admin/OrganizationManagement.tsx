// home/ubuntu/impaktrweb/src/components/admin/OrganizationManagement.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  Award,
  Calendar,
  TrendingUp,
  Download,
  Mail,
  FileText,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { formatDate, formatTimeAgo, getInitials, formatScore, formatNumber } from '@/lib/utils';

interface Organization {
  id: string;
  name: string;
  type: string;
  tier: string;
  impaktrScore: number;
  isVerified: boolean;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  profile: {
    logo?: string;
    website?: string;
    location?: any;
    industry?: string;
    companySize?: string;
    description?: string;
    contactPerson?: any;
  };
  _count: {
    members: number;
    events: number;
    badges: number;
  };
  subscription?: {
    plan: string;
    status: string;
    revenue: number;
  };
  verification?: {
    status: 'pending' | 'approved' | 'rejected';
    documents: string[];
    reviewedAt?: string;
    reviewedBy?: string;
  };
}

interface OrganizationStats {
  totalOrganizations: number;
  newOrganizationsThisMonth: number;
  verifiedOrganizations: number;
  pendingVerification: number;
  totalRevenue: number;
  averageScore: number;
  topIndustries: Array<{ industry: string; count: number }>;
}

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('score');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);

  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchTerm, selectedType, selectedStatus, selectedTier, sortBy]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/organizations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching organization stats:', error);
    }
  };

  const filterOrganizations = () => {
    let filtered = [...organizations];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.profile?.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(org => org.type === selectedType.toUpperCase());
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(org => {
        switch (selectedStatus) {
          case 'verified':
            return org.isVerified;
          case 'pending':
            return org.verification?.status === 'pending';
          case 'rejected':
            return org.verification?.status === 'rejected';
          case 'active':
            return org.subscription?.status === 'active';
          default:
            return true;
        }
      });
    }
    return filtered;
  };

  const displayed = filterOrganizations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Organizations</h2>
        <span className="text-sm text-muted-foreground">
          {isLoading ? 'Loading…' : `${displayed.length} organizations`}
        </span>
      </div>

      <div className="grid gap-3">
        {displayed.slice(0, 10).map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <CardTitle className="text-base">{org.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Owner: {org.owner.email}
            </CardContent>
          </Card>
        ))}
        {!isLoading && displayed.length === 0 && (
          <div className="text-sm text-muted-foreground">No organizations found.</div>
        )}
      </div>
    </div>
  );
}