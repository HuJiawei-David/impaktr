// home/ubuntu/impaktrweb/src/app/organization/settings/billing/plans/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  Check,
  X,
  ArrowLeft,
  Zap,
  Building2,
  Rocket,
  Crown,
  Users,
  Calendar,
  BarChart3,
  Shield,
  Sparkles,
  Headphones
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'annual';
  description: string;
  features: string[];
  limits: {
    members: number;
    events: number;
    storage: string;
    support: string;
  };
  icon: React.ReactNode;
  color: string;
  recommended?: boolean;
}

export default function OrganizationPlansPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [currentPlan, setCurrentPlan] = useState<string>('FREE');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchCurrentPlan();
    }
  }, [isLoading, user, router]);

  const fetchCurrentPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations/billing');
      
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.billing?.subscriptionTier || 'FREE');
      }
    } catch (err) {
      console.error('Error fetching current plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const plans: Plan[] = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      currency: 'USD',
      billingPeriod,
      description: 'Perfect for small organizations getting started',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-gray-500',
      features: [
        'Up to 10 team members',
        'Up to 5 events per month',
        'Basic impact analytics',
        'Community features',
        'Email support',
        '1 GB storage'
      ],
      limits: {
        members: 10,
        events: 5,
        storage: '1 GB',
        support: 'Email'
      }
    },
    {
      id: 'STARTER',
      name: 'Starter',
      price: billingPeriod === 'monthly' ? 49 : 470,
      currency: 'USD',
      billingPeriod,
      description: 'Great for growing teams making an impact',
      icon: <Rocket className="w-6 h-6" />,
      color: 'bg-green-500',
      features: [
        'Up to 50 team members',
        'Up to 20 events per month',
        'Enhanced analytics',
        'ESG reporting dashboard',
        'Priority email support',
        'Event certificates',
        '10 GB storage',
        'Mobile app access'
      ],
      limits: {
        members: 50,
        events: 20,
        storage: '10 GB',
        support: 'Priority Email'
      }
    },
    {
      id: 'PROFESSIONAL',
      name: 'Professional',
      price: billingPeriod === 'monthly' ? 199 : 1910,
      currency: 'USD',
      billingPeriod,
      description: 'For organizations serious about their social impact',
      icon: <Building2 className="w-6 h-6" />,
      color: 'bg-gradient-to-r from-blue-500 to-purple-600',
      recommended: true,
      features: [
        'Up to 200 team members',
        'Unlimited events',
        'Advanced analytics & insights',
        'Custom ESG reports',
        'White-label certificates',
        'Priority support',
        'API access',
        '100 GB storage',
        'Custom branding',
        'Dedicated account manager',
        'Integration with HRIS tools',
        'Volunteer hour tracking'
      ],
      limits: {
        members: 200,
        events: 999999,
        storage: '100 GB',
        support: 'Priority + Chat'
      }
    },
    {
      id: 'ENTERPRISE',
      name: 'Enterprise',
      price: billingPeriod === 'monthly' ? 499 : 4790,
      currency: 'USD',
      billingPeriod,
      description: 'For large enterprises with complex impact needs',
      icon: <Crown className="w-6 h-6" />,
      color: 'bg-purple-500',
      features: [
        'Unlimited team members',
        'Unlimited events',
        'Enterprise-grade analytics',
        'Custom ESG frameworks',
        'Advanced reporting suite',
        '24/7 phone & email support',
        'Custom integrations',
        'Unlimited storage',
        'SSO & advanced security',
        'Dedicated success manager',
        'Custom onboarding & training',
        'SLA guarantee',
        'Multi-location support',
        'Advanced data exports',
        'Compliance certifications'
      ],
      limits: {
        members: 999999,
        events: 999999,
        storage: 'Unlimited',
        support: '24/7 Phone & Email'
      }
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === currentPlan) {
      toast.error('You are already on this plan');
      return;
    }

    // In a real app, this would integrate with Stripe/payment processor
    toast.success(`Redirecting to checkout for ${planId} plan...`);
    // router.push(`/organization/settings/billing/checkout?plan=${planId}&period=${billingPeriod}`);
  };

  const handleContactSales = () => {
    toast.success('Opening contact form...');
    // In a real app, this would open a contact form or calendar
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const annualSavings = Math.round((1 - ((470 + 1910 + 4790) / ((49 + 199 + 499) * 12))) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Choose Your Impact Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Scale your organization&apos;s social impact with the right tools and features
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className={billingPeriod === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
                Monthly
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
                className={`relative w-16 h-8 rounded-full transition-colors ${
                  billingPeriod === 'annual' ? 'bg-gradient-to-r from-purple-600 to-purple-700' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    billingPeriod === 'annual' ? 'translate-x-8' : ''
                  }`}
                />
              </button>
              <span className={billingPeriod === 'annual' ? 'font-semibold' : 'text-muted-foreground'}>
                Annual
              </span>
              {billingPeriod === 'annual' && (
                <Badge className="bg-green-500 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Save up to {annualSavings}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            
            return (
              <Card 
                key={plan.id}
                className={`relative ${
                  plan.recommended 
                    ? 'border-2 border-blue-500 shadow-xl scale-105' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-1">
                      <Rocket className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="secondary" className="px-4 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${plan.color} flex items-center justify-center text-white mb-4`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline">
                      <span className="text-sm text-muted-foreground">$</span>
                      <span className="text-4xl font-bold">
                        {plan.price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {billingPeriod === 'annual' && plan.price > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        ${(plan.price / 12).toFixed(2)}/month billed annually
                      </p>
                    )}
                    {plan.price === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Free forever
                      </p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Key Limits */}
                  <div className="space-y-2 pb-4 border-b">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        Members
                      </span>
                      <span className="font-semibold">
                        {plan.limits.members === 999999 ? 'Unlimited' : plan.limits.members}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        Events/month
                      </span>
                      <span className="font-semibold">
                        {plan.limits.events === 999999 ? 'Unlimited' : plan.limits.events}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Storage
                      </span>
                      <span className="font-semibold">{plan.limits.storage}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-muted-foreground">
                        <Headphones className="w-4 h-4 mr-2" />
                        Support
                      </span>
                      <span className="font-semibold text-xs">{plan.limits.support}</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full ${
                      plan.recommended 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                        : ''
                    }`}
                    variant={plan.recommended ? 'default' : 'outline'}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started Free' : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Detailed Feature Comparison</CardTitle>
            <CardDescription className="text-center">
              Compare all features across plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-4">Feature</th>
                    <th className="text-center py-4 px-4">Free</th>
                    <th className="text-center py-4 px-4">Starter</th>
                    <th className="text-center py-4 px-4">Professional</th>
                    <th className="text-center py-4 px-4">Enterprise</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="py-4 px-4 font-medium">Team Members</td>
                    <td className="text-center py-4 px-4">Up to 10</td>
                    <td className="text-center py-4 px-4">Up to 50</td>
                    <td className="text-center py-4 px-4">Up to 200</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Events per Month</td>
                    <td className="text-center py-4 px-4">5</td>
                    <td className="text-center py-4 px-4">20</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                    <td className="text-center py-4 px-4">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">ESG Reporting</td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Custom Branding</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">API Access</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">SSO & Advanced Security</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">Dedicated Account Manager</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 font-medium">SLA Guarantee</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! You can upgrade or downgrade your plan at any time. Changes will be prorated based on your billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I exceed my limits?</h3>
              <p className="text-muted-foreground text-sm">
                We&apos;ll notify you when you&apos;re approaching your limits. You can upgrade to a higher plan or purchase additional capacity.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a setup fee?</h3>
              <p className="text-muted-foreground text-sm">
                No setup fees for any plan. Enterprise customers receive complimentary onboarding and training.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer discounts for nonprofits?</h3>
              <p className="text-muted-foreground text-sm">
                Yes! Registered nonprofits receive special pricing. Contact our sales team for details.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Need a Custom Solution?</h2>
            <p className="text-lg mb-6 opacity-90">
              Our Enterprise plan can be tailored to your specific needs
            </p>
            <Button
              onClick={handleContactSales}
              size="lg"
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Shield className="w-5 h-5 mr-2" />
              Contact Sales Team
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

