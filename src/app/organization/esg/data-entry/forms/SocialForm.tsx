'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

interface SocialFormProps {
  onDataChange: (data: ESGMetric[]) => void;
  onValidationErrors: (errors: ValidationError[]) => void;
  existingData: ESGMetric[];
  triggerValidation?: boolean;
}

const SOCIAL_METRICS = [
  { name: 'employee_satisfaction', label: 'Employee Satisfaction', unit: '%', description: 'Employee satisfaction survey score' },
  { name: 'employee_survey', label: 'Employee Survey Response', unit: '%', description: 'Employee survey response rate' },
  { name: 'employee_engagement', label: 'Employee Engagement', unit: 'score', description: 'Employee engagement index score' },
  { name: 'employee_turnover', label: 'Employee Turnover', unit: '%', description: 'Annual employee turnover rate' },
  { name: 'diversity_index', label: 'Diversity Index', unit: 'score', description: 'Workforce diversity index' },
  { name: 'gender_diversity', label: 'Gender Diversity', unit: '%', description: 'Percentage of women in workforce' },
  { name: 'ethnic_diversity', label: 'Ethnic Diversity', unit: 'score', description: 'Ethnic diversity score' },
  { name: 'training_hours', label: 'Training Hours', unit: 'hours/employee', description: 'Average training hours per employee' },
  { name: 'employee_training', label: 'Employee Training', unit: '%', description: 'Percentage of employees receiving training' },
  { name: 'skill_development', label: 'Skill Development', unit: 'score', description: 'Skill development program score' },
  { name: 'community_hours', label: 'Community Hours', unit: 'hours', description: 'Total community service hours' },
  { name: 'volunteer_hours', label: 'Volunteer Hours', unit: 'hours', description: 'Total volunteer hours' },
  { name: 'community_impact', label: 'Community Impact', unit: 'score', description: 'Community impact assessment score' },
  { name: 'health_safety', label: 'Health & Safety', unit: 'score', description: 'Workplace health and safety score' },
  { name: 'work_life_balance', label: 'Work-Life Balance', unit: 'score', description: 'Work-life balance satisfaction score' },
  { name: 'employee_benefits', label: 'Employee Benefits', unit: 'score', description: 'Employee benefits satisfaction score' }
];

const PERIODS = [
  '2024',
  '2024-Q1',
  '2024-Q2', 
  '2024-Q3',
  '2024-Q4',
  '2023',
  '2023-Q1',
  '2023-Q2',
  '2023-Q3',
  '2023-Q4'
];

export default function SocialForm({ onDataChange, onValidationErrors, existingData, triggerValidation }: SocialFormProps) {
  const [metrics, setMetrics] = useState<ESGMetric[]>(existingData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [shouldValidate, setShouldValidate] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update metrics only on initial load, not on every existingData change
  useEffect(() => {
    if (!isInitialized) {
      setMetrics(existingData);
      setIsInitialized(true);
    }
  }, [existingData, isInitialized]);

  // Use refs to avoid infinite re-renders
  const onDataChangeRef = useRef(onDataChange);
  const onValidationErrorsRef = useRef(onValidationErrors);

  // Update refs when props change
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  useEffect(() => {
    onValidationErrorsRef.current = onValidationErrors;
  }, [onValidationErrors]);

  useEffect(() => {
    onDataChangeRef.current(metrics);
  }, [metrics]);

  useEffect(() => {
    onValidationErrorsRef.current(errors);
  }, [errors]);

  const addMetric = () => {
    const newMetric: ESGMetric = {
      category: 'social',
      metricName: '',
      value: 0,
      unit: '',
      period: '2024',
      reportedAt: new Date().toISOString().split('T')[0],
      notes: ''
    };
    setMetrics(prev => [...prev, newMetric]);
    setShouldValidate(false); // Reset validation state when adding new metric
    setErrors([]); // Clear existing errors
  };

  const removeMetric = (index: number) => {
    setMetrics(prev => prev.filter((_, i) => i !== index));
  };

  const updateMetric = (index: number, field: keyof ESGMetric, value: any) => {
    setMetrics(prev => prev.map((metric, i) => 
      i === index ? { ...metric, [field]: value } : metric
    ));
  };

  const validateMetrics = (): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    
    metrics.forEach((metric, index) => {
      if (!metric.metricName.trim()) {
        validationErrors.push({
          field: `metricName_${index}`,
          message: 'Metric name is required'
        });
      }
      
      if (!metric.value || metric.value <= 0) {
        validationErrors.push({
          field: `value_${index}`,
          message: 'Value must be greater than 0'
        });
      }
      
      if (!metric.unit.trim()) {
        validationErrors.push({
          field: `unit_${index}`,
          message: 'Unit is required'
        });
      }
      
      if (!metric.period.trim()) {
        validationErrors.push({
          field: `period_${index}`,
          message: 'Period is required'
        });
      }
    });
    
    return validationErrors;
  };

  useEffect(() => {
    onValidationErrorsRef.current(errors);
  }, [errors]);

  // Trigger validation when requested from parent
  useEffect(() => {
    if (triggerValidation) {
      setShouldValidate(true);
    }
  }, [triggerValidation]);

  useEffect(() => {
    if (shouldValidate) {
      const validationErrors = validateMetrics();
      setErrors(validationErrors);
    }
  }, [metrics, shouldValidate]);

  const getMetricInfo = (metricName: string) => {
    return SOCIAL_METRICS.find(m => m.name === metricName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
            Social Metrics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter social data including employee satisfaction, diversity, training, and community impact
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, index) => {
              const metricInfo = getMetricInfo(metric.metricName);
              const hasError = shouldValidate && errors.some(e => e.field.includes(`_${index}`));
              
              return (
                <Card key={index} className={`${hasError ? 'border-red-200 bg-red-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Metric {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMetric(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Metric Name */}
                      <div className="space-y-2">
                        <Label htmlFor={`metricName_${index}`}>Metric Name *</Label>
                        <Select
                          value={metric.metricName}
                          onValueChange={(value) => {
                            updateMetric(index, 'metricName', value);
                            const info = getMetricInfo(value);
                            if (info) {
                              updateMetric(index, 'unit', info.unit);
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            {SOCIAL_METRICS.map((m) => (
                              <SelectItem key={m.name} value={m.name}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {metricInfo && (
                          <p className="text-xs text-muted-foreground">{metricInfo.description}</p>
                        )}
                      </div>

                      {/* Value */}
                      <div className="space-y-2">
                        <Label htmlFor={`value_${index}`}>Value *</Label>
                        <Input
                          id={`value_${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={metric.value || ''}
                          onChange={(e) => updateMetric(index, 'value', parseFloat(e.target.value) || 0)}
                          placeholder="Enter value"
                        />
                      </div>

                      {/* Unit */}
                      <div className="space-y-2">
                        <Label htmlFor={`unit_${index}`}>Unit *</Label>
                        <Input
                          id={`unit_${index}`}
                          value={metric.unit}
                          onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                          placeholder="Enter unit"
                        />
                      </div>

                      {/* Period */}
                      <div className="space-y-2">
                        <Label htmlFor={`period_${index}`}>Period *</Label>
                        <Select
                          value={metric.period}
                          onValueChange={(value) => updateMetric(index, 'period', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                          <SelectContent>
                            {PERIODS.map((period) => (
                              <SelectItem key={period} value={period}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Reported Date */}
                      <div className="space-y-2">
                        <Label htmlFor={`reportedAt_${index}`}>Reported Date *</Label>
                        <Input
                          id={`reportedAt_${index}`}
                          type="date"
                          value={metric.reportedAt}
                          onChange={(e) => updateMetric(index, 'reportedAt', e.target.value)}
                        />
                      </div>

                      {/* Notes */}
                      <div className="space-y-2 md:col-span-2 lg:col-span-3">
                        <Label htmlFor={`notes_${index}`}>Notes</Label>
                        <Textarea
                          id={`notes_${index}`}
                          value={metric.notes || ''}
                          onChange={(e) => updateMetric(index, 'notes', e.target.value)}
                          placeholder="Additional notes or context"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Validation Errors */}
                    {hasError && (
                      <Alert className="mt-4" variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {errors
                            .filter(e => e.field.includes(`_${index}`))
                            .map((error, i) => (
                              <div key={i}>{error.message}</div>
                            ))
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {metrics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No social metrics added yet.</p>
                <p className="text-sm">Click "Add Metric" to start entering data.</p>
              </div>
            )}

            <Button onClick={addMetric} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Social Metric
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Add Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {SOCIAL_METRICS.slice(0, 6).map((metric) => (
              <Button
                key={metric.name}
                variant="outline"
                size="sm"
                onClick={() => {
                  const newMetric: ESGMetric = {
                    category: 'social',
                    metricName: metric.name,
                    value: 0,
                    unit: metric.unit,
                    period: '2024',
                    reportedAt: new Date().toISOString().split('T')[0],
                    notes: ''
                  };
                  setMetrics(prev => [...prev, newMetric]);
                  setShouldValidate(false); // Reset validation state when adding new metric
                  setErrors([]); // Clear existing errors
                }}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium text-sm">{metric.label}</div>
                  <div className="text-xs text-muted-foreground">{metric.unit}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
