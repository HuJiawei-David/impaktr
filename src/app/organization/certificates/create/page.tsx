// home/ubuntu/impaktrweb/src/app/organization/certificates/create/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  Award, 
  Upload, 
  Users, 
  Calendar, 
  Palette, 
  Eye, 
  Download,
  Save,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SDGSelector } from '@/components/ui/sdg-selector';
import Link from 'next/link';

interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  category: 'modern' | 'classic' | 'minimal' | 'elegant';
  colors: string[];
}

interface CertificateFormData {
  title: string;
  description: string;
  recipientField: string; // What field to use for recipient name
  eventId?: string;
  templateId: string;
  customization: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoPosition: 'top' | 'top-left' | 'top-right' | 'center';
    includeQRCode: boolean;
    includeBorder: boolean;
    backgroundPattern: string;
  };
  requirements: {
    minHours?: number;
    completionRate?: number;
    sdgTags?: number[];
    skills?: string[];
  };
  validity: {
    expiresAfter?: number; // months
    verificationRequired: boolean;
  };
  automation: {
    autoIssue: boolean;
    issueOnCompletion: boolean;
    emailNotification: boolean;
  };
}

const certificateTemplates: CertificateTemplate[] = [
  {
    id: 'modern-1',
    name: 'Modern Impact',
    description: 'Clean, modern design with SDG colors',
    preview: '/templates/modern-1.png',
    category: 'modern',
    colors: ['#0ea5e9', '#3b82f6', '#6366f1']
  },
  {
    id: 'classic-1',
    name: 'Classic Achievement',
    description: 'Traditional certificate design',
    preview: '/templates/classic-1.png',
    category: 'classic',
    colors: ['#dc2626', '#b91c1c', '#991b1b']
  },
  {
    id: 'minimal-1',
    name: 'Minimal Clean',
    description: 'Simple, elegant design',
    preview: '/templates/minimal-1.png',
    category: 'minimal',
    colors: ['#000000', '#374151', '#6b7280']
  },
  {
    id: 'elegant-1',
    name: 'Elegant Gold',
    description: 'Premium design with gold accents',
    preview: '/templates/elegant-1.png',
    category: 'elegant',
    colors: ['#f59e0b', '#d97706', '#b45309']
  }
];

export default function CreateCertificatePage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [organizationEvents, setOrganizationEvents] = useState([]);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CertificateFormData>({
    defaultValues: {
      recipientField: 'participant_name',
      customization: {
        primaryColor: '#0ea5e9',
        secondaryColor: '#3b82f6',
        fontFamily: 'Inter',
        logoPosition: 'top',
        includeQRCode: true,
        includeBorder: true,
        backgroundPattern: 'none'
      },
      automation: {
        autoIssue: false,
        issueOnCompletion: true,
        emailNotification: true
      },
      validity: {
        verificationRequired: true
      }
    }
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      redirect('/auth/signin');
      return;
    }

    // Check if user has organization permissions
    // This would check the user's role/permissions
    fetchOrganizationEvents();
  }, [session, status]);

  const fetchOrganizationEvents = async () => {
    try {
      const response = await fetch('/api/organization/events');
      if (response.ok) {
        const data = await response.json();
        setOrganizationEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const onSubmit = async (data: CertificateFormData) => {
    setIsLoading(true);
    
    try {
      const certificateData = {
        ...data,
        requirements: {
          ...data.requirements,
          sdgTags: selectedSDGs
        }
      };

      const response = await fetch('/api/organization/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificateData),
      });

      if (!response.ok) {
        throw new Error('Failed to create certificate template');
      }

      const result = await response.json();
      
      // Redirect to certificate management
      window.location.href = '/organization/certificates';
      
    } catch (error) {
      console.error('Error creating certificate:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
    // Generate preview with current form data
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/organization/certificates">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Certificates
              </Button>
            </Link>
            
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Award className="w-8 h-8 mr-3 text-primary" />
                Create Certificate Template
              </h1>
              <p className="text-muted-foreground">
                Design and customize certificates for your organization's events and achievements
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                // Save as draft
                console.log('Saving as draft...');
              }}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Certificate Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Certificate Title *</Label>
                    <Input
                      id="title"
                      {...register('title', { required: 'Title is required' })}
                      placeholder="e.g., Environmental Action Volunteer Certificate"
                      error={errors.title?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Describe what this certificate represents..."
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventId">Associated Event (Optional)</Label>
                      <Select onValueChange={(value) => setValue('eventId', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no_event">No specific event</SelectItem>
                          {organizationEvents.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="recipientField">Recipient Name Field</Label>
                      <Select 
                        value={watch('recipientField')}
                        onValueChange={(value) => setValue('recipientField', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="participant_name">Participant Name</SelectItem>
                          <SelectItem value="full_name">Full Name</SelectItem>
                          <SelectItem value="display_name">Display Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Issuance Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minHours">Minimum Hours Required</Label>
                      <Input
                        id="minHours"
                        type="number"
                        {...register('requirements.minHours')}
                        placeholder="e.g., 10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="completionRate">Completion Rate (%)</Label>
                      <Input
                        id="completionRate"
                        type="number"
                        min="0"
                        max="100"
                        {...register('requirements.completionRate')}
                        placeholder="e.g., 90"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">SDG Focus Areas</Label>
                    <SDGSelector
                      selectedSDGs={selectedSDGs}
                      onSelectionChange={setSelectedSDGs}
                      maxSelection={5}
                      compact={true}
                    />
                  </div>

                  <div>
                    <Label htmlFor="skills">Required Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      {...register('requirements.skills')}
                      placeholder="e.g., Leadership, Teamwork, Communication"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Automation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Automation & Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-issue certificates</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically issue when requirements are met
                      </p>
                    </div>
                    <Switch
                      checked={watch('automation.autoIssue')}
                      onCheckedChange={(checked) => setValue('automation.autoIssue', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Issue on event completion</Label>
                      <p className="text-sm text-muted-foreground">
                        Issue when participant completes associated event
                      </p>
                    </div>
                    <Switch
                      checked={watch('automation.issueOnCompletion')}
                      onCheckedChange={(checked) => setValue('automation.issueOnCompletion', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email when certificate is issued
                      </p>
                    </div>
                    <Switch
                      checked={watch('automation.emailNotification')}
                      onCheckedChange={(checked) => setValue('automation.emailNotification', checked)}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiresAfter">Expires After (months)</Label>
                      <Input
                        id="expiresAfter"
                        type="number"
                        {...register('validity.expiresAfter')}
                        placeholder="Leave empty for no expiration"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Verification required</Label>
                        <p className="text-sm text-muted-foreground">
                          Require verification before issuing
                        </p>
                      </div>
                      <Switch
                        checked={watch('validity.verificationRequired')}
                        onCheckedChange={(checked) => setValue('validity.verificationRequired', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Template Selection & Customization */}
            <div className="space-y-6">
              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Certificate Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="templates" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="templates">Templates</TabsTrigger>
                      <TabsTrigger value="customize">Customize</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="templates" className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {certificateTemplates.map((template) => (
                          <div
                            key={template.id}
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${
                              selectedTemplate?.id === template.id
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => {
                              setSelectedTemplate(template);
                              setValue('templateId', template.id);
                            }}
                          >
                            <div className="aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h4 className="font-medium text-sm">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                            <div className="flex space-x-1 mt-2">
                              {template.colors.map((color, index) => (
                                <div
                                  key={index}
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="customize" className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="primaryColor">Primary Color</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="primaryColor"
                              type="color"
                              {...register('customization.primaryColor')}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              {...register('customization.primaryColor')}
                              className="flex-1"
                              placeholder="#0ea5e9"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="fontFamily">Font Family</Label>
                          <Select 
                            value={watch('customization.fontFamily')}
                            onValueChange={(value) => setValue('customization.fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                              <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                              <SelectItem value="Merriweather">Merriweather</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="logoPosition">Logo Position</Label>
                          <Select 
                            value={watch('customization.logoPosition')}
                            onValueChange={(value) => setValue('customization.logoPosition', value as any)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Top Center</SelectItem>
                              <SelectItem value="top-left">Top Left</SelectItem>
                              <SelectItem value="top-right">Top Right</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Include QR Code</Label>
                            <Switch
                              checked={watch('customization.includeQRCode')}
                              onCheckedChange={(checked) => setValue('customization.includeQRCode', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label>Include Border</Label>
                            <Switch
                              checked={watch('customization.includeBorder')}
                              onCheckedChange={(checked) => setValue('customization.includeBorder', checked)}
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Certificate preview will appear here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Changes are automatically saved as drafts</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/organization/certificates">
                <Button variant="outline">
                  Cancel
                </Button>
              </Link>
              
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Certificate Template'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}