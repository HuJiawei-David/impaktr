'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Eye, 
  Download,
  Save,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import form components
import EnvironmentalForm from './forms/EnvironmentalForm';
import SocialForm from './forms/SocialForm';
import GovernanceForm from './forms/GovernanceForm';
import BatchUploadForm from './forms/BatchUploadForm';
import DataPreview from './preview/DataPreview';

interface ESGMetric {
  id?: string;
  category: 'environmental' | 'social' | 'governance';
  metricName: string;
  value: number;
  unit: string;
  period: string;
  reportedAt: string;
  notes?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: ValidationError[];
}

function ESGDataEntryContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoading = status === 'loading';
  
  // Get tab from URL search params
  const initialTab = searchParams.get('tab') || 'environmental';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState<ESGMetric[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Get user's organization
  const fetchUserOrganization = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/organizations/user-organization');
      if (response.ok) {
        const data = await response.json();
        setOrganizationId(data.organizationId);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  }, [session?.user]);

  React.useEffect(() => {
    if (session?.user) {
      fetchUserOrganization();
    }
  }, [session?.user, fetchUserOrganization]);

  const handleFormDataChange = useCallback((category: string, data: ESGMetric[]) => {
    setFormData(prev => {
      const filtered = prev.filter(item => item.category !== category);
      return [...filtered, ...data];
    });
  }, []);

  const handleValidationErrors = useCallback((errors: ValidationError[]) => {
    setValidationErrors(errors);
  }, []);

  const validateAllData = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    formData.forEach((item, index) => {
      if (!item.metricName.trim()) {
        errors.push({
          field: `data[${index}].metricName`,
          message: 'Metric name is required'
        });
      }
      
      if (!item.value || item.value <= 0) {
        errors.push({
          field: `data[${index}].value`,
          message: 'Value must be greater than 0'
        });
      }
      
      if (!item.unit.trim()) {
        errors.push({
          field: `data[${index}].unit`,
          message: 'Unit is required'
        });
      }
      
      if (!item.period.trim()) {
        errors.push({
          field: `data[${index}].period`,
          message: 'Period is required'
        });
      }
    });
    
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!organizationId) {
      setUploadResult({
        success: false,
        message: 'Organization not found'
      });
      return;
    }

    const errors = validateAllData();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setUploadResult({
        success: false,
        message: 'Please fix validation errors before submitting'
      });
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      const response = await fetch('/api/organizations/esg-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          metrics: formData
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${formData.length} metrics`,
          data: result.data
        });
        setFormData([]); // Clear form after successful submission
      } else {
        setUploadResult({
          success: false,
          message: result.message || 'Upload failed',
          errors: result.errors
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: 'Network error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [organizationId, formData, validateAllData]);

  const handleClearData = useCallback(() => {
    setFormData([]);
    setValidationErrors([]);
    setUploadResult(null);
  }, []);

  const handleExportTemplate = useCallback(() => {
    const template = [
      ['Category', 'Metric Name', 'Value', 'Unit', 'Period', 'Notes'],
      ['environmental', 'carbon_footprint', '1000', 'tons CO2/year', '2024', 'Annual carbon emissions'],
      ['social', 'employee_satisfaction', '85', '%', '2024-Q4', 'Employee satisfaction survey'],
      ['governance', 'policy_compliance', '95', '%', '2024', 'Policy compliance rate']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esg-metrics-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const totalMetrics = formData.length;
  const categoriesCount = {
    environmental: formData.filter(item => item.category === 'environmental').length,
    social: formData.filter(item => item.category === 'social').length,
    governance: formData.filter(item => item.category === 'governance').length
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ESG Data Entry</h1>
        <p className="text-muted-foreground">
          Enter environmental, social, and governance metrics for your organization
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Metrics</p>
                <p className="text-2xl font-bold">{totalMetrics}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Environmental</p>
                <p className="text-2xl font-bold text-green-600">{categoriesCount.environmental}</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">E</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Social</p>
                <p className="text-2xl font-bold text-blue-600">{categoriesCount.social}</p>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">S</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Governance</p>
                <p className="text-2xl font-bold text-purple-600">{categoriesCount.governance}</p>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700">G</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button 
          onClick={() => setShowPreview(true)} 
          disabled={totalMetrics === 0}
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Data ({totalMetrics})
        </Button>
        
        <Button 
          onClick={handleExportTemplate}
          variant="outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
        
        <Button 
          onClick={handleClearData}
          disabled={totalMetrics === 0}
          variant="outline"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Validation Errors:</div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Result */}
      {uploadResult && (
        <Alert className={`mb-6 ${uploadResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          {uploadResult.success ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={uploadResult.success ? 'text-green-800' : 'text-red-800'}>
            {uploadResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environmental">Environmental</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="environmental" className="mt-6">
          <EnvironmentalForm 
            onDataChange={(data) => handleFormDataChange('environmental', data)}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
            existingData={formData.filter(item => item.category === 'environmental')}
          />
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <SocialForm 
            onDataChange={(data) => handleFormDataChange('social', data)}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
            existingData={formData.filter(item => item.category === 'social')}
          />
        </TabsContent>

        <TabsContent value="governance" className="mt-6">
          <GovernanceForm 
            onDataChange={(data) => handleFormDataChange('governance', data)}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
            existingData={formData.filter(item => item.category === 'governance')}
          />
        </TabsContent>

        <TabsContent value="batch" className="mt-6">
          <BatchUploadForm 
            onDataChange={(data) => {
              setFormData(prev => [...prev, ...data]);
            }}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
          />
        </TabsContent>
      </Tabs>

      {/* Submit Section */}
      {totalMetrics > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Save className="h-5 w-5 mr-2" />
              Submit Data
            </CardTitle>
            <CardDescription>
              Review and submit {totalMetrics} metrics to your organization's ESG profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground">
                  Ready to submit {totalMetrics} metrics
                </div>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    E: {categoriesCount.environmental}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    S: {categoriesCount.social}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700">
                    G: {categoriesCount.governance}
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || validationErrors.length > 0}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview Modal */}
      {showPreview && (
        <DataPreview 
          data={formData}
          onClose={() => setShowPreview(false)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default function ESGDataEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }>
      <ESGDataEntryContent />
    </Suspense>
  );
}
