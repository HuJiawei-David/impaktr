// home/ubuntu/impaktrweb/src/components/home/FeaturesSection.tsx

'use client';

import React from 'react';
import { 
  Shield, 
  Award, 
  BarChart3, 
  Users, 
  Globe, 
  Zap,
  CheckCircle,
  Target,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Shield,
    title: 'Verified Impact Scoring',
    description: 'GPS check-ins, peer verification, and organizer approval ensure your impact is authentic and measurable.',
    gradient: 'from-blue-500 to-cyan-500',
    benefits: ['GPS verification', 'Peer approval', 'Organizer validation', 'Anti-fraud protection']
  },
  {
    icon: Award,
    title: 'SDG Achievement Badges',
    description: 'Earn 68 unique badges across all 17 UN Sustainable Development Goals with 4 progression tiers each.',
    gradient: 'from-green-500 to-emerald-500',
    benefits: ['17 SDG categories', '4 progression tiers', 'Shareable certificates', 'LinkedIn integration']
  },
  {
    icon: BarChart3,
    title: 'Global Leaderboards',
    description: 'Compare your impact globally by country, SDG focus, and organizational affiliation.',
    gradient: 'from-purple-500 to-pink-500',
    benefits: ['Country rankings', 'SDG leaderboards', 'Organizational stats', 'Time-based filters']
  },
  {
    icon: Users,
    title: 'Corporate ESG Dashboards',
    description: 'Companies get comprehensive ESG reporting tools and employee engagement analytics.',
    gradient: 'from-orange-500 to-red-500',
    benefits: ['ESG-ready reports', 'Employee participation', 'Industry benchmarking', 'CSR tracking']
  },
  {
    icon: Globe,
    title: 'Opportunity Marketplace',
    description: 'Discover volunteering, research, scholarship, and donation opportunities worldwide.',
    gradient: 'from-indigo-500 to-purple-500',
    benefits: ['Global opportunities', 'Smart matching', 'Skill-based filtering', 'Virtual events']
  },
  {
    icon: Zap,
    title: 'Instant Certificates',
    description: 'Get shareable digital certificates for every verified activity, ready for LinkedIn and resumes.',
    gradient: 'from-yellow-500 to-orange-500',
    benefits: ['Instant generation', 'LinkedIn sharing', 'PDF downloads', 'Blockchain verification']
  }
];

const stats = [
  { label: 'Verification Methods', value: '5+', icon: CheckCircle },
  { label: 'Achievement Levels', value: '68', icon: Target },
  { label: 'Global Reach', value: '50+', icon: Globe },
  { label: 'Growth Rate', value: '300%', icon: TrendingUp },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Platform Features
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to
            <span className="brand-gradient-text"> Measure Impact</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive tools for individuals, NGOs, schools, and corporations to track, verify, and showcase their social impact contributions.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-3">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold brand-gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>All features included in free tier</span>
          </div>
          <p className="text-lg text-muted-foreground">
            Ready to start measuring your social impact?{' '}
            <a href="/api/auth/login?screen_hint=signup" className="text-primary hover:underline font-medium">
              Get started for free →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}