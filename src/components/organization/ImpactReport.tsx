'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Eye, Calendar } from 'lucide-react';

interface ImpactReportProps {
  organizationId: string;
}

export default function ImpactReport({ organizationId }: ImpactReportProps) {
  const [reportType, setReportType] = useState('quarterly');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q4');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch('/api/organizations/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          reportType,
          period: selectedPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impact-report-${selectedPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Report generated successfully!');
    } catch (error) {
      console.error('Generate report error:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const reportTypes = [
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'quarterly', label: 'Quarterly Report' },
    { value: 'annual', label: 'Annual Report' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const periods = [
    '2024-Q4',
    '2024-Q3',
    '2024-Q2',
    '2024-Q1',
    '2023-Q4',
    '2023-Q3',
  ];

  // Mock previous reports
  const previousReports = [
    {
      id: '1',
      title: '2024 Q3 Impact Report',
      period: '2024-Q3',
      generatedAt: '2024-10-05',
      fileSize: '2.4 MB',
    },
    {
      id: '2',
      title: '2024 Q2 Impact Report',
      period: '2024-Q2',
      generatedAt: '2024-07-08',
      fileSize: '2.1 MB',
    },
    {
      id: '3',
      title: '2024 Q1 Impact Report',
      period: '2024-Q1',
      generatedAt: '2024-04-10',
      fileSize: '1.9 MB',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Generate New Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span>Generate Impact Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map(period => (
                    <SelectItem key={period} value={period}>
                      {period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Report will include:
            </h4>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Executive Summary & Key Metrics</li>
              <li>• ESG Performance Breakdown</li>
              <li>• Team Participation Analytics</li>
              <li>• Carbon Footprint Analysis</li>
              <li>• Volunteer Hours & Community Impact</li>
              <li>• Progress on SDG Goals</li>
              <li>• Industry Benchmarking</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate PDF Report'}
            </Button>
            <Button variant="outline" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Previous Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {previousReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <FileText className=" h-6 w-6 text-blue-600 dark:text-blue-400" />
</div>
<div>
<p className="font-semibold text-gray-900 dark:text-white">
{report.title}
</p>
<div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
<span className="flex items-center space-x-1">
<Calendar className="h-4 w-4" />
<span>{new Date(report.generatedAt).toLocaleDateString()}</span>
</span>
<span>{report.fileSize}</span>
</div>
</div>
</div>
<div className="flex items-center space-x-2">
<Button variant="outline" size="sm">
<Eye className="h-4 w-4 mr-1" />
View
</Button>
<Button variant="outline" size="sm">
<Download className="h-4 w-4 mr-1" />
Download
</Button>
</div>
</div>
))}
</div>
</CardContent>
</Card>
</div>
);
}