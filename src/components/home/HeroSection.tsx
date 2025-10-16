// home/ubuntu/impaktrweb/src/components/home/HeroSection.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Play, Star, Users, Award, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function HeroSection() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 dark:from-gray-950 dark:via-slate-950 dark:to-gray-900">
      {/* Enhanced animated background with subtle tech aesthetic */}
      <div className="absolute inset-0">
        {/* Grid pattern overlay for tech feel */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse animation-delay-300" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse animation-delay-700" />
      </div>

      <div className="relative container mx-auto px-6 text-center max-w-6xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center animate-fade-in">
          <Badge variant="secondary" className="px-6 py-3 text-base bg-white/20 backdrop-blur-sm border-white/30 text-slate-700 dark:text-slate-200 shadow-lg">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            World&apos;s First Global Impact Standard
          </Badge>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 text-balance leading-tight">
          <span className="text-slate-800 dark:text-slate-100">Measure Your</span>{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Social Impact
          </span>
          <br />
          <span className="text-slate-800 dark:text-slate-100">Like Never Before</span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto text-balance leading-relaxed">
          Get verified Impact Scores, earn SDG badges, and share certificates for your volunteering, donations, and CSR activities. Join the global movement making social good measurable.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
          {user ? (
            <Link href="/dashboard">
              <Button 
                size="lg" 
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="group border-2 border-slate-300 hover:border-blue-400 text-slate-700 dark:text-slate-200 px-8 py-4 text-lg font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all duration-200"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-200">
              50K+
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Verified Volunteers
            </div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-200">
              1.2M
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Impact Hours Logged
            </div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-200">
              500+
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Organizations
            </div>
          </div>
          
          <div className="text-center group">
            <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-200">
              17
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
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