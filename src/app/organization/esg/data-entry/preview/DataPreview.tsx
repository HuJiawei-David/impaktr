'use client';

import React from 'react';
import { X, CheckCircle, AlertCircle, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface DataPreviewProps {
  data: ESGMetric[];
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function DataPreview({ data, onClose, onSubmit, isSubmitting }: DataPreviewProps) {
  const categoriesCount = {
    environmental: data.filter(item => item.category === 'environmental').length,
    social: data.filter(item => item.category === 'social').length,
    governance: data.filter(item => item.category === 'governance').length
  };

  const totalMetrics = data.length;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'social':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'governance':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'environmental':
        return '🌱';
      case 'social':
        return '👥';
      case 'governance':
        return '⚖️';
      default:
        return '📊';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Data Preview & Confirmation
          </DialogTitle>
          <DialogDescription>
            Review your ESG metrics before submitting to your organization's profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{totalMetrics}</div>
                <div className="text-sm text-muted-foreground">Total Metrics</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{categoriesCount.environmental}</div>
                <div className="text-sm text-muted-foreground">Environmental</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{categoriesCount.social}</div>
                <div className="text-sm text-muted-foreground">Social</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{categoriesCount.governance}</div>
                <div className="text-sm text-muted-foreground">Governance</div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Metrics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Metric Name</th>
                      <th className="text-left p-2">Value</th>
                      <th className="text-left p-2">Unit</th>
                      <th className="text-left p-2">Period</th>
                      <th className="text-left p-2">Reported Date</th>
                      <th className="text-left p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((metric, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <Badge className={getCategoryColor(metric.category)}>
                            <span className="mr-1">{getCategoryIcon(metric.category)}</span>
                            {metric.category}
                          </Badge>
                        </td>
                        <td className="p-2 font-medium">{metric.metricName}</td>
                        <td className="p-2">{metric.value}</td>
                        <td className="p-2">{metric.unit}</td>
                        <td className="p-2">{metric.period}</td>
                        <td className="p-2">{metric.reportedAt}</td>
                        <td className="p-2 max-w-xs truncate" title={metric.notes}>
                          {metric.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Environmental */}
            {categoriesCount.environmental > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <span className="mr-2">🌱</span>
                    Environmental ({categoriesCount.environmental})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data
                      .filter(item => item.category === 'environmental')
                      .map((metric, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm font-medium">{metric.metricName}</span>
                          <span className="text-sm text-green-600">
                            {metric.value} {metric.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social */}
            {categoriesCount.social > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <span className="mr-2">👥</span>
                    Social ({categoriesCount.social})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data
                      .filter(item => item.category === 'social')
                      .map((metric, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <span className="text-sm font-medium">{metric.metricName}</span>
                          <span className="text-sm text-blue-600">
                            {metric.value} {metric.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Governance */}
            {categoriesCount.governance > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700">
                    <span className="mr-2">⚖️</span>
                    Governance ({categoriesCount.governance})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data
                      .filter(item => item.category === 'governance')
                      .map((metric, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-purple-50 rounded">
                          <span className="text-sm font-medium">{metric.metricName}</span>
                          <span className="text-sm text-purple-600">
                            {metric.value} {metric.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Data Quality Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Data Quality Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">All metrics have valid names</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All values are positive numbers</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All units are specified</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All periods are valid</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All reported dates are valid</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submission Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Once submitted, this data will be added to your organization's ESG profile 
              and will be used for ESG score calculations. Please ensure all information is accurate before proceeding.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Ready to submit {totalMetrics} metrics
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
