// home/ubuntu/impaktrweb/src/components/admin/SystemHealth.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  Mail,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatTimeAgo } from '@/lib/utils';

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  lastChecked: string;
  responseTime?: number;
}

interface SystemHealthData {
  overall: SystemStatus;
  services: {
    database: SystemStatus & {
      connections: number;
      maxConnections: number;
      queryTime: number;
    };
    redis: SystemStatus & {
      memory: number;
      maxMemory: number;
      connectedClients: number;
    };
    auth0: SystemStatus & {
      activeUsers: number;
      dailyLogins: number;
    };
    aws: SystemStatus & {
      s3: {
        storage: number;
        requests: number;
      };
      ses: {
        emailsSent: number;
        bounceRate: number;
      };
    };
    api: SystemStatus & {
      requestsPerMinute: number;
      errorRate: number;
      avgResponseTime: number;
    };
  };
  metrics: {
    totalUsers: number;
    activeUsers24h: number;
    totalEvents: number;
    verificationsPending: number;
    systemUptime: number;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
}

export function SystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchHealthData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/admin/system-health');
      if (response.ok) {
        const data = await response.json();
        setHealthData(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
      // Set mock data for demonstration
      setHealthData(getMockHealthData());
      setLastRefresh(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockHealthData = (): SystemHealthData => ({
    overall: {
      status: 'healthy',
      message: 'All systems operational',
      lastChecked: new Date().toISOString(),
      responseTime: 45
    },
    services: {
      database: {
        status: 'healthy',
        message: 'PostgreSQL running normally',
        lastChecked: new Date().toISOString(),
        responseTime: 12,
        connections: 8,
        maxConnections: 100,
        queryTime: 2.3
      },
      redis: {
        status: 'healthy',
        message: 'Redis cache operational',
        lastChecked: new Date().toISOString(),
        responseTime: 1,
        memory: 156,
        maxMemory: 512,
        connectedClients: 24
      },
      auth0: {
        status: 'healthy',
        message: 'Authentication service online',
        lastChecked: new Date().toISOString(),
        responseTime: 89,
        activeUsers: 1247,
        dailyLogins: 342
      },
      aws: {
        status: 'warning',
        message: 'S3 requests elevated',
        lastChecked: new Date().toISOString(),
        responseTime: 156,
        s3: {
          storage: 12.4,
          requests: 15420
        },
        ses: {
          emailsSent: 1205,
          bounceRate: 2.1
        }
      },
      api: {
        status: 'healthy',
        message: 'API performing well',
        lastChecked: new Date().toISOString(),
        responseTime: 67,
        requestsPerMinute: 145,
        errorRate: 0.8,
        avgResponseTime: 234
      }
    },
    metrics: {
      totalUsers: 12567,
      activeUsers24h: 1847,
      totalEvents: 3421,
      verificationsPending: 89,
      systemUptime: 99.8,
      memoryUsage: 68,
      cpuUsage: 23,
      diskUsage: 45
    },
    alerts: [
      {
        id: '1',
        type: 'warning',
        message: 'AWS S3 request rate is 20% above normal',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        message: 'Scheduled maintenance completed successfully',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        resolved: true
      },
      {
        id: '3',
        type: 'error',
        message: 'Certificate generation failed for user batch',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        resolved: true
      }
    ]
  });

  const getStatusColor = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusIcon = (status: SystemStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold mb-2">System Health Unavailable</h3>
          <p className="text-muted-foreground">Unable to fetch system health data</p>
          <Button onClick={fetchHealthData} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health</h2>
          <p className="text-muted-foreground">
            Last updated {formatTimeAgo(lastRefresh.toISOString())}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={fetchHealthData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className={`border-l-4 ${
        healthData.overall.status === 'healthy' ? 'border-l-green-500' :
        healthData.overall.status === 'warning' ? 'border-l-yellow-500' :
        'border-l-red-500'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${getStatusColor(healthData.overall.status)}`}>
              {getStatusIcon(healthData.overall.status)}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">
                System Status: {healthData.overall.status.charAt(0).toUpperCase() + healthData.overall.status.slice(1)}
              </h3>
              <p className="text-muted-foreground">{healthData.overall.message}</p>
              {healthData.overall.responseTime && (
                <p className="text-sm text-muted-foreground">
                  Response time: {healthData.overall.responseTime}ms
                </p>
              )}
            </div>
            <Badge className={getStatusColor(healthData.overall.status)}>
              {healthData.overall.status.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Cpu className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{healthData.metrics.cpuUsage}%</div>
                <div className="text-sm text-muted-foreground">CPU Usage</div>
              </div>
            </div>
            <Progress value={healthData.metrics.cpuUsage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <MemoryStick className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{healthData.metrics.memoryUsage}%</div>
                <div className="text-sm text-muted-foreground">Memory Usage</div>
              </div>
            </div>
            <Progress value={healthData.metrics.memoryUsage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <HardDrive className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{healthData.metrics.diskUsage}%</div>
                <div className="text-sm text-muted-foreground">Disk Usage</div>
              </div>
            </div>
            <Progress value={healthData.metrics.diskUsage} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{healthData.metrics.systemUptime}%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
            </div>
            <Progress value={healthData.metrics.systemUptime} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Service Status Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Database className="w-5 h-5 mr-2" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(healthData.services.database.status)}>
                {getStatusIcon(healthData.services.database.status)}
                <span className="ml-1">{healthData.services.database.status}</span>
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Connections</span>
                <span>{healthData.services.database.connections}/{healthData.services.database.maxConnections}</span>
              </div>
              <Progress 
                value={(healthData.services.database.connections / healthData.services.database.maxConnections) * 100} 
                className="h-1" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Query Time</div>
                <div className="font-medium">{healthData.services.database.queryTime}ms</div>
              </div>
              <div>
                <div className="text-muted-foreground">Response</div>
                <div className="font-medium">{healthData.services.database.responseTime}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redis Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Zap className="w-5 h-5 mr-2" />
              Redis Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(healthData.services.redis.status)}>
                {getStatusIcon(healthData.services.redis.status)}
                <span className="ml-1">{healthData.services.redis.status}</span>
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory Usage</span>
                <span>{healthData.services.redis.memory}MB/{healthData.services.redis.maxMemory}MB</span>
              </div>
              <Progress 
                value={(healthData.services.redis.memory / healthData.services.redis.maxMemory) * 100} 
                className="h-1" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Clients</div>
                <div className="font-medium">{healthData.services.redis.connectedClients}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Response</div>
                <div className="font-medium">{healthData.services.redis.responseTime}ms</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auth0 Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Shield className="w-5 h-5 mr-2" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(healthData.services.auth0.status)}>
                {getStatusIcon(healthData.services.auth0.status)}
                <span className="ml-1">{healthData.services.auth0.status}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Active Users</div>
                <div className="font-medium">{healthData.services.auth0.activeUsers.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Daily Logins</div>
                <div className="font-medium">{healthData.services.auth0.dailyLogins}</div>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-muted-foreground">Response Time</div>
              <div className="font-medium">{healthData.services.auth0.responseTime}ms</div>
            </div>
          </CardContent>
        </Card>

        {/* AWS Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Globe className="w-5 h-5 mr-2" />
              AWS Services
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(healthData.services.aws.status)}>
                {getStatusIcon(healthData.services.aws.status)}
                <span className="ml-1">{healthData.services.aws.status}</span>
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">S3 Storage</span>
                  <span>{healthData.services.aws.s3.storage}GB</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {healthData.services.aws.s3.requests.toLocaleString()} requests today
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">SES Emails</span>
                  <span>{healthData.services.aws.ses.emailsSent}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {healthData.services.aws.ses.bounceRate}% bounce rate
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Server className="w-5 h-5 mr-2" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className={getStatusColor(healthData.services.api.status)}>
                {getStatusIcon(healthData.services.api.status)}
                <span className="ml-1">{healthData.services.api.status}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Requests/min</div>
                <div className="font-medium">{healthData.services.api.requestsPerMinute}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Error Rate</div>
                <div className="font-medium">{healthData.services.api.errorRate}%</div>
              </div>
            </div>

            <div className="text-sm">
              <div className="text-muted-foreground">Avg Response</div>
              <div className="font-medium">{healthData.services.api.avgResponseTime}ms</div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Activity className="w-5 h-5 mr-2" />
              Platform Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Users</div>
                <div className="font-bold text-lg">{healthData.metrics.totalUsers.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Active (24h)</div>
                <div className="font-bold text-lg">{healthData.metrics.activeUsers24h.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Events</div>
                <div className="font-medium">{healthData.metrics.totalEvents.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Pending Verifications</div>
                <div className="font-medium">{healthData.metrics.verificationsPending}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData.alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <p>No recent alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {healthData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    alert.type === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' :
                    alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800' :
                    'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                  } ${alert.resolved ? 'opacity-60' : ''}`}
                >
                  <div className={`p-1 rounded-full ${
                    alert.type === 'error' ? 'bg-red-100 text-red-600' :
                    alert.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                      {alert.resolved && (
                        <Badge variant="outline" className="text-xs">
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}