// home/ubuntu/impaktrweb/src/components/certificates/BulkCertificateGenerator.tsx

'use client';

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Users, 
  Award,
  Calendar,
  CheckCircle,
  AlertCircle,
  X,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';

interface Participant {
  id: string;
  name: string;
  email: string;
  hours?: number;
  role?: string;
  achievements?: string[];
  status: 'pending' | 'generated' | 'sent' | 'error';
  certificateUrl?: string;
  error?: string;
}

interface CertificateTemplate {
  id: string;
  name: string;
  type: 'participation' | 'completion' | 'achievement' | 'volunteer' | 'custom';
  description: string;
  fields: string[];
}

interface BulkCertificateGeneratorProps {
  eventId?: string;
  organizationId: string;
  onClose?: () => void;
}

const certificateTemplates: CertificateTemplate[] = [
  {
    id: 'participation',
    name: 'Event Participation',
    type: 'participation',
    description: 'Standard certificate for event participation',
    fields: ['name', 'event', 'date', 'hours', 'organizer']
  },
  {
    id: 'volunteer',
    name: 'Volunteer Recognition',
    type: 'volunteer',
    description: 'Certificate recognizing volunteer contributions',
    fields: ['name', 'organization', 'hours', 'period', 'achievements']
  },
  {
    id: 'completion',
    name: 'Program Completion',
    type: 'completion',
    description: 'Certificate for completing a program or course',
    fields: ['name', 'program', 'duration', 'skills', 'grade']
  },
  {
    id: 'achievement',
    name: 'Special Achievement',
    type: 'achievement',
    description: 'Certificate for special achievements or milestones',
    fields: ['name', 'achievement', 'date', 'description', 'impact']
  }
];

export function BulkCertificateGenerator({ eventId, organizationId, onClose }: BulkCertificateGeneratorProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [certificateData, setCertificateData] = useState({
    title: '',
    description: '',
    issueDate: new Date().toISOString().split('T')[0],
    organizationName: '',
    signatoryName: '',
    signatoryTitle: '',
    customMessage: '',
    includeLogo: true,
    includeQR: true,
    autoEmail: false
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newParticipants: Participant[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2 || !values[0]) continue;

        const nameIndex = headers.findIndex(h => h.includes('name'));
        const emailIndex = headers.findIndex(h => h.includes('email'));
        const hoursIndex = headers.findIndex(h => h.includes('hour'));
        const roleIndex = headers.findIndex(h => h.includes('role'));

        newParticipants.push({
          id: `participant-${i}`,
          name: values[nameIndex] || values[0],
          email: values[emailIndex] || values[1],
          hours: hoursIndex >= 0 ? parseFloat(values[hoursIndex]) || 0 : undefined,
          role: roleIndex >= 0 ? values[roleIndex] : undefined,
          status: 'pending'
        });
      }

      setParticipants(newParticipants);
      setActiveTab('configure');
      toast.success(`Imported ${newParticipants.length} participants`);
    } catch (error) {
      toast.error('Error parsing CSV file');
    }
  };

  const handleManualAdd = () => {
    const newParticipant: Participant = {
      id: `manual-${Date.now()}`,
      name: '',
      email: '',
      status: 'pending'
    };
    setParticipants([...participants, newParticipant]);
  };

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handlePreview = async () => {
    if (participants.length === 0 || !selectedTemplate) {
      toast.error('Please select participants and template');
      return;
    }

    // Create preview data with first participant
    const sampleParticipant = participants[0];
    const template = certificateTemplates.find(t => t.id === selectedTemplate);
    
    setPreviewData({
      participant: sampleParticipant,
      template,
      certificateData
    });
    
    setActiveTab('preview');
  };

  const generateCertificates = async () => {
    if (participants.length === 0 || !selectedTemplate) {
      toast.error('Please select participants and template');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const template = certificateTemplates.find(t => t.id === selectedTemplate);
      let completed = 0;

      for (const participant of participants) {
        try {
          // Update participant status
          updateParticipant(participant.id, { status: 'pending' });

          // Generate certificate
          const response = await fetch('/api/certificates/bulk-generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              participant,
              template: selectedTemplate,
              certificateData: {
                ...certificateData,
                organizationId,
                eventId
              }
            })
          });

          if (response.ok) {
            const result = await response.json();
            updateParticipant(participant.id, {
              status: 'generated',
              certificateUrl: result.certificateUrl
            });

            // Send email if auto-email is enabled
            if (certificateData.autoEmail) {
              await fetch('/api/certificates/send-email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  participantId: participant.id,
                  certificateUrl: result.certificateUrl,
                  eventTitle: certificateData.title
                })
              });
              updateParticipant(participant.id, { status: 'sent' });
            }
          } else {
            const error = await response.json();
            updateParticipant(participant.id, {
              status: 'error',
              error: error.message
            });
          }
        } catch (error) {
          updateParticipant(participant.id, {
            status: 'error',
            error: 'Failed to generate certificate'
          });
        }

        completed++;
        setGenerationProgress((completed / participants.length) * 100);
      }

      toast.success(`Generated ${completed} certificates`);
      setActiveTab('results');
    } catch (error) {
      toast.error('Error generating certificates');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAllCertificates = async () => {
    const successfulCertificates = participants.filter(p => p.certificateUrl);
    
    if (successfulCertificates.length === 0) {
      toast.error('No certificates available for download');
      return;
    }

    // Create a zip file with all certificates
    const response = await fetch('/api/certificates/bulk-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        certificateUrls: successfulCertificates.map(p => ({
          url: p.certificateUrl,
          filename: `${p.name.replace(/[^a-zA-Z0-9]/g, '_')}_certificate.pdf`
        }))
      })
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificates_${certificateData.title.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      toast.error('Error downloading certificates');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'generated':
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Award className="w-6 h-6 mr-2" />
                Bulk Certificate Generator
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Generate and distribute certificates to multiple participants at once
              </p>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upload">Upload Data</TabsTrigger>
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* CSV Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Upload className="w-5 h-5 mr-2" />
                      Upload CSV File
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>CSV File with Participant Data</Label>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        CSV should include columns: name, email, hours (optional), role (optional)
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Sample CSV Format:</h4>
                      <pre className="text-xs text-muted-foreground">
{`name,email,hours,role
John Doe,john@example.com,5,Volunteer
Jane Smith,jane@example.com,8,Team Lead`}
                      </pre>
                    </div>

                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Choose CSV File
                    </Button>
                  </CardContent>
                </Card>

                {/* Manual Entry */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Manual Entry
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {participants.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {participants.map((participant) => (
                          <div key={participant.id} className="flex items-center space-x-2 p-2 border rounded">
                            <Input
                              placeholder="Name"
                              value={participant.name}
                              onChange={(e) => updateParticipant(participant.id, { name: e.target.value })}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Email"
                              type="email"
                              value={participant.email}
                              onChange={(e) => updateParticipant(participant.id, { email: e.target.value })}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeParticipant(participant.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button onClick={handleManualAdd} variant="outline" className="w-full">
                      Add Participant
                    </Button>

                    {participants.length > 0 && (
                      <div className="text-center">
                        <Badge variant="secondary">
                          {participants.length} participant{participants.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {participants.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab('configure')}>
                    Continue to Configuration
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="configure" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Certificate Template */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Certificate Template</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {certificateTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all ${
                          selectedTemplate === template.id
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-accent/50'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">{template.description}</p>
                            </div>
                            {selectedTemplate === template.id && (
                              <CheckCircle className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.fields.map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>

                {/* Certificate Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Certificate Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Certificate Title</Label>
                      <Input
                        id="title"
                        value={certificateData.title}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Environmental Cleanup Volunteer"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={certificateData.description}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Brief description of the activity or achievement"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issueDate">Issue Date</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={certificateData.issueDate}
                          onChange={(e) => setCertificateData(prev => ({ ...prev, issueDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="organizationName">Organization Name</Label>
                        <Input
                          id="organizationName"
                          value={certificateData.organizationName}
                          onChange={(e) => setCertificateData(prev => ({ ...prev, organizationName: e.target.value }))}
                          placeholder="Your organization name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="signatoryName">Signatory Name</Label>
                        <Input
                          id="signatoryName"
                          value={certificateData.signatoryName}
                          onChange={(e) => setCertificateData(prev => ({ ...prev, signatoryName: e.target.value }))}
                          placeholder="Name of person signing"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signatoryTitle">Signatory Title</Label>
                        <Input
                          id="signatoryTitle"
                          value={certificateData.signatoryTitle}
                          onChange={(e) => setCertificateData(prev => ({ ...prev, signatoryTitle: e.target.value }))}
                          placeholder="e.g., Director, Manager"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                      <Textarea
                        id="customMessage"
                        value={certificateData.customMessage}
                        onChange={(e) => setCertificateData(prev => ({ ...prev, customMessage: e.target.value }))}
                        placeholder="Additional message to include on certificates"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Include Organization Logo</Label>
                          <p className="text-sm text-muted-foreground">Add your organization's logo</p>
                        </div>
                        <Switch
                          checked={certificateData.includeLogo}
                          onCheckedChange={(checked) => setCertificateData(prev => ({ ...prev, includeLogo: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Include QR Code</Label>
                          <p className="text-sm text-muted-foreground">For certificate verification</p>
                        </div>
                        <Switch
                          checked={certificateData.includeQR}
                          onCheckedChange={(checked) => setCertificateData(prev => ({ ...prev, includeQR: checked }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-send via Email</Label>
                          <p className="text-sm text-muted-foreground">Automatically email certificates to participants</p>
                        </div>
                        <Switch
                          checked={certificateData.autoEmail}
                          onCheckedChange={(checked) => setCertificateData(prev => ({ ...prev, autoEmail: checked }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('upload')}>
                  Back
                </Button>
                <div className="space-x-2">
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button onClick={generateCertificates} disabled={!selectedTemplate || isGenerating}>
                    Generate Certificates
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate Preview</CardTitle>
                  <p className="text-muted-foreground">
                    Preview shows how the certificate will look with sample data
                  </p>
                </CardHeader>
                <CardContent>
                  {previewData ? (
                    <div className="bg-white border-2 border-gray-300 p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
                      <div className="text-center space-y-4">
                        <div className="border-b-2 border-primary pb-4">
                          <h1 className="text-3xl font-bold text-primary">Certificate of {previewData.template?.name}</h1>
                          <p className="text-muted-foreground">Presented by {certificateData.organizationName}</p>
                        </div>
                        
                        <div className="space-y-6 py-8">
                          <p className="text-lg">This certificate is proudly presented to</p>
                          <h2 className="text-4xl font-bold text-primary">{previewData.participant.name}</h2>
                          <p className="text-lg">{certificateData.description}</p>
                          
                          {previewData.participant.hours && (
                            <p className="text-md">
                              Contributing <strong>{previewData.participant.hours} hours</strong> of dedicated service
                            </p>
                          )}
                          
                          {certificateData.customMessage && (
                            <p className="italic text-muted-foreground">{certificateData.customMessage}</p>
                          )}
                        </div>
                        
                        <div className="border-t-2 border-primary pt-4 flex justify-between items-end">
                          <div>
                            <div className="border-b border-gray-400 w-48 mb-2"></div>
                            <p className="text-sm">{certificateData.signatoryName}</p>
                            <p className="text-xs text-muted-foreground">{certificateData.signatoryTitle}</p>
                          </div>
                          
                          <div>
                            <p className="text-sm">Date: {new Date(certificateData.issueDate).toLocaleDateString()}</p>
                            {certificateData.includeQR && (
                              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center mt-2">
                                <span className="text-xs">QR Code</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Configure the certificate to see preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('configure')}>
                  Back to Configuration
                </Button>
                <Button onClick={generateCertificates} disabled={!selectedTemplate || isGenerating}>
                  Generate All Certificates
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {isGenerating && (
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Generating Certificates...</h3>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(generationProgress)}% complete
                        </span>
                      </div>
                      <Progress value={generationProgress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generation Results</CardTitle>
                    <div className="space-x-2">
                      {participants.some(p => p.certificateUrl) && (
                        <Button onClick={downloadAllCertificates}>
                          <Download className="w-4 h-4 mr-2" />
                          Download All
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(participant.status)}
                          <div>
                            <p className="font-medium">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                            {participant.error && (
                              <p className="text-sm text-red-600">{participant.error}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(participant.status)}>
                            {participant.status}
                          </Badge>
                          
                          {participant.certificateUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(participant.certificateUrl, '_blank')}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {participants.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No certificates generated yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('configure')}>
                  Generate More
                </Button>
                <Button onClick={onClose}>
                  Done
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}