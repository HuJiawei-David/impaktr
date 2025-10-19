'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Star,
  AlertCircle,
  Search,
  Calendar,
  MapPin,
  Award,
  Mail,
  FileCheck,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Verification {
  id: string;
  type: string;
  status: string;
  rating: number | null;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
  participation: {
    id: string;
    hours: number | null;
    joinedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      impactScore: number;
    };
    event: {
      id: string;
      title: string;
      startDate: string;
      location: string | null;
      type: string;
    };
  };
}

interface Certificate {
  id: string;
  userId: string;
  eventId: string;
  issuedAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string | null;
  };
  participation: {
    hours: number | null;
    status: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  invitedBy: string;
  inviter: {
    name: string | null;
    email: string;
  };
}

export default function OrganizationManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('verifications');
  
  // Verifications state
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(true);
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rating, setRating] = useState(1.0);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  
  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [invitationFilter, setInvitationFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchVerifications();
    } else if (activeTab === 'certificates') {
      fetchCertificates();
    } else if (activeTab === 'invitations') {
      fetchInvitations();
    }
  }, [activeTab, verificationFilter, invitationFilter]);

  const fetchVerifications = async () => {
    try {
      setVerificationsLoading(true);
      const response = await fetch(`/api/organization/verifications?status=${verificationFilter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch verifications');
      }

      const data = await response.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verifications');
    } finally {
      setVerificationsLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const response = await fetch('/api/organization/certificates/pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    } finally {
      setCertificatesLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const response = await fetch(`/api/organization/invitations?status=${invitationFilter}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleVerify = async (verificationId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/verifications/${verificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status === 'approved' ? 'APPROVED' : 'REJECTED',
          rating: status === 'approved' ? rating : null,
          comments: comments || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update verification');
      }

      toast.success(`Verification ${status}`);
      setSelectedVerification(null);
      setRating(1.0);
      setComments('');
      fetchVerifications();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    } finally {
      setProcessing(false);
    }
  };

  const handleIssueCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/issue`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to issue certificate');
      }

      toast.success('Certificate issued successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Error issuing certificate:', error);
      toast.error('Failed to issue certificate');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/organization/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel invitation');
      }

      toast.success('Invitation cancelled');
      fetchInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error('Failed to cancel invitation');
    }
  };

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'APPROVED':
      case 'ACCEPTED':
      case 'ACTIVE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REJECTED':
      case 'DECLINED':
      case 'EXPIRED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const filteredVerifications = verifications.filter((verification) =>
    verification.participation.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verification.participation.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCertificates = certificates.filter((certificate) =>
    certificate.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    certificate.event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvitations = invitations.filter((invitation) =>
    invitation.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage verifications, certificates, and invitations
          </p>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'verifications'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Verifications</span>
              {verificationFilter === 'pending' && verifications.length > 0 && (
                <Badge variant="secondary" className="ml-2">{verifications.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'certificates'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Certificates</span>
              {certificates.length > 0 && (
                <Badge variant="secondary" className="ml-2">{certificates.length}</Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'invitations'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Invitations</span>
              {invitationFilter === 'pending' && invitations.length > 0 && (
                <Badge variant="secondary" className="ml-2">{invitations.length}</Badge>
              )}
            </button>
          </div>

          {/* Verifications Tab */}
          {activeTab === 'verifications' && (
            <div className="space-y-6">
            {/* Filters & Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by participant or event..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setVerificationFilter('pending')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        verificationFilter === 'pending'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setVerificationFilter('approved')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        verificationFilter === 'approved'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => setVerificationFilter('rejected')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        verificationFilter === 'rejected'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Rejected
                    </button>
                    <button
                      onClick={() => setVerificationFilter('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        verificationFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verifications List */}
            {verificationsLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading verifications...</p>
                </CardContent>
              </Card>
            ) : filteredVerifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Verifications Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {verificationFilter === 'pending' 
                      ? 'There are no pending verifications at the moment.'
                      : `No ${verificationFilter} verifications found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredVerifications.map((verification) => (
                  <Card key={verification.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          {/* User Info */}
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={verification.participation.user.image || undefined} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                {verification.participation.user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {verification.participation.user.name || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Impact Score: {verification.participation.user.impactScore}
                              </p>
                            </div>
                            <Badge className={getStatusColor(verification.status)}>
                              {getStatusDisplay(verification.status)}
                            </Badge>
                          </div>

                          {/* Event Info */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {verification.participation.event.title}
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(verification.participation.event.startDate).toLocaleDateString()}</span>
                              </div>
                              {verification.participation.event.location && (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{verification.participation.event.location}</span>
                                </div>
                              )}
                              {verification.participation.hours && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{verification.participation.hours} hours</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Comments if any */}
                          {verification.comments && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Comments:</span> {verification.comments}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {verification.status === 'PENDING' && (
                          <div className="ml-4 flex flex-col space-y-2">
                            <Button
                              onClick={() => setSelectedVerification(verification)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by participant or event..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Certificates List */}
            {certificatesLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading certificates...</p>
                </CardContent>
              </Card>
            ) : filteredCertificates.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Certificates to Issue
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    All participants have been issued certificates.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredCertificates.map((certificate) => (
                  <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-4">
                          {/* User Info */}
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={certificate.user.image || undefined} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                {certificate.user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {certificate.user.name || 'Unknown User'}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {certificate.user.email}
                              </p>
                            </div>
                          </div>

                          {/* Event Info */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {certificate.event.title}
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(certificate.event.startDate).toLocaleDateString()}
                                  {certificate.event.endDate && ` - ${new Date(certificate.event.endDate).toLocaleDateString()}`}
                                </span>
                              </div>
                              {certificate.participation.hours && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{certificate.participation.hours} hours</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="ml-4">
                          <Button
                            onClick={() => handleIssueCertificate(certificate.id)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Issue Certificate
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
          )}

          {/* Invitations Tab */}
          {activeTab === 'invitations' && (
            <div className="space-y-6">
            {/* Filters & Search */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInvitationFilter('pending')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        invitationFilter === 'pending'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setInvitationFilter('accepted')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        invitationFilter === 'accepted'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Accepted
                    </button>
                    <button
                      onClick={() => setInvitationFilter('all')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        invitationFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invitations List */}
            {invitationsLoading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitations...</p>
                </CardContent>
              </Card>
            ) : filteredInvitations.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Invitations Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {invitationFilter === 'pending' 
                      ? 'There are no pending invitations at the moment.'
                      : `No ${invitationFilter} invitations found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredInvitations.map((invitation) => (
                  <Card key={invitation.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Invitation Info */}
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {invitation.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {invitation.email}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(invitation.status)}>
                              {getStatusDisplay(invitation.status)}
                            </Badge>
                          </div>

                          {/* Inviter Info */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Invited by: <span className="font-medium text-gray-900 dark:text-white">{invitation.inviter.name || invitation.inviter.email}</span>
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        {invitation.status === 'PENDING' && (
                          <div className="ml-4">
                            <Button
                              onClick={() => handleCancelInvitation(invitation.id)}
                              variant="outline"
                              className="px-4 py-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-6 h-6" />
                  <span>Verify Participation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User & Event Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={selectedVerification.participation.user.image || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg">
                        {selectedVerification.participation.user.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedVerification.participation.user.name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedVerification.participation.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      {selectedVerification.participation.event.title}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(selectedVerification.participation.event.startDate).toLocaleDateString()}</span>
                      </div>
                      {selectedVerification.participation.hours && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{selectedVerification.participation.hours} hours logged</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Quality Rating (0.5 - 1.5)
                  </label>
                  <div className="flex items-center space-x-4">
                    <Input
                      type="number"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={rating}
                      onChange={(e) => setRating(parseFloat(e.target.value))}
                      className="w-32"
                    />
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= rating 
                              ? 'text-yellow-500 fill-current' 
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    1.0 = Standard, &lt;1.0 = Below expectations, &gt;1.0 = Exceeded expectations
                  </p>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Comments (Optional)
                  </label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any comments about the participant's performance..."
                    rows={4}
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <Button
                    onClick={() => handleVerify(selectedVerification.id, 'approved')}
                    disabled={processing}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processing ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => handleVerify(selectedVerification.id, 'rejected')}
                    disabled={processing}
                    variant="outline"
                    className="flex-1 px-4 py-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {processing ? 'Processing...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedVerification(null);
                      setRating(1.0);
                      setComments('');
                    }}
                    disabled={processing}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
