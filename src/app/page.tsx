// home/ubuntu/impaktrweb/src/app/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ArrowRight, Star, Users, Award, BarChart3, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { StatsSection } from '@/components/home/StatsSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { SDGSection } from '@/components/home/SDGSection';
import { CTASection } from '@/components/home/CTASection';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <HeroSection />
        
        {/* Stats Section */}
        <StatsSection />
        
        {/* Features Section */}
        <FeaturesSection />
        
        {/* SDG Section */}
        <SDGSection />
        
        {/* How It Works Section */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How <span className="brand-gradient-text">Impaktr</span> Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Four simple steps to start building your verified social impact legacy
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'Choose Your Profile',
                  description: 'Individual, NGO, School, Corporate, or Healthcare',
                  icon: <Users className="w-8 h-8" />,
                  color: 'from-blue-500 to-cyan-500'
                },
                {
                  step: '02',
                  title: 'Join or Create Events',
                  description: 'Participate in verified volunteering and impact activities',
                  icon: <Zap className="w-8 h-8" />,
                  color: 'from-purple-500 to-pink-500'
                },
                {
                  step: '03',
                  title: 'Get Verified',
                  description: 'GPS check-in, peer verification, or organizer approval',
                  icon: <Award className="w-8 h-8" />,
                  color: 'from-green-500 to-emerald-500'
                },
                {
                  step: '04',
                  title: 'Earn & Share',
                  description: 'Build your Impact Score, earn badges, share certificates',
                  icon: <BarChart3 className="w-8 h-8" />,
                  color: 'from-orange-500 to-red-500'
                }
              ].map((item, index) => (
                <Card key={index} className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                      {item.icon}
                    </div>
                    <div className="text-sm font-mono text-primary-600 mb-2">
                      STEP {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <TestimonialsSection />
        
        {/* CTA Section */}
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
}