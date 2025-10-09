'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Heart,
  Microscope,
  GraduationCap,
  Building,
  DollarSign,
  Users,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
    title: 'Sponsorship Opportunities',
    description: 'Connect with sponsors for your projects, events, and initiatives',
    icon: Building,
    color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    textColor: 'text-white',
    href: '/events?category=sponsorship',
    stats: '789 sponsors'
  },
  {
    id: 'donations',
    title: 'Donation Campaigns',
    description: 'Support meaningful causes and fundraising campaigns worldwide',
    icon: DollarSign,
    color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    textColor: 'text-white',
    href: '/events?category=donations',
    stats: '1,567 campaigns'
  },
  {
    id: 'community',
    title: 'Community Initiatives',
    description: 'Join local community programs and grassroots movements',
    icon: Users,
    color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
    textColor: 'text-white',
    href: '/events?category=community',
    stats: '892 initiatives'
  }
];

export default function OpportunitiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <h1 className="text-4xl md:text-6xl font-bold">
                Explore Opportunities
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Discover meaningful ways to make an impact. Choose from volunteer work, research positions, scholarships, and more.
            </p>
            
            {/* CTA to Events Page */}
            <div className="flex flex-col gap-4 justify-center items-center">
              <Link href="/events">
                <Button size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg">
                  <Globe className="w-5 h-5 mr-2" />
                  View All Impact Events
                </Button>
              </Link>
              <div className="text-white/80 text-sm">
                Or browse by category below ↓
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunities Grid */}
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What type of opportunity are you looking for?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Browse through different categories to find the perfect match for your interests and goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {opportunityCategories.map((category) => {
            const IconComponent = category.icon;
            
            return (
              <Link key={category.id} href={category.href}>
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 h-full border-0 overflow-hidden">
                  <div className={`${category.color} p-6 ${category.textColor}`}>
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <IconComponent className="w-12 h-12 opacity-90" />
                        <ArrowRight className="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <CardTitle className="text-xl font-bold mb-2">
                        {category.title}
                      </CardTitle>
                    </CardHeader>
                  </div>
                  
                  <CardContent className="p-6 bg-white dark:bg-gray-800 flex-1">
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {category.stats}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-2"
                      >
                        Explore
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Can't find what you're looking for?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Browse all opportunities or use our advanced search and filtering options to find exactly what you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/events">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Globe className="w-5 h-5 mr-2" />
                  Browse All Opportunities
                </Button>
              </Link>
              <Link href="/events?advanced=true">
                <Button variant="outline" size="lg">
                  Advanced Search
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
