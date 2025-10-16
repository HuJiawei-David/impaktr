// home/ubuntu/impaktrweb/src/app/organizations/[id]/certificates/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { 
  Award, 
  Download, 
  Plus, 
  Edit3, 
  Eye, 
  Share2,
  Users,
  Calendar,
  FileText,
  Palette,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';
import { CertificatePreview } from '@/components/certificates/CertificatePreview';
import { BulkCertificateGenerator } from '@/components/certificates/BulkCertificateGenerator';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  isDefault: boolean;
  createdAt: string;
  usageCount: number;
}

interface Organization {
  id: string;
  name: string;
  logo: string;
  subscriptionPlan: string;
}

export default function OrganizationCertificatesPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const params = useParams();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [activeTab, setActiveTab] = useState('templates');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'participation',
    category: 'participation',
    template: {},
    isDefault: false,
    isActive: true,
  });

  useEffect(() => {
    if (params?.id) {
      fetchOrganization();
      fetchCertificateTemplates();
    }
  }, [params?.id]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${params?.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const fetchCertificateTemplates = async () => {
    try {
      const response = await fetch(`/api/organizations/${params?.id}/certificate-templates`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateTemplate = () => {
    setIsCreating(true);
    setActiveTab('create');
  };

  const handleSaveTemplate = async (templateData: {
    name: string;
    description?: string;
    type: string;
    category?: string;
    template: Record<string, unknown>;
    isDefault?: boolean;
    isActive?: boolean;
  }) => {
    try {
      const response = await fetch(`/api/organizations/${params?.id}/certificate-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(prev => [...prev, data.template]);
        setIsCreating(false);
        setActiveTab('templates');
      }
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const canManageCertificates = organization?.subscriptionPlan !== 'basic';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Award className="w-8 h-8 mr-3 text-primary" />
              Certificate Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage digital certificates for {organization?.name}
            </p>
          </div>
          
          {canManageCertificates && (
            <Button onClick={handleCreateTemplate} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          )}
        </div>

        {/* Subscription Check */}
        {!canManageCertificates && (
          <Card className="mb-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Award className="w-8 h-8 text-orange-500" />
                <div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                    Upgrade Required
                  </h3>
                  <p className="text-orange-700 dark:text-orange-300">
                    Custom certificate templates are available with Pro and Enterprise plans.
                  </p>
                  <Button className="mt-3" size="sm">
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="create" disabled={!canManageCertificates}>Create</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Certificate Templates</h2>
              <div className="flex items-center space-x-4">
                <Input 
                  placeholder="Search templates..." 
                  className="w-64"
                />
                <Select>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Templates</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Users className="w-4 h-4 mr-1" />
                      <span>Used {template.usageCount} times</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Default Templates */}
              <Card className="border-dashed border-2">
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Standard Template</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional certificate template with your branding
                  </p>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Create Template Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create Certificate Template</CardTitle>
                <CardDescription>
                  Create a new certificate template for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    placeholder="Enter template name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="templateDescription">Description</Label>
                  <Textarea
                    id="templateDescription"
                    placeholder="Enter template description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveTemplate(newTemplate)}>
                    Save Template
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setActiveTab('templates');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Generate Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <BulkCertificateGenerator
              organizationId={params?.id as string}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certificates Issued</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">2,847</div>
                  <p className="text-sm text-muted-foreground">
                    +23% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Most Popular Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold mb-1">Event Participation</div>
                  <p className="text-sm text-muted-foreground">
                    1,456 certificates issued
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn Shares</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1,234</div>
                  <p className="text-sm text-muted-foreground">
                    43% of certificates shared
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Certificate Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Generation Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/30 rounded flex items-center justify-center">
                  <p className="text-muted-foreground">Chart placeholder - would show certificate generation trends</p>
                </div>
              </CardContent>
            </Card>

            {/* Template Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Template Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Created on {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{template.usageCount}</div>
                        <div className="text-sm text-muted-foreground">certificates</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}