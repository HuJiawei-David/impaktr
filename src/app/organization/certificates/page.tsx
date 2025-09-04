// home/ubuntu/impaktrweb/src/app/organization/certificates/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Award, 
  Plus, 
  Download,
  Eye,
  Edit,
  Copy,
  Send,
  Users,
  Calendar,
  BarChart3,
  FileText,
  Palette,
  Settings,
  Search,
  Filter,
  Share2,
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';
import { formatDate, formatTimeAgo, getInitials } from '@/lib/utils';

interface Certificate {
  id: string;
  title: string;
  description: string;
  template: {
    id: string;
    name: string;
    preview: string;
    customization: {
      primaryColor: string;
      secondaryColor: string;
      logo: string;
      backgroundImage?: string;
    };
  };
  event?: {
    id: string;
    title: string;
    startDate: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  issuedAt: string;
  downloadCount: number;
  linkedInShared: boolean;
  status: 'ISSUED' | 'PENDING' | 'REVOKED';
  type: 'participation' | 'achievement' | 'completion' | 'custom';
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'participation' | 'achievement' | 'completion' | 'custom';
  isActive: boolean;
  usageCount: number;
  customization: {
    allowColorChange: boolean;
    allowLogoChange: boolean;
    allowBackgroundChange: boolean;
    requiredFields: string[];
  };
}

interface CertificateStats {
  totalIssued: number;
  totalDownloads: number;
  totalTemplates: number;
  linkedInShares: number;
  recentIssued: number;
  avgDownloadsPerCertificate: number;
}

export default function OrganizationCertificatesPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [stats, setStats] = useState<CertificateStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('issued');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [isBulkIssueOpen, setIsBulkIssueOpen] = useState(false);

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'participation' as const,
    customization: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#64748b',
      allowColorChange: true,
      allowLogoChange: true,
      allowBackgroundChange: false,
      requiredFields: ['recipientName', 'eventTitle', 'issueDate'] as string[]
    }
  });

  const [bulkIssue, setBulkIssue] = useState({
    templateId: '',
    eventId: '',
    recipients: [] as Array<{ name: string; email: string; customData?: any }>,
    customMessage: ''
  });

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/api/auth/login');
      return;
    }

    if (user) {
      fetchCertificatesData();
    }
  }, [isLoading, user]);

  const fetchCertificatesData = async () => {
    try {
      const [certificatesResponse, templatesResponse, statsResponse] = await Promise.all([
        fetch('/api/organization/certificates'),
        fetch('/api/organization/certificates/templates'),
        fetch('/api/organization/certificates/stats')
      ]);

      if (certificatesResponse.ok && templatesResponse.ok && statsResponse.ok) {
        const [certificatesData, templatesData, statsData] = await Promise.all([
          certificatesResponse.json(),
          templatesResponse.json(),
          statsResponse.json()
        ]);

        setCertificates(certificatesData.certificates);
        setTemplates(templatesData.templates);
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching certificates data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/organization/certificates/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        setIsCreateTemplateOpen(false);
        setNewTemplate({
          name: '',
          description: '',
          category: 'participation',
          customization: {
            primaryColor: '#0ea5e9',
            secondaryColor: '#64748b',
            allowColorChange: true,
            allowLogoChange: true,
            allowBackgroundChange: false,
            requiredFields: ['recipientName', 'eventTitle', 'issueDate']
          }
        });
        fetchCertificatesData();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleBulkIssueCertificates = async () => {
    try {
      const response = await fetch('/api/organization/certificates/bulk-issue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkIssue),
      });

      if (response.ok) {
        setIsBulkIssueOpen(false);
        setBulkIssue({
          templateId: '',
          eventId: '',
          recipients: [],
          customMessage: ''
        });
        fetchCertificatesData();
      }
    } catch (error) {
      console.error('Error issuing certificates:', error);
    }
  };

  const handleRevokeCertificate = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/organization/certificates/${certificateId}/revoke`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchCertificatesData();
      }
    } catch (error) {
      console.error('Error revoking certificate:', error);
    }
  };

  const handleTemplateToggle = async (templateId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/organization/certificates/templates/${templateId}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        fetchCertificatesData();
      }
    } catch (error) {
      console.error('Error toggling template:', error);
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cert.recipient?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || cert.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filterCertificatesByTab = (certList: Certificate[], tab: string) => {
    switch (tab) {
      case 'issued':
        return certList.filter(cert => cert.status === 'ISSUED');
      case 'pending':
        return certList.filter(cert => cert.status === 'PENDING');
      default:
        return certList;
    }
  };

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
            <Award className="w-8 h-8 mr-3" />
            Certificates Management
          </h1>
          <p className="text-muted-foreground">
            Create templates and issue verified impact certificates
          </p>
        </div>

        <div className="flex space-x-3">
          <Dialog open={isBulkIssueOpen} onOpenChange={setIsBulkIssueOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Bulk Issue
              </Button>
            </DialogTrigger>
          </Dialog>

          <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIssued || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{stats?.recentIssued || 0}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDownloads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.avgDownloadsPerCertificate.toFixed(1)} avg per certificate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.filter(t => t.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalTemplates || 0} total templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LinkedIn Shares</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.linkedInShares || 0}</div>
            <p className="text-xs text-muted-foreground">
              Professional visibility
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="issued">Issued Certificates</TabsTrigger>
          <TabsTrigger value="templates">Certificate Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Issued Certificates Tab */}
        <TabsContent value="issued" className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search certificates or recipients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="participation">Participation</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certificates List */}
          <div className="space-y-4">
            {filterCertificatesByTab(filteredCertificates, 'issued').map((certificate) => (
              <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {/* Certificate Preview */}
                      <div className="w-16 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-primary" />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-lg">{certificate.title}</h3>
                          <p className="text-muted-foreground">{certificate.description}</p>
                        </div>

                        {certificate.recipient && (
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={certificate.recipient.avatar} />
                              <AvatarFallback className="text-xs">
                                {getInitials(certificate.recipient.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {certificate.recipient.name} • {certificate.recipient.email}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <Badge variant="secondary">{certificate.type}</Badge>
                          <span>Issued {formatTimeAgo(certificate.issuedAt)}</span>
                          <span>{certificate.downloadCount} downloads</span>
                          {certificate.linkedInShared && (
                            <Badge variant="outline" className="text-blue-600">
                              LinkedIn Shared
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="w-4 h-4 mr-2" />
                          Resend Email
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        {certificate.status === 'ISSUED' && (
                          <DropdownMenuItem 
                            onClick={() => handleRevokeCertificate(certificate.id)}
                            className="text-destructive"
                          >
                            Revoke Certificate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredCertificates.length === 0 && (
              <Card>
                <CardContent className="py-16 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No certificates issued yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating a template and issuing certificates to your participants
                  </p>
                  <Button onClick={() => setIsCreateTemplateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Template
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant={template.category === 'participation' ? 'default' : 'secondary'}>
                        {template.category}
                      </Badge>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTemplateToggle(template.id, template.isActive)}>
                          {template.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* Template Preview */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <div className="text-sm font-medium">Certificate Preview</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-4">{template.description}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage Count</span>
                      <span className="font-medium">{template.usageCount}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={template.isActive ? 'default' : 'outline'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Button className="w-full" size="sm">
                        Use Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Create New Template Card */}
            <Card className="border-dashed border-2 hover:border-primary transition-colors cursor-pointer" 
                  onClick={() => setIsCreateTemplateOpen(true)}>
              <CardContent className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Create New Template</h3>
                  <p className="text-muted-foreground text-sm">
                    Design a custom certificate template for your organization
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Certificate Issuance Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Issuance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chart placeholder - Monthly issuance data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Most Popular Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .slice(0, 5)
                    .map((template, index) => (
                      <div key={template.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{template.usageCount}</div>
                          <div className="text-sm text-muted-foreground">uses</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Download Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Download Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Downloads</span>
                    <span className="text-2xl font-bold">{stats?.totalDownloads}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average per Certificate</span>
                    <span className="text-lg font-semibold">{stats?.avgDownloadsPerCertificate.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>LinkedIn Shares</span>
                    <span className="text-lg font-semibold">{stats?.linkedInShares}</span>
                  </div>
                  <Progress 
                    value={(stats?.linkedInShares || 0) / (stats?.totalIssued || 1) * 100} 
                    className="h-2" 
                  />
                  <p className="text-sm text-muted-foreground">
                    {Math.round((stats?.linkedInShares || 0) / (stats?.totalIssued || 1) * 100)}% of certificates shared on LinkedIn
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Impact Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Recognition Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats?.totalIssued}</div>
                    <div className="text-sm text-muted-foreground">Lives Recognized</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{templates.length}</div>
                    <div className="text-sm text-muted-foreground">Active Programs</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{stats?.linkedInShares}</div>
                    <div className="text-sm text-muted-foreground">Professional Shares</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{Math.round((stats?.totalDownloads || 0) / (stats?.totalIssued || 1) * 100)}%</div>
                    <div className="text-sm text-muted-foreground">Download Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Template Modal */}
      <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Certificate Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                placeholder="e.g. Event Participation Certificate"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="templateDesc">Description</Label>
              <Textarea
                id="templateDesc"
                placeholder="Describe when this template should be used..."
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="templateCategory">Category</Label>
              <Select 
                value={newTemplate.category} 
                onValueChange={(value: any) => setNewTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participation">Participation</SelectItem>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="completion">Completion</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Customization */}
            <div className="space-y-4">
              <h3 className="font-semibold">Template Customization</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <Input
                    id="primaryColor"
                    type="color"
                    value={newTemplate.customization.primaryColor}
                    onChange={(e) => setNewTemplate(prev => ({
                      ...prev,
                      customization: { ...prev.customization, primaryColor: e.target.value }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={newTemplate.customization.secondaryColor}
                    onChange={(e) => setNewTemplate(prev => ({
                      ...prev,
                      customization: { ...prev.customization, secondaryColor: e.target.value }
                    }))}
                  />
                </div>
              </div>

              {/* Template Preview */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h4 className="font-medium mb-2">Preview</h4>
                <div 
                  className="aspect-[4/3] rounded-lg flex items-center justify-center text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${newTemplate.customization.primaryColor}, ${newTemplate.customization.secondaryColor})` 
                  }}
                >
                  <div className="text-center">
                    <Award className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">{newTemplate.name || 'Certificate Title'}</div>
                    <div className="text-sm opacity-90">{newTemplate.category} Certificate</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>
                Create Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Issue Modal */}
      <Dialog open={isBulkIssueOpen} onOpenChange={setIsBulkIssueOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Issue Certificates</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="bulkTemplate">Select Template</Label>
              <Select value={bulkIssue.templateId} onValueChange={(value) => setBulkIssue(prev => ({ ...prev, templateId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.isActive).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulkEvent">Related Event (Optional)</Label>
              <Select value={bulkIssue.eventId} onValueChange={(value) => setBulkIssue(prev => ({ ...prev, eventId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific event</SelectItem>
                  {/* Event options would be loaded from API */}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipientsList">Recipients</Label>
              <Textarea
                id="recipientsList"
                placeholder="Enter recipient emails, one per line:&#10;john@example.com&#10;jane@example.com"
                className="h-32"
                onChange={(e) => {
                  const emails = e.target.value.split('\n').filter(email => email.trim());
                  setBulkIssue(prev => ({
                    ...prev,
                    recipients: emails.map(email => ({ name: email.split('@')[0], email: email.trim() }))
                  }));
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {bulkIssue.recipients.length} recipients ready
              </p>
            </div>

            <div>
              <Label htmlFor="customMessage">Custom Message (Optional)</Label>
              <Textarea
                id="customMessage"
                placeholder="Add a personal message to include in the certificate email..."
                value={bulkIssue.customMessage}
                onChange={(e) => setBulkIssue(prev => ({ ...prev, customMessage: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsBulkIssueOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBulkIssueCertificates}
                disabled={!bulkIssue.templateId || bulkIssue.recipients.length === 0}
              >
                Issue {bulkIssue.recipients.length} Certificates
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
                      