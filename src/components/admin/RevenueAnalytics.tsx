// home/ubuntu/impaktrweb/src/components/admin/RevenueAnalytics.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Pie,
  PieChart as RechartsPieChart, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatNumber } from '@/lib/utils';

interface RevenueData {
  overview: {
    totalRevenue: number;
    monthlyRecurring: number;
    annualRecurring: number;
    transactionFees: number;
    growthRate: number;
    churnRate: number;
    averageRevenuePerUser: number;
    lifetimeValue: number;
  };
  trends: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
    transactions: number;
    newCustomers: number;
  }>;
  segments: {
    individual: {
      total: number;
      premium: number;
      conversionRate: number;
    };
    ngo: {
      total: number;
      pro: number;
      enterprise: number;
    };
    corporate: {
      total: number;
      starter: number;
      growth: number;
      enterprise: number;
    };
  };
  paymentMethods: Array<{
    method: string;
    percentage: number;
    amount: number;
  }>;
  forecast: Array<{
    month: string;
    projected: number;
    conservative: number;
    optimistic: number;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [timeRange, setTimeRange] = useState('12m');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    setIsLoading(true);
    try {
      // In real implementation, this would call your API
      // const response = await fetch(`/api/admin/revenue-analytics?range=${timeRange}`);
      // const data = await response.json();

      // Mock data for demonstration
      const mockData: RevenueData = {
        overview: {
          totalRevenue: 2847659,
          monthlyRecurring: 485200,
          annualRecurring: 1950000,
          transactionFees: 127400,
          growthRate: 23.4,
          churnRate: 3.2,
          averageRevenuePerUser: 127.50,
          lifetimeValue: 2840
        },
        trends: [
          { month: 'Jan', revenue: 185000, subscriptions: 1250, transactions: 340, newCustomers: 420 },
          { month: 'Feb', revenue: 198000, subscriptions: 1340, transactions: 385, newCustomers: 390 },
          { month: 'Mar', revenue: 225000, subscriptions: 1480, transactions: 425, newCustomers: 510 },
          { month: 'Apr', revenue: 242000, subscriptions: 1590, transactions: 465, newCustomers: 480 },
          { month: 'May', revenue: 265000, subscriptions: 1720, transactions: 520, newCustomers: 560 },
          { month: 'Jun', revenue: 278000, subscriptions: 1820, transactions: 580, newCustomers: 590 },
          { month: 'Jul', revenue: 295000, subscriptions: 1950, transactions: 615, newCustomers: 630 },
          { month: 'Aug', revenue: 312000, subscriptions: 2080, transactions: 650, newCustomers: 680 },
          { month: 'Sep', revenue: 328000, subscriptions: 2200, transactions: 685, newCustomers: 720 },
          { month: 'Oct', revenue: 345000, subscriptions: 2350, transactions: 720, newCustomers: 750 },
          { month: 'Nov', revenue: 368000, subscriptions: 2480, transactions: 765, newCustomers: 820 },
          { month: 'Dec', revenue: 385000, subscriptions: 2620, transactions: 810, newCustomers: 890 }
        ],
        segments: {
          individual: { total: 458600, premium: 98400, conversionRate: 21.5 },
          ngo: { total: 892300, pro: 654200, enterprise: 238100 },
          corporate: { total: 1496800, starter: 485600, growth: 672100, enterprise: 339100 }
        },
        paymentMethods: [
          { method: 'Credit Card', percentage: 68, amount: 1936168 },
          { method: 'PayPal', percentage: 18, amount: 512578 },
          { method: 'Bank Transfer', percentage: 10, amount: 284766 },
          { method: 'Stripe', percentage: 4, amount: 113906 }
        ],
        forecast: [
          { month: 'Jan 2025', projected: 420000, conservative: 385000, optimistic: 465000 },
          { month: 'Feb 2025', projected: 445000, conservative: 410000, optimistic: 490000 },
          { month: 'Mar 2025', projected: 475000, conservative: 435000, optimistic: 525000 },
          { month: 'Apr 2025', projected: 505000, conservative: 465000, optimistic: 560000 },
          { month: 'May 2025', projected: 535000, conservative: 495000, optimistic: 595000 },
          { month: 'Jun 2025', projected: 570000, conservative: 525000, optimistic: 630000 }
        ]
      };

      setRevenueData(mockData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!revenueData) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Revenue Analytics</h2>
          <p className="text-muted-foreground">
            Track subscription revenue, transaction fees, and growth metrics
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Revenue',
            value: revenueData.overview.totalRevenue,
            change: revenueData.overview.growthRate,
            icon: DollarSign,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            format: 'currency'
          },
          {
            title: 'Monthly Recurring',
            value: revenueData.overview.monthlyRecurring,
            change: 18.5,
            icon: Calendar,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            format: 'currency'
          },
          {
            title: 'Avg Revenue Per User',
            value: revenueData.overview.averageRevenuePerUser,
            change: 12.3,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            format: 'currency'
          },
          {
            title: 'Customer Lifetime Value',
            value: revenueData.overview.lifetimeValue,
            change: 8.7,
            icon: Target,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            format: 'currency'
          }
        ].map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">
                    {metric.format === 'currency' 
                      ? `$${formatNumber(metric.value)}`
                      : formatNumber(metric.value)
                    }
                  </p>
                  <div className="flex items-center space-x-1 text-xs">
                    {metric.change >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-red-500" />
                    )}
                    <span className={metric.change >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-muted-foreground">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor}`}>
                  <metric.icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Revenue Trends</TabsTrigger>
          <TabsTrigger value="segments">Customer Segments</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Revenue vs Subscriptions Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${formatNumber(value)}` : formatNumber(value),
                      name === 'revenue' ? 'Revenue' : 'Subscriptions'
                    ]}
                  />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="subscriptions"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Active Subscriptions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods Distribution */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={revenueData.paymentMethods}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                      label={({ method, percentage }) => `${method}: ${percentage}%`}
                    >
                      {revenueData.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value}% ($${formatNumber(props.payload.amount)})`,
                        'Share'
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Performance Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Growth Rate</span>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="font-medium text-green-600">
                          +{revenueData.overview.growthRate}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Churn Rate</span>
                      <div className="flex items-center">
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                        <span className="font-medium text-red-600">
                          {revenueData.overview.churnRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-center p-4 bg-primary/10 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        ${formatNumber(revenueData.overview.annualRecurring)}
                      </div>
                      <div className="text-xs text-muted-foreground">Annual Recurring Revenue</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Revenue Breakdown</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subscriptions</span>
                      <span className="font-medium">
                        ${formatNumber(revenueData.overview.monthlyRecurring + revenueData.overview.annualRecurring)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transaction Fees</span>
                      <span className="font-medium">
                        ${formatNumber(revenueData.overview.transactionFees)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">API Licensing</span>
                      <span className="font-medium">$45,200</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sponsored Challenges</span>
                      <span className="font-medium">$82,100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Revenue']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Acquisition */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Acquisition vs Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="newCustomers" fill="#10B981" name="New Customers" />
                  <Bar yAxisId="right" dataKey="transactions" fill="#F59E0B" name="Transactions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          {/* Customer Segments Revenue */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Individual Segment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Individual Users</span>
                  <Badge variant="secondary">B2C</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ${formatNumber(revenueData.segments.individual.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Free Users</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.individual.total - revenueData.segments.individual.premium)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premium ($4.99/mo)</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.individual.premium)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Conversion Rate</span>
                    <Badge variant="success">
                      {revenueData.segments.individual.conversionRate}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* NGO Segment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>NGOs</span>
                  <Badge variant="secondary">B2B</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${formatNumber(revenueData.segments.ngo.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Free Tier</span>
                    <span className="font-medium">$0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pro ($99/mo)</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.ngo.pro)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enterprise ($499/mo)</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.ngo.enterprise)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Corporate Segment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Corporates</span>
                  <Badge variant="secondary">B2B</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    ${formatNumber(revenueData.segments.corporate.total)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Starter ($3k/year)</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.corporate.starter)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Growth ($10k/year)</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.corporate.growth)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enterprise ($25k+/year)</span>
                    <span className="font-medium">
                      ${formatNumber(revenueData.segments.corporate.enterprise)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segment Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Revenue Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { segment: 'Individual', revenue: revenueData.segments.individual.total, color: '#3B82F6' },
                    { segment: 'NGO', revenue: revenueData.segments.ngo.total, color: '#10B981' },
                    { segment: 'Corporate', revenue: revenueData.segments.corporate.total, color: '#8B5CF6' }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} />
                  <Tooltip formatter={(value: number) => [`$${formatNumber(value)}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          {/* Revenue Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Revenue Forecast (Next 6 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${formatNumber(value)}`} />
                  <Tooltip formatter={(value: number, name: string) => [`$${formatNumber(value)}`, name]} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="conservative"
                    stackId="1"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.3}
                    name="Conservative"
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stackId="2"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Projected"
                  />
                  <Area
                    type="monotone"
                    dataKey="optimistic"
                    stackId="3"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                    name="Optimistic"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Forecast Summary */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Conservative Forecast',
                value: revenueData.forecast.reduce((sum, month) => sum + month.conservative, 0),
                description: 'Based on current growth rate with economic downturn factors',
                color: 'text-red-600',
                bgColor: 'bg-red-50 dark:bg-red-950/20'
              },
              {
                title: 'Projected Forecast',
                value: revenueData.forecast.reduce((sum, month) => sum + month.projected, 0),
                description: 'Based on current trends and market analysis',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50 dark:bg-blue-950/20'
              },
              {
                title: 'Optimistic Forecast',
                value: revenueData.forecast.reduce((sum, month) => sum + month.optimistic, 0),
                description: 'With successful enterprise partnerships and expansion',
                color: 'text-green-600',
                bgColor: 'bg-green-50 dark:bg-green-950/20'
              }
            ].map((forecast, index) => (
              <Card key={index} className={forecast.bgColor}>
                <CardContent className="p-6 text-center">
                  <div className={`text-2xl font-bold ${forecast.color} mb-2`}>
                    ${formatNumber(forecast.value)}
                  </div>
                  <h4 className="font-medium mb-2">{forecast.title}</h4>
                  <p className="text-xs text-muted-foreground">{forecast.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Revenue Goals & Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Revenue Goals & Targets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Q1 2025 Target',
                current: 1285000,
                target: 1500000,
                label: 'Monthly Recurring Revenue'
              },
              {
                title: 'Annual Target',
                current: 2847659,
                target: 5000000,
                label: 'Total Annual Revenue'
              },
              {
                title: 'Enterprise Deals',
                current: 12,
                target: 25,
                label: 'Enterprise Customers'
              },
              {
                title: 'User Growth',
                current: 47580,
                target: 100000,
                label: 'Paying Customers'
              }
            ].map((goal, index) => {
              const progress = (goal.current / goal.target) * 100;
              const isOnTrack = progress >= 75;
              
              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{goal.title}</h4>
                    <Badge variant={isOnTrack ? "success" : progress >= 50 ? "warning" : "destructive"}>
                      {Math.round(progress)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-medium">
                        {goal.title.includes('Revenue') || goal.title.includes('Target') 
                          ? `${formatNumber(goal.current)}`
                          : formatNumber(goal.current)
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">
                        {goal.title.includes('Revenue') || goal.title.includes('Target')
                          ? `${formatNumber(goal.target)}`
                          : formatNumber(goal.target)
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{goal.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Geography */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Geography</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Top Revenue Countries</h4>
              {[
                { country: '🇺🇸 United States', revenue: 845600, percentage: 29.7 },
                { country: '🇲🇾 Malaysia', revenue: 425800, percentage: 15.0 },
                { country: '🇸🇬 Singapore', revenue: 398200, percentage: 14.0 },
                { country: '🇬🇧 United Kingdom', revenue: 312400, percentage: 11.0 },
                { country: '🇦🇺 Australia', revenue: 285100, percentage: 10.0 },
                { country: '🇨🇦 Canada', revenue: 198500, percentage: 7.0 },
                { country: '🇩🇪 Germany', revenue: 156700, percentage: 5.5 },
                { country: '🌍 Others', revenue: 225300, percentage: 7.8 }
              ].map((geo, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">{geo.country}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${formatNumber(geo.revenue)}</div>
                    <div className="text-xs text-muted-foreground">{geo.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-medium mb-4">Revenue Distribution</h4>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'United States', value: 29.7, fill: '#3B82F6' },
                      { name: 'Malaysia', value: 15.0, fill: '#10B981' },
                      { name: 'Singapore', value: 14.0, fill: '#F59E0B' },
                      { name: 'United Kingdom', value: 11.0, fill: '#EF4444' },
                      { name: 'Australia', value: 10.0, fill: '#8B5CF6' },
                      { name: 'Others', value: 20.3, fill: '#6B7280' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Revenue Share']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}