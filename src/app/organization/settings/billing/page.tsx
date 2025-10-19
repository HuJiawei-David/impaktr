// home/ubuntu/impaktrweb/src/app/organization/settings/billing/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Users,
  Calendar as CalendarIcon,
  DollarSign
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface BillingData {
  subscriptionTier: string;
  subscriptionStatus: string;
  currentPeriodEnd: string;
  maxMembers: number;
  maxEvents: number;
  price: number;
  currency: string;
  features: string[];
  usage: {
    members: number;
    events: number;
    volunteerHours: number;
  };
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    downloadUrl: string;
  }>;
}

interface OrganizationData {
  id: string;
  name: string;
  billing: BillingData;
}

export default function OrganizationBillingPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchBillingData();
    }
  }, [isLoading, user, router]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations/billing');
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 404) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setOrganizationData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/organization/settings/billing/plans');
  };

  const handleManageBilling = () => {
    toast.success('Billing management portal coming soon!');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierDisplay = (tier: string) => {
    const tierMap: { [key: string]: string } = {
      'REGISTERED': 'Free',
      'STARTER': 'Starter',
      'ACTIVE_CONTRIBUTOR': 'Active Contributor',
      'COMMUNITY_BUILDER': 'Community Builder',
      'IMPACT_PIONEER': 'Impact Pioneer',
      'CHANGE_CATALYST': 'Change Catalyst',
      'SUSTAINABILITY_CHAMPION': 'Sustainability Champion',
      'INNOVATION_LEADER': 'Innovation Leader',
      'GLOBAL_IMPACT_LEADER': 'Global Impact Leader',
    };
    return tierMap[tier] || tier.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'GLOBAL_IMPACT_LEADER':
      case 'INNOVATION_LEADER':
      case 'SUSTAINABILITY_CHAMPION': 
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'CHANGE_CATALYST':
      case 'IMPACT_PIONEER':
      case 'COMMUNITY_BUILDER': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'STARTER':
      case 'ACTIVE_CONTRIBUTOR': 
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'REGISTERED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Check className="w-4 h-4" />;
      case 'trialing': return <Calendar className="w-4 h-4" />;
      case 'past_due': return <AlertTriangle className="w-4 h-4" />;
      case 'canceled': return <X className="w-4 h-4" />;
      default: return <X className="w-4 h-4" />;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground mb-4">You are not part of any organization.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const { billing } = organizationData;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Billing & Subscription</h1>
              <p className="text-muted-foreground">
                Manage your organization's subscription and billing
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(billing.subscriptionStatus)}>
              {getStatusIcon(billing.subscriptionStatus)}
              <span className="ml-1">{billing.subscriptionStatus}</span>
            </Badge>
            <Badge className={getTierColor(billing.subscriptionTier)}>
              {getTierDisplay(billing.subscriptionTier)}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-6 h-6 mr-2" />
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{getTierDisplay(billing.subscriptionTier)}</h3>
                    <p className="text-muted-foreground">
                      {billing.currency} {billing.price.toFixed(2)}/month
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Next billing date</p>
                    <p className="font-semibold">
                      {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Plan Features</h4>
                    <ul className="space-y-2">
                      {billing.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Usage Limits</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Members</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {billing.usage.members} / {billing.maxMembers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Events</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {billing.usage.events} / {billing.maxEvents}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">Volunteer Hours</span>
                        </div>
                        <span className="text-sm font-semibold">
                          {billing.usage.volunteerHours.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <Button onClick={handleUpgrade} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Upgrade Plan
                  </Button>
                  <Button onClick={handleManageBilling} variant="outline">
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/25</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Billing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Plan</span>
                  <span className="font-semibold">{getTierDisplay(billing.subscriptionTier)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Cost</span>
                  <span className="font-semibold">
                    {billing.currency} {billing.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Billing</span>
                  <span className="font-semibold">
                    {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{billing.currency} {billing.price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billing.invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-semibold text-sm">
                          {invoice.currency} {invoice.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : invoice.status === 'pending' ? 'secondary' : 'destructive'}
                          className={invoice.status === 'paid' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0' : ''}
                        >
                          {invoice.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
