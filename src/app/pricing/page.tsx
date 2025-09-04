// home/ubuntu/impaktrweb/src/app/pricing/page.tsx

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, X, Zap, Star, Crown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PricingCard } from '@/components/pricing/PricingCard';

const individualPlans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for getting started with social impact tracking',
    features: [
      'Basic Impaktr Score™',
      'Join unlimited events',
      'Basic SDG badges',
      'Standard certificates',
      'Community access',
      'Mobile app access'
    ],
    limitations: [
      'No custom profile themes',
      'No advanced analytics',
      'No priority support'
    ],
    cta: 'Get Started Free',
    popular: false,
    stripePriceId: null
  },
  {
    name: 'Premium',
    price: { monthly: 4.99, yearly: 49.99 },
    description: 'Enhanced features for serious impact creators',
    features: [
      'Everything in Free',
      'Advanced analytics dashboard',
      'Custom profile themes',
      'Exclusive premium events',
      'Priority verification',
      'LinkedIn certificate integration',
      'Advanced SDG insights',
      'Priority community support'
    ],
    limitations: [],
    cta: 'Upgrade to Premium',
    popular: true,
    stripePriceId: {
      monthly: 'price_premium_monthly',
      yearly: 'price_premium_yearly'
    }
  }
];

const ngoPlans = [
  {
    name: 'Basic',
    price: { monthly: 0, yearly: 0 },
    description: 'Essential tools for small NGOs and community groups',
    features: [
      'Create up to 5 events/month',
      'Basic volunteer management',
      'Standard certificates',
      'Basic analytics',
      'Community listings'
    ],
    limitations: [
      'Limited to 50 participants/event',
      'No custom branding',
      'No bulk verification'
    ],
    cta: 'Start Free',
    popular: false,
    stripePriceId: null
  },
  {
    name: 'Pro',
    price: { monthly: 99, yearly: 990 },
    description: 'Advanced features for growing organizations',
    features: [
      'Unlimited events',
      'Advanced CRM tools',
      'Custom branded certificates',
      'Bulk volunteer verification',
      'Featured organization listing',
      'Advanced analytics & reporting',
      'Email marketing integration',
      'Priority support'
    ],
    limitations: [],
    cta: 'Upgrade to Pro',
    popular: true,
    stripePriceId: {
      monthly: 'price_ngo_pro_monthly',
      yearly: 'price_ngo_pro_yearly'
    }
  },
  {
    name: 'Enterprise',
    price: { monthly: 499, yearly: 4990 },
    description: 'Complete solution for large organizations',
    features: [
      'Everything in Pro',
      'White-label platform',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'Advanced ESG reporting',
      'Multi-language support',
      '24/7 premium support'
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false,
    stripePriceId: {
      monthly: 'price_ngo_enterprise_monthly',
      yearly: 'price_ngo_enterprise_yearly'
    }
  }
];

const corporatePlans = [
  {
    name: 'Starter',
    price: { monthly: 250, yearly: 3000 },
    description: 'Perfect for companies starting their CSR journey',
    features: [
      'Up to 100 employees',
      'Basic CSR dashboard',
      'Standard events (up to 10/month)',
      'Employee impact tracking',
      'Basic ESG reports',
      'Community access'
    ],
    limitations: [
      'No custom branding',
      'Limited analytics',
      'Standard support'
    ],
    cta: 'Start CSR Journey',
    popular: false,
    stripePriceId: {
      monthly: 'price_corp_starter_monthly',
      yearly: 'price_corp_starter_yearly'
    }
  },
  {
    name: 'Growth',
    price: { monthly: 833, yearly: 10000 },
    description: 'Comprehensive CSR solution for growing companies',
    features: [
      'Up to 500 employees',
      'Advanced CSR dashboard',
      'Unlimited events',
      'Custom branded experiences',
      'Advanced ESG reporting',
      'Industry benchmarking',
      'SSO integration',
      'Priority support'
    ],
    limitations: [],
    cta: 'Scale Your Impact',
    popular: true,
    stripePriceId: {
      monthly: 'price_corp_growth_monthly',
      yearly: 'price_corp_growth_yearly'
    }
  },
  {
    name: 'Enterprise',
    price: { monthly: 2083, yearly: 25000 },
    description: 'Full-scale solution for enterprise organizations',
    features: [
      'Unlimited employees',
      'White-label platform',
      'Custom API access',
      'Advanced benchmarking',
      'Dedicated success manager',
      'Custom ESG frameworks',
      'Global compliance reporting',
      '24/7 enterprise support'
    ],
    limitations: [],
    cta: 'Contact Enterprise Sales',
    popular: false,
    stripePriceId: {
      monthly: 'price_corp_enterprise_monthly',
      yearly: 'price_corp_enterprise_yearly'
    }
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState('individual');

  const handlePurchase = async (priceId: { monthly: string; yearly: string }, planType: string) => {
    if (!user) {
      window.location.href = '/api/auth/login';
      return;
    }

    try {
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: billingCycle === 'monthly' ? priceId.monthly : priceId.yearly,
          planType,
          userId: user.id,
        }),
      });

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Impact Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Whether you're an individual volunteer, NGO, or corporation, we have the perfect plan to amplify your social impact
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label htmlFor="billing-toggle" className={billingCycle === 'monthly' ? 'font-semibold' : ''}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <Label htmlFor="billing-toggle" className={billingCycle === 'yearly' ? 'font-semibold' : ''}>
              Yearly
            </Label>
            {billingCycle === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Plan Categories */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4">
            <TabsTrigger value="individual" className="flex items-center">
              <Star className="w-4 h-4 mr-2" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="ngo" className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              NGO / Non-Profit
            </TabsTrigger>
            <TabsTrigger value="corporate" className="flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Corporate
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center">
              <Crown className="w-4 h-4 mr-2" />
              Compare All
            </TabsTrigger>
          </TabsList>

          {/* Individual Plans */}
          <TabsContent value="individual">
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {individualPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  plan={plan}
                  billingCycle={billingCycle}
                  onPurchase={(priceId) => plan.stripePriceId && handlePurchase(priceId, `individual-${plan.name.toLowerCase()}`)}
                  userType="individual"
                />
              ))}
            </div>
          </TabsContent>

          {/* NGO Plans */}
          <TabsContent value="ngo">
            <div className="grid md:grid-cols-3 gap-8">
              {ngoPlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  plan={plan}
                  billingCycle={billingCycle}
                  onPurchase={(priceId) => plan.stripePriceId && handlePurchase(priceId, `ngo-${plan.name.toLowerCase()}`)}
                  userType="ngo"
                />
              ))}
            </div>
          </TabsContent>

          {/* Corporate Plans */}
          <TabsContent value="corporate">
            <div className="grid md:grid-cols-3 gap-8">
              {corporatePlans.map((plan, index) => (
                <PricingCard
                  key={index}
                  plan={plan}
                  billingCycle={billingCycle}
                  onPurchase={(priceId) => plan.stripePriceId && handlePurchase(priceId, `corporate-${plan.name.toLowerCase()}`)}
                  userType="corporate"
                />
              ))}
            </div>
          </TabsContent>

          {/* Compare All Plans */}
          <TabsContent value="compare">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-semibold">Features</th>
                    <th className="text-center p-4 font-semibold">Individual Free</th>
                    <th className="text-center p-4 font-semibold">Individual Premium</th>
                    <th className="text-center p-4 font-semibold">NGO Pro</th>
                    <th className="text-center p-4 font-semibold">Corporate Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Impaktr Score™', free: true, premium: true, ngo: true, corporate: true },
                    { feature: 'Basic Certificates', free: true, premium: true, ngo: true, corporate: true },
                    { feature: 'Event Participation', free: true, premium: true, ngo: true, corporate: true },
                    { feature: 'SDG Badges', free: 'Basic', premium: 'Advanced', ngo: 'Advanced', corporate: 'Advanced' },
                    { feature: 'Custom Branding', free: false, premium: false, ngo: true, corporate: true },
                    { feature: 'Advanced Analytics', free: false, premium: true, ngo: true, corporate: true },
                    { feature: 'API Access', free: false, premium: false, ngo: false, corporate: true },
                    { feature: 'White-label Platform', free: false, premium: false, ngo: 'Enterprise', corporate: 'Enterprise' },
                    { feature: 'Dedicated Support', free: false, premium: false, ngo: true, corporate: true },
                  ].map((row, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center">
                        {typeof row.free === 'boolean' ? (
                          row.free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-sm">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.premium === 'boolean' ? (
                          row.premium ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-sm">{row.premium}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.ngo === 'boolean' ? (
                          row.ngo ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-sm">{row.ngo}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {typeof row.corporate === 'boolean' ? (
                          row.corporate ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />
                        ) : (
                          <span className="text-sm">{row.corporate}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and billing adjustments are prorated.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial for paid plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All paid plans come with a 14-day free trial. No credit card required for NGO Basic and Individual Free plans.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does verification work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use multiple verification methods: GPS check-ins, peer verification, organizer approval, and AI-powered fraud detection.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I export my impact data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! All plans include data export capabilities. Premium and above plans get advanced CSV, PDF, and API export options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer student discounts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Students get 50% off Individual Premium plans with valid student ID verification through our education program.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards, PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-20">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-12 text-center">
              <Crown className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h3 className="text-2xl font-bold mb-4">Need Something Custom?</h3>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Large organization or have specific requirements? Let's discuss a custom solution that fits your impact goals perfectly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="gradient">
                  Schedule Enterprise Demo
                </Button>
                <Button size="lg" variant="outline">
                  Contact Sales Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-6">Trusted by organizations worldwide</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-sm font-medium">UNICEF</div>
            <div className="text-sm font-medium">WWF</div>
            <div className="text-sm font-medium">Red Cross</div>
            <div className="text-sm font-medium">Teach for All</div>
            <div className="text-sm font-medium">Habitat for Humanity</div>
          </div>
        </div>
      </div>
    </div>
  );
}