// home/ubuntu/impaktrweb/src/components/pricing/PricingCard.tsx

'use client';

import React from 'react';
import { Check, X, Star, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingPlan {
  name: string;
  price: { monthly: number; yearly: number };
  description: string;
  features: string[];
  limitations?: string[];
  cta: string;
  popular: boolean;
  stripePriceId: {
    monthly: string;
    yearly: string;
  } | null;
}

interface PricingCardProps {
  plan: PricingPlan;
  billingCycle: 'monthly' | 'yearly';
  onPurchase: (priceId: any) => void;
  userType: 'individual' | 'ngo' | 'corporate';
}

export function PricingCard({ plan, billingCycle, onPurchase, userType }: PricingCardProps) {
  const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
  const monthlyPrice = billingCycle === 'yearly' ? plan.price.yearly / 12 : plan.price.monthly;
  
  const getIcon = () => {
    if (plan.name.toLowerCase().includes('enterprise')) return Crown;
    if (plan.popular) return Star;
    return Zap;
  };

  const Icon = getIcon();

  const handlePurchase = () => {
    if (!plan.stripePriceId) {
      // Handle free plan or contact sales
      if (plan.name === 'Free' || plan.price.monthly === 0) {
        window.location.href = '/register';
      } else {
        window.location.href = '/contact';
      }
      return;
    }

    onPurchase(plan.stripePriceId);
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105",
        plan.popular && "ring-2 ring-primary shadow-lg scale-105"
      )}
    >
      {plan.popular && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600" />
      )}
      
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center mb-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            plan.popular ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>

        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <p className="text-muted-foreground text-sm">{plan.description}</p>

        <div className="mt-6">
          {price === 0 ? (
            <div className="text-4xl font-bold">Free</div>
          ) : (
            <>
              <div className="flex items-baseline justify-center">
                <span className="text-4xl font-bold">
                  ${billingCycle === 'yearly' ? Math.round(monthlyPrice) : price}
                </span>
                <span className="text-muted-foreground ml-1">
                  /{billingCycle === 'yearly' ? 'mo' : userType === 'individual' ? 'mo' : 'mo'}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-sm text-muted-foreground mt-1">
                  ${plan.price.yearly} billed annually
                </div>
              )}
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Button 
          className={cn(
            "w-full mb-6",
            plan.popular ? "variant-gradient" : ""
          )}
          variant={plan.popular ? "default" : "outline"}
          onClick={handlePurchase}
        >
          {plan.cta}
        </Button>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              What's Included
            </h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {plan.limitations && plan.limitations.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Limitations
              </h4>
              <ul className="space-y-2">
                {plan.limitations.map((limitation, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Additional Info Based on User Type */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground text-center">
            {userType === 'individual' && (
              <>
                {plan.name === 'Free' ? (
                  'Perfect for volunteers and students getting started'
                ) : (
                  '14-day free trial • Cancel anytime • Student discount available'
                )}
              </>
            )}
            {userType === 'ngo' && (
              <>
                {plan.name === 'Basic' ? (
                  'Ideal for community groups and small NGOs'
                ) : plan.name === 'Pro' ? (
                  '14-day free trial • Dedicated support • Training included'
                ) : (
                  'Custom setup • Dedicated success manager • SLA included'
                )}
              </>
            )}
            {userType === 'corporate' && (
              <>
                {plan.name === 'Starter' ? (
                  'Perfect for companies new to structured CSR'
                ) : plan.name === 'Growth' ? (
                  'Most popular for mid-size companies • ROI guaranteed'
                ) : (
                  'Enterprise-grade security • Custom contracts • 24/7 support'
                )}
              </>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        {plan.popular && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center text-sm text-primary font-medium">
              <Star className="w-4 h-4 mr-2" />
              Most chosen by {userType === 'individual' ? 'volunteers' : userType === 'ngo' ? 'NGOs' : 'companies'} like you
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}