'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Heart,
  Microscope,
  GraduationCap,
  Building,
  DollarSign,
  Users,
  Globe,
  ArrowRight,
  Sparkles,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const opportunityCategories = [
  {
    id: 'volunteer',
    title: 'Volunteer Events',
    description: 'Make a difference in your community through hands-on volunteering opportunities',
    icon: Heart,
    color: 'bg-gradient-to-br from-red-500 to-pink-600',
    textColor: 'text-white',
    href: '/events?category=volunteer',
    stats: '2,340 opportunities'
  },
  {
    id: 'research',
    title: 'Research & Lab Assistant',
    description: 'Join cutting-edge research projects and gain valuable academic experience',
    icon: Microscope,
    color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
    textColor: 'text-white',
    href: '/events?category=research',
    stats: '567 positions'
  },
  {
    id: 'scholarships',
    title: 'Scholarships Opportunities',
    description: 'Find funding for your education and professional development',
    icon: GraduationCap,
    color: 'bg-gradient-to-br from-green-500 to-emerald-600',
    textColor: 'text-white',
    href: '/events?category=scholarships',
    stats: '1,234 scholarships'
  },
  {
    id: 'sponsorship',
    title: 'Sponsorship Programs',
    description: 'Get sponsored by organizations to pursue your impact goals',
    icon: Building,
    color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    textColor: 'text-white',
    href: '/events?category=sponsorship',
    stats: '423 sponsors'
  },
  {
    id: 'grants',
    title: 'Grants & Funding',
    description: 'Access grants and funding for projects, research, and community initiatives',
    icon: DollarSign,
    color: 'bg-gradient-to-br from-orange-500 to-amber-600',
    textColor: 'text-white',
    href: '/events?category=grants',
    stats: '890 grants'
  },
  {
    id: 'internships',
    title: 'Impact Internships',
    description: 'Gain professional experience while making a positive social impact',
    icon: Users,
    color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    textColor: 'text-white',
    href: '/events?category=internships',
    stats: '1,567 internships'
  }
];

export default function OpportunitiesDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Preview Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <Target className="w-6 h-6" />
                <h1 className="text-xl font-semibold">Opportunities Demo</h1>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Preview Mode
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Discover Opportunities to Make an Impact
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Find volunteering events, scholarships, grants, internships, and more opportunities to create positive change
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Explore All Opportunities
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Choose a category that aligns with your goals and interests
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {opportunityCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Link key={category.id} href={category.href}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-0 h-full cursor-pointer">
                  <CardContent className={`${category.color} p-8 h-full flex flex-col`}>
                    <div className="mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{category.title}</h3>
                      <p className="text-white/90 text-sm mb-4">{category.description}</p>
                    </div>
                    <div className="mt-auto">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">{category.stats}</span>
                        <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">7K+</div>
            <div className="text-gray-600 dark:text-gray-400">Total Opportunities</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">150+</div>
            <div className="text-gray-600 dark:text-gray-400">Organizations</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">50+</div>
            <div className="text-gray-600 dark:text-gray-400">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">$2M+</div>
            <div className="text-gray-600 dark:text-gray-400">Funding Available</div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Your Impact Journey Today!
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands discovering and pursuing opportunities to make a difference
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
                Create Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/signin">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-white/80 text-sm mt-6">
            Free forever • No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
