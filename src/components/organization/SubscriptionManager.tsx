// home/ubuntu/impaktrweb/src/components/organization/SubscriptionManager.tsx

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, Crown, Zap, Rocket, Star, CreditCard } from 'lucide-react';

interface SubscriptionManagerProps {
  organization: {
    id: string;
    subscriptionTier: string;
    maxMembers: number;
    maxEvents: number;
    currentPeriodEnd?: Date | null;
  };
  onUpdate?: () => void;
}

export default function SubscriptionManager({ organization, onUpdate }: SubscriptionManagerProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const plans = [
    {
      name: 'Starter',
      tier: 'STARTER',
      price: 0,
      interval: 'Free Forever',
      features: [
        'Up to 10 team members',
        'Basic ESG tracking',
        '5 events per month',
        'Standard support',
        'Basic analytics',
      ],
      icon: Zap,
      color: 'from-gray-600 to-gray-800',
    },
    {
      name: 'Growth',
      tier: 'ACTIVE_CONTRIBUTOR',
      price: 199,
      interval: 'per month',
      features: [
        'Up to 50 team members',
        'Advanced ESG metrics',
        'Unlimited events',
        'Priority support',
        'Advanced analytics',
        'Custom reporting',
        'API access',
      ],
      icon: Rocket,
      color: 'from-blue-600 to-purple-600',
      popular: true,
    },
    {
      name: 'Enterprise',
      tier: 'GLOBAL_IMPACT_LEADER',
      price: 499,
      interval: 'per month',
      features: [
        'Unlimited team members',
        'Full ESG suite',
        'Unlimited events',
        'Dedicated support',
        'Custom integrations',
        'White-label options',
        'SLA guarantee',
        'Strategic consulting',
      ],
      icon: Crown,
      color: 'from-yellow-600 to-orange-600',
    },
  ];

  // Mock usage data
  const usage = {
    members: 23,
    maxMembers: organization.maxMembers,
    events: 3,
    maxEvents: organization.maxEvents,
    apiCalls: 1247,
    maxApiCalls: 5000,
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setIsUpgrading(true);

      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          tier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Mock billing history
  const billingHistory = [
    {
      id: '1',
      date: '2024-10-01',
      amount: 199,
      status: 'paid',
      invoice: 'INV-2024-10-001',
    },
    {
      id: '2',
      date: '2024-09-01',
      amount: 199,
      status: 'paid',
      invoice: 'INV-2024-09-001',
    },
    {
      id: '3',
      date: '2024-08-01',
      amount: 199,
      status: 'paid',
      invoice: 'INV-2024-08-001',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-blue-100 mb-1">Current Plan</h3>
              <h2 className="text-3xl font-bold">{organization.subscriptionTier.replace(/_/g, ' ')}</h2>
              {organization.currentPeriodEnd && (
                <p className="text-blue-100 mt-2">
                  Renews on {new Date(organization.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
            </div>
            <Star className="h-16 w-16 text-blue-200" />
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Team Members</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {usage.members} / {usage.maxMembers}
              </span>
            </div>
            <Progress value={(usage.members / usage.maxMembers) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Events Created</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {usage.events} / {usage.maxEvents === 999 ? '∞' : usage.maxEvents}
              </span>
            </div>
            <Progress value={usage.maxEvents === 999 ? 30 : (usage.events / usage.maxEvents) * 100} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">API Calls</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {usage.apiCalls.toLocaleString()} / {usage.maxApiCalls.toLocaleString()}
              </span>
            </div>
            <Progress value={(usage.apiCalls / usage.maxApiCalls) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Upgrade Your Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = organization.subscriptionTier === plan.tier;
            
            return (
              <Card
                key={plan.tier}
                className={`relative ${
                  plan.popular ? 'border-2 border-blue-600 dark:border-blue-400' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${plan.color} inline-block mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {plan.interval}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isCurrentPlan || isUpgrading}
                    className={`w-full ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`
                    }`}
                  >
                    {isCurrentPlan ? 'Current Plan' : isUpgrading ? 'Processing...' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Billing History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {billingHistory.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ${bill.amount}.00
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(bill.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {bill.status}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Download Invoice
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