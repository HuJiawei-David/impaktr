// home/ubuntu/impaktrweb/src/components/home/HeroSection.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { ArrowRight, Play, Star, Users, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  const { user } = useUser();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-primary-950 dark:via-background dark:to-secondary-950" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-200/20 rounded-full blur-xl animate-pulse-slow" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary-200/20 rounded-full blur-xl animate-pulse-slow delay-300" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-accent-200/10 rounded-full blur-xl animate-pulse-slow delay-700" />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-primary-300/15 rounded-full blur-xl animate-pulse-slow delay-500" />
      </div>

      <div className="relative container mx-auto px-4 text-center">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Star className="w-4 h-4 mr-2" />
            World's First Global Impact Standard
          </Badge>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-balance">
          Measure Your{' '}
          <span className="brand-gradient-text">Social Impact</span>
          <br />
          Like Never Before
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto text-balance">
          Get verified Impact Scores, earn SDG badges, and share certificates for your volunteering, donations, and CSR activities. Join the global movement making social good measurable.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          {user ? (
            <Link href="/dashboard">
              <Button size="xl" variant="gradient" className="group">
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/api/auth/login?screen_hint=signup">
                <Button size="xl" variant="gradient" className="group">
                  Start Building Impact
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Button size="xl" variant="outline" className="group">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-2">
              50K+
            </div>
            <div className="text-sm text-muted-foreground">
              Verified Volunteers
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-2">
              1.2M
            </div>
            <div className="text-sm text-muted-foreground">
              Impact Hours Logged
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-2">
              500+
            </div>
            <div className="text-sm text-muted-foreground">
              Organizations
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold brand-gradient-text mb-2">
              17
            </div>
            <div className="text-sm text-muted-foreground">
              SDG Categories
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Verified Scoring</h3>
              <p className="text-sm text-muted-foreground">GPS, peer & organizer verification</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">SDG Badges</h3>
              <p className="text-sm text-muted-foreground">17 UN goals, 4 tiers each</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-3 p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Global Leaderboards</h3>
              <p className="text-sm text-muted-foreground">Country & organizational rankings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}