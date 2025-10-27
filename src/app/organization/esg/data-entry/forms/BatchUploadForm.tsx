'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

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

interface BatchUploadFormProps {
  onDataChange: (data: ESGMetric[]) => void;
  onValidationErrors: (errors: ValidationError[]) => void;
}

interface ParsedData {
  data: ESGMetric[];
  errors: ValidationError[];
  warnings: string[];
}

export default function BatchUploadForm({ onDataChange, onValidationErrors }: BatchUploadFormProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (csvFile) {
      processFile(csvFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      const text = await file.text();
      const result = parseCSV(text);
      
      setParsedData(result);
      onDataChange(result.data);
      onValidationErrors(result.errors);
      
      setUploadProgress(100);
    } catch (error) {
      console.error('Error processing file:', error);
      setParsedData({
        data: [],
        errors: [{ field: 'file', message: 'Error reading file' }],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (csvText: string): ParsedData => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const data: ESGMetric[] = [];

    if (lines.length < 2) {
      errors.push({
        field: 'file',
        message: 'CSV file must have at least a header row and one data row'
      });
      return { data, errors, warnings };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['category', 'metric name', 'value', 'unit', 'period'];
    
    // Check headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      errors.push({
        field: 'headers',
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      });
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push({
          field: `row_${i}`,
          message: `Row ${i}: Number of values doesn't match headers`
        });
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate and create metric
      const metric: ESGMetric = {
        category: row.category as 'environmental' | 'social' | 'governance',
        metricName: row['metric name'] || '',
        value: parseFloat(row.value) || 0,
        unit: row.unit || '',
        period: row.period || '',
        reportedAt: row['reported date'] || new Date().toISOString().split('T')[0],
        notes: row.notes || ''
      };

      // Validate metric
      if (!metric.category || !['environmental', 'social', 'governance'].includes(metric.category)) {
        errors.push({
          field: `row_${i}_category`,
          message: `Row ${i}: Invalid category. Must be environmental, social, or governance`
        });
      }

      if (!metric.metricName.trim()) {
        errors.push({
          field: `row_${i}_metricName`,
          message: `Row ${i}: Metric name is required`
        });
      }

      if (!metric.value || metric.value <= 0) {
        errors.push({
          field: `row_${i}_value`,
          message: `Row ${i}: Value must be greater than 0`
        });
      }

      if (!metric.unit.trim()) {
        errors.push({
          field: `row_${i}_unit`,
          message: `Row ${i}: Unit is required`
        });
      }

      if (!metric.period.trim()) {
        errors.push({
          field: `row_${i}_period`,
          message: `Row ${i}: Period is required`
        });
      }

      data.push(metric);
    }

    return { data, errors, warnings };
  };

  const downloadTemplate = () => {
    const template = [
      ['Category', 'Metric Name', 'Value', 'Unit', 'Period', 'Reported Date', 'Notes'],
      ['environmental', 'carbon_footprint', '1000', 'tons CO2/year', '2024', '2024-01-15', 'Annual carbon emissions'],
      ['social', 'employee_satisfaction', '85', '%', '2024-Q4', '2024-12-31', 'Employee satisfaction survey'],
      ['governance', 'policy_compliance', '95', '%', '2024', '2024-01-01', 'Policy compliance rate']
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esg-metrics-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    setParsedData(null);
    onDataChange([]);
    onValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Batch Upload
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload multiple ESG metrics at once using a CSV file
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragOver ? 'Drop your CSV file here' : 'Upload CSV File'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop your CSV file, or click to browse
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isProcessing}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </div>

            {/* Processing Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Template Download */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Need a template?</p>
                <p className="text-sm text-muted-foreground">
                  Download our CSV template to get started
                </p>
              </div>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            {/* Parsed Data Results */}
            {parsedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Upload Results
                    </span>
                    <Button onClick={clearData} variant="ghost" size="sm">
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{parsedData.data.length}</div>
                        <div className="text-sm text-green-700">Metrics</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{parsedData.errors.length}</div>
                        <div className="text-sm text-red-700">Errors</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{parsedData.warnings.length}</div>
                        <div className="text-sm text-yellow-700">Warnings</div>
                      </div>
                    </div>

                    {/* Errors */}
                    {parsedData.errors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-2">Validation Errors:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {parsedData.errors.map((error, index) => (
                              <li key={index}>{error.message}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Warnings */}
                    {parsedData.warnings.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium mb-2">Warnings:</div>
                          <ul className="list-disc list-inside space-y-1">
                            {parsedData.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Success Message */}
                    {parsedData.errors.length === 0 && parsedData.data.length > 0 && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Successfully parsed {parsedData.data.length} metrics from CSV file
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Data Preview */}
                    {parsedData.data.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Data Preview:</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left">Category</th>
                                <th className="px-3 py-2 text-left">Metric</th>
                                <th className="px-3 py-2 text-left">Value</th>
                                <th className="px-3 py-2 text-left">Unit</th>
                                <th className="px-3 py-2 text-left">Period</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedData.data.slice(0, 10).map((metric, index) => (
                                <tr key={index} className="border-t">
                                  <td className="px-3 py-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      metric.category === 'environmental' ? 'bg-green-100 text-green-700' :
                                      metric.category === 'social' ? 'bg-blue-100 text-blue-700' :
                                      'bg-purple-100 text-purple-700'
                                    }`}>
                                      {metric.category}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">{metric.metricName}</td>
                                  <td className="px-3 py-2">{metric.value}</td>
                                  <td className="px-3 py-2">{metric.unit}</td>
                                  <td className="px-3 py-2">{metric.period}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedData.data.length > 10 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground bg-gray-50">
                              ... and {parsedData.data.length - 10} more metrics
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV Format Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Required columns:</strong> Category, Metric Name, Value, Unit, Period</p>
            <p><strong>Optional columns:</strong> Reported Date, Notes</p>
            <p><strong>Categories:</strong> environmental, social, governance</p>
            <p><strong>Values:</strong> Must be numeric and greater than 0</p>
            <p><strong>Periods:</strong> Use format like "2024", "2024-Q1", "2024-Q2", etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
