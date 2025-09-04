// home/ubuntu/impaktrweb/src/components/home/StatsSection.tsx

'use client';

import React from 'react';
import { TrendingUp, Users, Clock, Globe, Award, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const stats = [
  {
    icon: Users,
    value: '50,000+',
    label: 'Verified Volunteers',
    description: 'Active users making impact globally',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    icon: Clock,
    value: '1.2M',
    label: 'Impact Hours Logged',
    description: 'Verified volunteer hours contributed',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    icon: Building2,
    value: '500+',
    label: 'Organizations',
    description: 'NGOs, schools, and companies',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    icon: Award,
    value: '15,000+',
    label: 'Badges Earned',
    description: 'SDG achievements unlocked',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    icon: Globe,
    value: '45',
    label: 'Countries',
    description: 'Global reach and impact',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    icon: TrendingUp,
    value: '98%',
    label: 'Satisfaction Rate',
    description: 'User satisfaction with platform',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/20',
    gradient: 'from-teal-500 to-cyan-500'
  }
];

export function StatsSection() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Global Impact by the Numbers
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of individuals and organizations already making verified, measurable impact worldwide
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg overflow-hidden relative"
              >
                {/* Background gradient effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <CardContent className="p-8 text-center relative">
                  {/* Icon */}
                  <div className={`w-16 h-16 mx-auto mb-6 rounded-full ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  
                  {/* Value */}
                  <div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-2 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {stat.label}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-muted-foreground text-sm">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">17</div>
            <div className="text-sm text-muted-foreground">UN SDG Goals Covered</div>
          </div>
          
          <div className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">68</div>
            <div className="text-sm text-muted-foreground">Achievement Badges</div>
          </div>
          
          <div className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">24/7</div>
            <div className="text-sm text-muted-foreground">Platform Availability</div>
          </div>
          
          <div className="p-4">
            <div className="text-2xl font-bold text-primary mb-1">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime Reliability</div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground mb-4">
            Ready to join the global impact community?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/signup" 
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Start Your Impact Journey
            </a>
            <a 
              href="/events" 
              className="inline-flex items-center px-6 py-3 border border-primary-200 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-all duration-200"
            >
              Explore Opportunities
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}