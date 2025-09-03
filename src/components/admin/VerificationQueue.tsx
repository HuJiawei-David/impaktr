// home/ubuntu/impaktrweb/src/components/admin/VerificationQueue.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  MapPin,
  Calendar,
  User,
  Award,
  AlertTriangle,
  Search,
  Download,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTimeAgo, getInitials, formatHours } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface VerificationRequest {
  id: string;
  participationId: string;
  eventId: string;
  type: 'SELF' | 'PEER' | 'ORGANIZER' | 'GPS' | 'AUTOMATIC';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  
  // Participant details
  participant: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    impaktrScore: number;
    rank: string;
    trustScore: number;
  };
  
  // Event details
  event: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    location: {
      city: string;
      isVirtual: boolean;
    };
    sdgTags: number[];
    creator: {
      name: string;
      avatar: string;
    };
    organization?: {
      name: string;
      logo: string;
    };
  };
  
  // Participation details
  participation: {
    hoursCommitted: number;
    hoursActual?: number;
    notes?: string;
    proofImages: string[];
    skillsApplied: string[];
  };
  
  // Verification data
  verification: {
    gpsCoordinates?: {
      lat: number;
      lng: number;
      accuracy: number;
      timestamp: string;
    };
    proofData?: {
      photos: string[];
      signatures: string[];
      notes: string;
    };
    comments?: string;
    rating?: number;
    verifier?: {
      name: string;
      avatar: string;
    };
  };
  
  // Risk assessment
  riskFactors: {
    locationMismatch: boolean;
    timeDiscrepancy: boolean;
    unusualActivity: boolean;
    newUser: boolean;
    duplicateVerifier: boolean;
    score: number; // 0-100, higher = more risky
  };
}

interface VerificationFilters {
  search: string;
  status: string;
  type: string;
  priority: string;
  riskLevel: string;
  dateRange: string;
  sdg?: number;
}

export function VerificationQueue() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<VerificationRequest[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showDetails, setShowDetails] = useState(false);
  
  const [filters, setFilters] = useState<VerificationFilters>({
    search: '',
    status: 'PENDING',
    type: '',
    priority: '',
    riskLevel: '',
    dateRange: '7d'
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    highRisk: 0,
    avgProcessingTime: 0
  });

  useEffect(() => {
    fetchVerifications();
  }, [filters]);

  useEffect(() => {
    filterVerificationsByTab(verifications, activeTab);
    calculateStats(verifications);
  }, [verifications, activeTab]);

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.set(key, value.toString());
      });

      const response = await fetch(`/api/admin/verifications?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setVerifications(data.verifications);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setIsLoading(false);
    }
  };

  const filterVerificationsByTab = (verificationList: VerificationRequest[], tab: string) => {
    let filtered = [...verificationList];

    switch (tab) {
      case 'pending':
        filtered = verificationList.filter(v => v.status === 'PENDING');
        break;
      case 'high-risk':
        filtered = verificationList.filter(v => v.riskFactors.score >= 70);
        break;
      case 'urgent':
        filtered = verificationList.filter(v => v.priority === 'URGENT');
        break;
      case 'recent':
        filtered = verificationList.filter(v => {
          const daysSince = (Date.now() - new Date(v.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince <= 1;
        });
        break;
      default:
        filtered = verificationList;
    }

    setFilteredVerifications(filtered);
  };

  const calculateStats = (verificationList: VerificationRequest[]) => {
    const pending = verificationList.filter(v => v.status === 'PENDING').length;
    const verified = verificationList.filter(v => v.status === 'VERIFIED').length;
    const rejected = verificationList.filter(v => v.status === 'REJECTED').length;
    const highRisk = verificationList.filter(v => v.riskFactors.score >= 70).length;

    setStats({
      total: verificationList.length,
      pending,
      verified,
      rejected,
      highRisk,
      avgProcessingTime: 2.3 // Mock data
    });
  };

  const handleApprove = async (verificationId: string, rating?: number) => {
    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: rating || 1.0 })
      });

      if (response.ok) {
        toast.success('Verification approved');
        fetchVerifications();
      } else {
        throw new Error('Failed to approve');
      }
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    }
  };

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast.success('Verification rejected');
        fetchVerifications();
      } else {
        throw new Error('Failed to reject');
      }
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const exportVerifications = async () => {
    try {
      const response = await fetch('/api/admin/verifications/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `verifications-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Export downloaded');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.highRisk}</div>
            <div className="text-sm text-muted-foreground">High Risk</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.avgProcessingTime}h</div>
            <div className="text-sm text-muted-foreground">Avg Processing</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by participant name, event title, or verification ID..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex gap-2">
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="SELF">Self</SelectItem>
                  <SelectItem value="PEER">Peer</SelectItem>
                  <SelectItem value="ORGANIZER">Organizer</SelectItem>
                  <SelectItem value="GPS">GPS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priority</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.riskLevel} onValueChange={(value) => setFilters(prev => ({ ...prev, riskLevel: value }))}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Risk</SelectItem>
                  <SelectItem value="high">High Risk (80+)</SelectItem>
                  <SelectItem value="medium">Medium Risk (60-79)</SelectItem>
                  <SelectItem value="low">Low Risk (0-59)</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={exportVerifications}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="high-risk">High Risk ({stats.highRisk})</TabsTrigger>
          <TabsTrigger value="urgent">Urgent</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVerifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No verifications found</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'pending' 
                    ? 'All verifications have been processed!'
                    : 'No verifications match your current filters.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredVerifications.map((verification) => (
                <Card key={verification.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      {/* Left Side - Main Info */}
                      <div className="flex-1 space-y-4">
                        {/* Header Row */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Priority Indicator */}
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(verification.priority)}`} />
                            
                            {/* Participant Info */}
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={verification.participant.avatar} />
                              <AvatarFallback>
                                {getInitials(verification.participant.name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h4 className="font-semibold">{verification.participant.name}</h4>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="text-xs">
                                  {verification.participant.rank}
                                </Badge>
                                <span>Score: {verification.participant.impaktrScore.toFixed(0)}</span>
                                <span>Trust: {verification.participant.trustScore}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Risk Score */}
                          <Badge className={`${getRiskLevelColor(verification.riskFactors.score)} border-0`}>
                            Risk: {verification.riskFactors.score}%
                          </Badge>
                        </div>

                        {/* Event Details */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium">{verification.event.title}</h5>
                            <div className="flex space-x-1">
                              {verification.event.sdgTags.slice(0, 3).map((sdg) => (
                                <Badge key={sdg} variant="sdg" sdgNumber={sdg} className="text-xs">
                                  {sdg}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                              {formatTimeAgo(verification.event.startDate)}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                              {verification.event.location.isVirtual ? 'Virtual' : verification.event.location.city}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                              {formatHours(verification.participation.hoursActual || verification.participation.hoursCommitted)}
                            </div>
                            <div className="flex items-center">
                              <Award className="w-4 h-4 mr-2 text-muted-foreground" />
                              {verification.type}
                            </div>
                          </div>

                          {/* Organizer Info */}
                          <div className="flex items-center space-x-2 mt-3 text-sm text-muted-foreground">
                            <span>by</span>
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={verification.event.organization?.logo || verification.event.creator.avatar} />
                              <AvatarFallback className="text-xs">
                                {getInitials(verification.event.organization?.name || verification.event.creator.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{verification.event.organization?.name || verification.event.creator.name}</span>
                          </div>
                        </div>

                        {/* Risk Factors */}
                        {verification.riskFactors.score > 50 && (
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                Risk Factors Detected
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {verification.riskFactors.locationMismatch && (
                                <Badge variant="outline" className="text-xs text-yellow-700">
                                  Location Mismatch
                                </Badge>
                              )}
                              {verification.riskFactors.timeDiscrepancy && (
                                <Badge variant="outline" className="text-xs text-yellow-700">
                                  Time Discrepancy
                                </Badge>
                              )}
                              {verification.riskFactors.unusualActivity && (
                                <Badge variant="outline" className="text-xs text-yellow-700">
                                  Unusual Activity
                                </Badge>
                              )}
                              {verification.riskFactors.newUser && (
                                <Badge variant="outline" className="text-xs text-yellow-700">
                                  New User
                                </Badge>
                              )}
                              {verification.riskFactors.duplicateVerifier && (
                                <Badge variant="outline" className="text-xs text-yellow-700">
                                  Duplicate Verifier
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Verification Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Submitted:</span>
                            <div className="font-medium">{formatTimeAgo(verification.createdAt)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Hours:</span>
                            <div className="font-medium">
                              {verification.participation.hoursCommitted}
                              {verification.participation.hoursActual && 
                                ` → ${verification.participation.hoursActual}`
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Proof:</span>
                            <div className="font-medium">
                              {verification.participation.proofImages.length} photos
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Skills:</span>
                            <div className="font-medium">
                              {verification.participation.skillsApplied.length || 0} applied
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedVerification(verification);
                            setShowDetails(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </Button>

                        {verification.status === 'PENDING' && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(verification.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleReject(verification.id, 'Manual review required')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedVerification(verification);
                              setShowDetails(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <User className="w-4 h-4 mr-2" />
                              View Participant
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              View Event
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Flag for Review
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Verification Detail Modal/Sidebar would go here */}
      {showDetails && selectedVerification && (
        <VerificationDetailPanel
          verification={selectedVerification}
          onClose={() => setShowDetails(false)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

// Verification Detail Panel Component
interface VerificationDetailPanelProps {
  verification: VerificationRequest;
  onClose: () => void;
  onApprove: (id: string, rating?: number) => void;
  onReject: (id: string, reason: string) => void;
}

function VerificationDetailPanel({ verification, onClose, onApprove, onReject }: VerificationDetailPanelProps) {
  const [rating, setRating] = useState(1.0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verification Review</CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Participant and Event Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Participant Details</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={verification.participant.avatar} />
                    <AvatarFallback>{getInitials(verification.participant.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{verification.participant.name}</div>
                    <div className="text-sm text-muted-foreground">{verification.participant.email}</div>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Impaktr Score:</span>
                  <span className="ml-2 font-medium">{verification.participant.impaktrScore}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Trust Score:</span>
                  <span className="ml-2 font-medium">{verification.participant.trustScore}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Event Details</h4>
              <div className="space-y-2">
                <div className="font-medium">{verification.event.title}</div>
                <div className="text-sm text-muted-foreground">
                  {formatTimeAgo(verification.event.startDate)} • {verification.event.location.city}
                </div>
                <div className="flex flex-wrap gap-1">
                  {verification.event.sdgTags.map((sdg) => (
                    <Badge key={sdg} variant="sdg" sdgNumber={sdg} className="text-xs">
                      SDG {sdg}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Participation Details */}
          <div>
            <h4 className="font-semibold mb-3">Participation Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hours Committed:</span>
                <div className="font-medium">{verification.participation.hoursCommitted}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Hours Actual:</span>
                <div className="font-medium">
                  {verification.participation.hoursActual || 'Not reported'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Verification Type:</span>
                <div className="font-medium capitalize">{verification.type.toLowerCase()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Skills Applied:</span>
                <div className="font-medium">{verification.participation.skillsApplied.length || 0}</div>
              </div>
            </div>

            {verification.participation.notes && (
              <div className="mt-3">
                <span className="text-muted-foreground text-sm">Notes:</span>
                <p className="text-sm mt-1 p-2 bg-muted/50 rounded">
                  {verification.participation.notes}
                </p>
              </div>
            )}
          </div>

          {/* Proof Evidence */}
          <div>
            <h4 className="font-semibold mb-3">Proof Evidence</h4>
            
            {/* GPS Data */}
            {verification.verification.gpsCoordinates && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">GPS Verification</h5>
                <div className="bg-muted/50 rounded p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Coordinates:</span>
                      <div className="font-mono">
                        {verification.verification.gpsCoordinates.lat.toFixed(6)}, 
                        {verification.verification.gpsCoordinates.lng.toFixed(6)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accuracy:</span>
                      <div>{verification.verification.gpsCoordinates.accuracy}m</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground">Timestamp:</span>
                    <div>{new Date(verification.verification.gpsCoordinates.timestamp).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Photos */}
            {verification.participation.proofImages.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">
                  Proof Photos ({verification.participation.proofImages.length})
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {verification.participation.proofImages.map((image, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Proof ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(image, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Proof Data */}
            {verification.verification.proofData && (
              <div>
                <h5 className="text-sm font-medium mb-2">Additional Evidence</h5>
                <div className="bg-muted/50 rounded p-3 text-sm">
                  {verification.verification.proofData.notes && (
                    <div className="mb-2">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="mt-1">{verification.verification.proofData.notes}</p>
                    </div>
                  )}
                  
                  {verification.verification.proofData.signatures && verification.verification.proofData.signatures.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Digital Signatures:</span>
                      <div className="mt-1">{verification.verification.proofData.signatures.length} signature(s)</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Verification Actions */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="quality-rating">Quality Rating (0.5 - 1.5)</Label>
              <Select value={rating.toString()} onValueChange={(value) => setRating(parseFloat(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Poor (0.5)</SelectItem>
                  <SelectItem value="0.7">Below Average (0.7)</SelectItem>
                  <SelectItem value="1.0">Average (1.0)</SelectItem>
                  <SelectItem value="1.2">Good (1.2)</SelectItem>
                  <SelectItem value="1.5">Excellent (1.5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) {
                    onReject(verification.id, reason);
                    onClose();
                  }
                }}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              
              <Button
                className="text-green-600 bg-green-50 border-green-600 hover:bg-green-100"
                onClick={() => {
                  onApprove(verification.id, rating);
                  onClose();
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}