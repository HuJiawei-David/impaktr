/**
 * Enhanced ESG Data Entry Form with Comprehensive Validation
 * 
 * This component integrates the complete validation system into the data entry process,
 * providing real-time validation feedback and comprehensive data quality assessment.
 */

'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
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
  RefreshCw,
  Shield,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Clock,
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Import form components
import EnvironmentalForm from '../forms/EnvironmentalForm';
import SocialForm from '../forms/SocialForm';
import GovernanceForm from '../forms/GovernanceForm';
import BatchUploadForm from '../forms/BatchUploadForm';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

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

interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  severityScore: number;
  category: 'format' | 'consistency' | 'trend' | 'benchmark' | 'public' | 'anomaly';
  recommendation?: string;
}

interface ValidationResult {
  validationId: string;
  summary: {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
    criticalIssues: number;
    warnings: number;
    infoItems: number;
  };
  results: {
    overallScore: number;
    isValid: boolean;
    allIssues: ValidationIssue[];
    allRecommendations: string[];
    validatorResults: any[];
  };
  validatedAt: string;
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

function EnhancedESGDataEntryContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLoading = status === 'loading';
  
  // Get the 'from' parameter to determine where user came from
  const fromParam = searchParams.get('from') || 'data-collection';
  
  const [activeTab, setActiveTab] = useState('environmental');
  
  // Confirm dialog
  const { showConfirm, ConfirmDialog } = useConfirmDialog();
  
  // Handle back navigation based on where user came from
  const handleBackNavigation = useCallback(() => {
    // Go back to ESG main page with data-collection tab active
    router.push('/organization/esg?tab=data-collection');
  }, [router]);
  const [formData, setFormData] = useState<ESGMetric[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationResults, setShowValidationResults] = useState(false);
  const [validationHistory, setValidationHistory] = useState<any[]>([]);
  const [triggerValidation, setTriggerValidation] = useState(false);

  // Get user's organization
  const fetchUserOrganization = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/organizations/user-organization');
      if (response.ok) {
        const data = await response.json();
        setOrganizationId(data.organizationId);
        if (data.organizationId) {
          fetchValidationHistory(data.organizationId);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  }, [session?.user]);

  const fetchValidationHistory = useCallback(async (orgId: string) => {
    try {
      const response = await fetch(`/api/organizations/esg-validation/history/${orgId}?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setValidationHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching validation history:', error);
    }
  }, []);

  const deleteValidationRecord = useCallback((validationId: string) => {
    const record = validationHistory.find(r => r.id === validationId);
    if (!record) return;
    
    showConfirm({
      title: 'Delete Validation Record',
      message: `Are you sure you want to delete this validation record? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete',
      onConfirm: async () => {
        if (!organizationId) {
          console.error('No organization ID available');
          return;
        }
        
        console.log('Attempting to delete validation record:', validationId);
        console.log('Organization ID:', organizationId);
        
        try {
          const url = `/api/organizations/esg-validation/${validationId}`;
          console.log('Making DELETE request to:', url);
          
          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log('Response status:', response.status);
          console.log('Response ok:', response.ok);
          
          if (response.ok) {
            // Remove the deleted record from local state
            setValidationHistory(prev => prev.filter(record => record.id !== validationId));
            console.log('Successfully deleted validation record');
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to delete validation record:', response.status, errorData);
            
            // Show user-friendly error message
            if (response.status === 404) {
              console.error('Validation record not found');
            } else if (response.status === 403) {
              console.error('Access denied - you do not have permission to delete this record');
            } else if (response.status === 401) {
              console.error('Unauthorized - please log in again');
            } else {
              console.error('Server error occurred while deleting validation record');
            }
          }
        } catch (error) {
          console.error('Error deleting validation record:', error);
        }
      }
    });
  }, [organizationId, validationHistory, showConfirm]);

  useEffect(() => {
    if (session?.user) {
      fetchUserOrganization();
    }
  }, [session?.user, fetchUserOrganization]);

  // Reset triggerValidation after it's been used
  useEffect(() => {
    if (triggerValidation) {
      const timer = setTimeout(() => {
        setTriggerValidation(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [triggerValidation]);

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

  // Comprehensive validation using the validation engine
  const runComprehensiveValidation = useCallback(async () => {
    if (!organizationId || formData.length === 0) {
      return;
    }

    // Check if all form data is empty (no meaningful data)
    const hasEmptyData = formData.every(dataPoint => 
      !dataPoint.metricName.trim() || 
      dataPoint.value === 0 || 
      !dataPoint.unit.trim() || 
      !dataPoint.period.trim()
    );

    if (hasEmptyData) {
      setValidationResult({
        validationId: 'empty-data',
        summary: {
          score: 0,
          status: 'invalid',
          criticalIssues: 1,
          warnings: 0,
          infoItems: 0
        },
        results: {
          overallScore: 0,
          isValid: false,
          allIssues: [{
            field: 'data_points',
            message: 'All data points are empty or incomplete',
            severity: 'error',
            severityScore: 10,
            category: 'format',
            recommendation: 'Please fill in the metric data before validation'
          }],
          allRecommendations: ['Fill in metric data before validation'],
          validatorResults: []
        },
        validatedAt: new Date().toISOString()
      });
      setShowValidationResults(true);
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch('/api/organizations/esg-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          dataPoints: formData,
          includeHistorical: true,
          includeBenchmarks: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setValidationResult(result.data);
        setShowValidationResults(true);
        
        // Update validation history
        if (organizationId) {
          fetchValidationHistory(organizationId);
        }
      } else {
        console.error('Validation failed:', result.error);
      }
    } catch (error) {
      console.error('Error running validation:', error);
    } finally {
      setIsValidating(false);
    }
  }, [organizationId, formData, fetchValidationHistory]);

  const handleSubmit = useCallback(async () => {
    if (!organizationId) {
      setUploadResult({
        success: false,
        message: 'Organization not found'
      });
      return;
    }

    // Trigger validation in all forms
    setTriggerValidation(true);
    
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
        // Keep form data visible after successful submission
        // setFormData([]); // Don't clear form data
        setValidationResult(null); // Clear validation results
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
    setValidationResult(null);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'invalid': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button 
              onClick={handleBackNavigation}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">ESG Data Entry with Validation</h1>
              <p className="text-muted-foreground">
                Enter environmental, social, and governance metrics with comprehensive validation
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status Banner */}
      {validationResult && (
        <Card className={`mb-6 ${getStatusColor(validationResult.summary.status)}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Validation Status: {validationResult.summary.status.toUpperCase()}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span>Score: {validationResult.summary.score}/100</span>
                <span>Critical: {validationResult.summary.criticalIssues}</span>
                <span>Warnings: {validationResult.summary.warnings}</span>
                <span>Info: {validationResult.summary.infoItems}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          onClick={runComprehensiveValidation}
          disabled={totalMetrics === 0 || isValidating}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          {isValidating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Run Validation
            </>
          )}
        </Button>
        
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
          <TabsTrigger 
            value="environmental"
            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:border-green-300 data-[state=active]:border-2"
          >
            Environmental
          </TabsTrigger>
          <TabsTrigger 
            value="social"
            className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:border-blue-300 data-[state=active]:border-2"
          >
            Social
          </TabsTrigger>
          <TabsTrigger 
            value="governance"
            className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:border-purple-300 data-[state=active]:border-2"
          >
            Governance
          </TabsTrigger>
          <TabsTrigger 
            value="batch"
            className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800 data-[state=active]:border-orange-300 data-[state=active]:border-2"
          >
            Batch Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="environmental" className="mt-6">
          <EnvironmentalForm 
            onDataChange={(data) => handleFormDataChange('environmental', data)}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
            existingData={formData.filter(item => item.category === 'environmental')}
            triggerValidation={triggerValidation}
          />
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <SocialForm 
            onDataChange={(data) => handleFormDataChange('social', data)}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
            existingData={formData.filter(item => item.category === 'social')}
            triggerValidation={triggerValidation}
          />
        </TabsContent>

        <TabsContent value="governance" className="mt-6">
          <GovernanceForm 
            onDataChange={(data) => handleFormDataChange('governance', data)}
            onValidationErrors={(errors) => handleValidationErrors(errors)}
            existingData={formData.filter(item => item.category === 'governance')}
            triggerValidation={triggerValidation}
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

      {/* Validation Results Dialog */}
      <Dialog open={showValidationResults} onOpenChange={setShowValidationResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Comprehensive Validation Results
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of your ESG data quality and recommendations for improvement
            </DialogDescription>
          </DialogHeader>

          {validationResult && (
            <div className="space-y-6">
              {/* Summary */}
              <Card className={getStatusColor(validationResult.summary.status)}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{validationResult.summary.score}</div>
                      <div className="text-sm">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{validationResult.summary.criticalIssues}</div>
                      <div className="text-sm">Critical Issues</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{validationResult.summary.warnings}</div>
                      <div className="text-sm">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{validationResult.summary.infoItems}</div>
                      <div className="text-sm">Info Items</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Issues */}
              {validationResult.results.allIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Validation Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {validationResult.results.allIssues.map((issue, index) => (
                        <Alert key={index} className={getSeverityColor(issue.severity)}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="font-medium">{issue.message}</div>
                            {issue.recommendation && (
                              <div className="text-sm mt-1">{issue.recommendation}</div>
                            )}
                            <div className="text-xs mt-1">
                              Category: {issue.category} | Severity: {issue.severity} ({issue.severityScore}/10)
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {validationResult.results.allRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {validationResult.results.allRecommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Validator Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Validator Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {validationResult.results.validatorResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{result.validatorId}</div>
                          <div className="text-sm text-muted-foreground">
                            Score: {result.score}/100 | Issues: {result.issues.length}
                          </div>
                        </div>
                        <Badge variant={result.isValid ? 'default' : 'destructive'}>
                          {result.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validation History */}
      {validationHistory.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Validation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationHistory.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Validation #{record.id.slice(-8)}</div>
                    <div className="text-sm text-muted-foreground">
                      Score: {record.validationScore}/100 | {new Date(record.validatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={record.isValid ? 'default' : 'destructive'}>
                      {record.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteValidationRecord(record.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
}

export default function EnhancedESGDataEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    }>
      <EnhancedESGDataEntryContent />
    </Suspense>
  );
}
