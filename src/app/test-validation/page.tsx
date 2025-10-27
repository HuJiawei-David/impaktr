'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';

export default function TestValidationPage() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-validation');
      const data = await response.json();

      if (data.success) {
        setTestResults(data.results);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run tests');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ESG Validation System Test Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing of all 6 validators and validation workflows
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Validation Tests</CardTitle>
          <CardDescription>
            Test the complete ESG data validation system including all validators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <PlayCircle className="h-5 w-5 mr-2" />
                Run All Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-medium mb-1">Test Failed</div>
            <div className="text-sm">{error}</div>
          </AlertDescription>
        </Alert>
      )}

      {testResults && (
        <div className="space-y-6">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {testResults.overall.status === 'PASSED' ? (
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 mr-2 text-red-600" />
                )}
                Overall Status: {testResults.overall.status}
              </CardTitle>
              <CardDescription>
                Test run completed at {new Date(testResults.timestamp).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-700 mb-1">Total Validators</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {testResults.overall.summary.totalValidators}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-700 mb-1">Validators Working</div>
                  <div className="text-2xl font-bold text-green-900">
                    {testResults.overall.summary.validatorsWorking}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-purple-700 mb-1">Valid Data Score</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {testResults.overall.summary.validDataScore}/100
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm font-medium text-orange-700 mb-1">Issues Detected</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {testResults.overall.summary.invalidDataIssuesFound}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registered Validators */}
          <Card>
            <CardHeader>
              <CardTitle>Registered Validators ({testResults.validatorsRegistered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testResults.validatorsRegistered.map((validator: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold">{validator.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{validator.description}</div>
                        <Badge variant="outline" className="mt-2">{validator.id}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults.tests.map((test: any, testIndex: number) => (
            <Card key={testIndex}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {test.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                  )}
                  {test.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {test.aggregated && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <Badge 
                          variant={test.aggregated.isValid ? 'default' : 'destructive'}
                          className="text-base px-4 py-1"
                        >
                          {test.aggregated.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Score: </span>
                        <span className="text-lg font-semibold">{test.aggregated.overallScore}/100</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Issues: </span>
                        <span className="text-lg font-semibold">{test.aggregated.totalIssues}</span>
                      </div>
                    </div>

                    {test.aggregated.issues && test.aggregated.issues.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Issues Found:</div>
                        <div className="space-y-2">
                          {test.aggregated.issues.map((issue: any, issueIndex: number) => (
                            <div 
                              key={issueIndex} 
                              className={`p-3 rounded-lg border ${
                                issue.severity === 'error' ? 'bg-red-50 border-red-200' :
                                issue.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex items-start">
                                <Badge 
                                  variant="outline" 
                                  className="mr-2"
                                >
                                  {issue.severity}
                                </Badge>
                                <div className="flex-1">
                                  <div className="font-medium">{issue.message}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Field: {issue.field} | Category: {issue.category}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {test.summary && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium mb-2">Summary</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Status</div>
                            <div className="font-semibold text-lg uppercase">{test.summary.status}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Critical Issues</div>
                            <div className="font-semibold text-lg text-red-600">{test.summary.criticalIssues}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Warnings</div>
                            <div className="font-semibold text-lg text-yellow-600">{test.summary.warnings}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Info</div>
                            <div className="font-semibold text-lg text-blue-600">{test.summary.infoItems}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {test.validators && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium mb-2">
                      Success Rate: {test.successRate}
                    </div>
                    {test.validators.map((validator: any, validatorIndex: number) => (
                      <div 
                        key={validatorIndex}
                        className={`p-3 rounded-lg border ${
                          validator.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {validator.success ? (
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-red-600" />
                            )}
                            <span className="font-medium">{validator.validator}</span>
                          </div>
                          {validator.success && (
                            <div className="flex items-center space-x-4">
                              <Badge variant="outline">Score: {validator.score}/100</Badge>
                              <Badge variant="outline">Issues: {validator.issuesCount}</Badge>
                            </div>
                          )}
                          {!validator.success && validator.error && (
                            <span className="text-sm text-red-600">{validator.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {test.validatorResults && (
                  <div className="space-y-2 mt-4">
                    <div className="text-sm font-medium">Validator Results:</div>
                    {test.validatorResults.map((result: any, resultIndex: number) => (
                      <div key={resultIndex} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{result.validatorId}</Badge>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">Score: {result.score}/100</span>
                            <span className="text-sm">Issues: {result.issuesCount}</span>
                            {result.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

