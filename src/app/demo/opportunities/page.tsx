'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Globe,
  Heart,
  Microscope,
  GraduationCap,
  Building,
  DollarSign,
  Users,
  ArrowRight,
  Calendar,
  MapPin,
  Clock,
  Star,
  Filter,
  Search,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function OpportunitiesDemo() {
  const opportunityCategories = [
    {
      id: 'volunteer',
      title: 'Volunteer Events',
      description: 'Make a difference in your community through hands-on volunteering opportunities',
      icon: Heart,
      color: 'bg-gradient-to-br from-red-500 to-pink-600',
      textColor: 'text-white',
      stats: '2,340 opportunities'
    },
    {
      id: 'research',
      title: 'Research & Lab Assistant',
      description: 'Join cutting-edge research projects and gain valuable academic experience',
      icon: Microscope,
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      textColor: 'text-white',
      stats: '567 positions'
    },
    {
      id: 'scholarships',
      title: 'Scholarships Opportunities',
      description: 'Find funding for your education and professional development',
      icon: GraduationCap,
      color: 'bg-gradient-to-br from-green-500 to-emerald-600',
      textColor: 'text-white',
      stats: '1,234 scholarships'
    },
    {
      id: 'sponsorship',
      title: 'Sponsorship Opportunities',
      description: 'Connect with sponsors for your projects, events, and initiatives',
      icon: Building,
      color: 'bg-gradient-to-br from-purple-500 to-violet-600',
      textColor: 'text-white',
      stats: '789 sponsors'
    },
    {
      id: 'donations',
      title: 'Donation Campaigns',
      description: 'Support meaningful causes and make a financial impact',
      icon: DollarSign,
      color: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      textColor: 'text-white',
      stats: '456 campaigns'
    },
    {
      id: 'community',
      title: 'Community Initiatives',
      description: 'Join local community projects and neighborhood improvements',
      icon: Users,
      color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
      textColor: 'text-white',
      stats: '892 initiatives'
    }
  ];

  const featuredEvents = [
    {
      title: 'Beach Cleanup Initiative',
      organization: 'Ocean Conservation Society',
      location: 'Marina Bay Beach',
      date: 'Tomorrow, 9:00 AM',
      category: 'Environmental',
      participants: 45,
      points: 50,
      image: '/api/placeholder/300/200'
    },
    {
      title: 'Food Bank Volunteer Drive',
      organization: 'Community Food Network',
      location: 'Downtown Community Center',
      date: 'This Friday, 2:00 PM',
      category: 'Social Impact',
      participants: 32,
      points: 40,
      image: '/api/placeholder/300/200'
    },
    {
      title: 'Senior Care Companion Program',
      organization: 'Golden Years Foundation',
      location: 'Sunset Retirement Home',
      date: 'Next Week, 10:00 AM',
      category: 'Healthcare',
      participants: 18,
      points: 60,
      image: '/api/placeholder/300/200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Demo Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Home</span>
              </Link>
              <div className="h-6 w-px bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <Globe className="w-6 h-6" />
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
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Explore Opportunities
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Discover meaningful ways to make an impact. Choose from volunteer work, research positions, scholarships, and more.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search for opportunities, organizations, or causes..."
                className="pl-12 pr-4 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-white/60"
              />
              <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white text-blue-600 hover:bg-gray-100">
                Search
              </Button>
            </div>
          </div>

          {/* CTA to Events Page */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 py-4 text-lg">
              <Globe className="w-5 h-5 mr-2" />
              View All Impact Events
            </Button>
            <div className="text-white/80 text-sm">
              Or browse by category below ↓
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Impact Category
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Find opportunities that align with your interests and make a meaningful difference
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {opportunityCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <Card key={category.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                <div className={`${category.color} p-8 text-center relative`}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                  <CardHeader className="p-0 mb-4 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <IconComponent className="w-12 h-12 opacity-90" />
                      <ArrowRight className="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                    <CardTitle className={`text-xl font-bold mb-2 ${category.textColor}`}>
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 relative z-10">
                    <p className={`${category.textColor} opacity-90 mb-4 text-sm leading-relaxed`}>
                      {category.description}
                    </p>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 ${category.textColor}`}>
                      {category.stats}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Featured Events Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Opportunities
            </h2>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event, index) => (
              <Card key={index} className="group cursor-pointer hover:shadow-lg transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-t-lg flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {event.category}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        +{event.points} points
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {event.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {event.organization}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.date}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {event.participants} participants
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                    <Button size="sm" className="group-hover:bg-blue-600">
                      Join Event
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to make an impact?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Join thousands of volunteers, researchers, and change-makers who are creating positive impact in their communities.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Making Impact
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
