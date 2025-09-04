// home/ubuntu/impaktrweb/src/components/home/CTASection.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Rocket, Star, Users, Award, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function CTASection() {
  const features = [
    {
      icon: Award,
      title: 'Verified Impact Scoring',
      description: 'Get your official Impaktr Score™ with GPS and peer verification'
    },
    {
      icon: Star,
      title: '68 SDG Achievement Badges',
      description: 'Earn progression badges across all 17 UN Sustainable Development Goals'
    },
    {
      icon: Globe,
      title: 'Global Leaderboards',
      description: 'Compare your impact with changemakers worldwide'
    },
    {
      icon: Users,
      title: 'LinkedIn Integration',
      description: 'Share verified certificates and badges on your professional profile'
    }
  ];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800" />
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />
      
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse-slow" />
      <div className="absolute top-32 right-20 w-24 h-24 bg-yellow-400/20 rounded-full blur-xl animate-pulse-slow delay-300" />
      <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-green-400/10 rounded-full blur-xl animate-pulse-slow delay-700" />
      <div className="absolute bottom-32 right-1/3 w-28 h-28 bg-blue-400/15 rounded-full blur-xl animate-pulse-slow delay-500" />

      <div className="relative container mx-auto px-4">
        <div className="text-center text-white mb-16">
          {/* Badge */}
          <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-2">
            <Rocket className="w-4 h-4 mr-2" />
            Ready to Make an Impact?
          </Badge>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Join the Global Movement for
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-green-400 to-blue-400 bg-clip-text text-transparent">
              Verified Social Impact
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-12 leading-relaxed">
            Be part of the world's first platform to measure, verify, and celebrate social good. 
            Turn your volunteering into a globally recognized impact score.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/signup">
              <Button 
                size="lg" 
                className="bg-white text-primary-700 hover:bg-white/90 font-semibold px-8 py-4 text-lg group shadow-xl"
              >
                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                Start Building Impact Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/events">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 py-4 text-lg"
              >
                <Globe className="w-5 h-5 mr-2" />
                Explore Opportunities
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">250K+</div>
              <div className="text-white/80">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">1.2M</div>
              <div className="text-white/80">Verified Hours</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">12K+</div>
              <div className="text-white/80">Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">45</div>
              <div className="text-white/80">Countries</div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-6 bg-white/10 backdrop-blur-sm rounded-full px-8 py-4 border border-white/20">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {/* Avatar placeholders */}
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="text-white/90 text-sm">
                <span className="font-semibold">2,847</span> people joined this week
              </div>
            </div>
            
            <div className="hidden md:block w-px h-6 bg-white/20" />
            
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-white/90 text-sm">
                4.9/5 from <span className="font-semibold">15,000+</span> reviews
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-12">
          <p className="text-white/70 text-lg">
            Free forever • No credit card required • Join in 2 minutes
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background/20 to-transparent" />
    </section>
  );
}