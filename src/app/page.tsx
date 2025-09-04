// home/ubuntu/impaktrweb/src/app/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  ArrowRight, 
  Star, 
  Users, 
  Award, 
  BarChart3, 
  Globe, 
  Zap, 
  Shield, 
  Target, 
  TrendingUp, 
  CheckCircle,
  Play,
  Sparkles,
  Heart,
  Building,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading Impaktr...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      
      <main>
        {/* Polished Tech Hero Section */}
        <section className="relative min-h-[70vh] sm:h-[60vh] md:h-[50vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-slate-800 to-gray-800 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900">
          {/* Dreamy animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Large dreamy floating bubbles with glow */}
            <div className="absolute top-20 left-20 w-16 h-16 bg-gradient-to-br from-blue-400/30 to-cyan-400/20 rounded-full shadow-2xl shadow-blue-400/20 animate-bounce blur-sm" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
            <div className="absolute top-32 right-24 w-12 h-12 bg-gradient-to-br from-purple-400/35 to-pink-400/25 rounded-full shadow-2xl shadow-purple-400/25 animate-bounce blur-sm" style={{ animationDelay: '1s', animationDuration: '7s' }}></div>
            <div className="absolute bottom-32 left-32 w-10 h-10 bg-gradient-to-br from-emerald-400/40 to-teal-400/30 rounded-full shadow-2xl shadow-emerald-400/20 animate-bounce blur-sm" style={{ animationDelay: '2s', animationDuration: '5.5s' }}></div>
            <div className="absolute top-1/2 left-16 w-20 h-20 bg-gradient-to-br from-cyan-400/25 to-blue-400/20 rounded-full shadow-2xl shadow-cyan-400/15 animate-bounce blur-sm" style={{ animationDelay: '0.5s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-20 right-16 w-14 h-14 bg-gradient-to-br from-violet-400/30 to-purple-400/25 rounded-full shadow-2xl shadow-violet-400/20 animate-bounce blur-sm" style={{ animationDelay: '1.5s', animationDuration: '6.5s' }}></div>
            <div className="absolute top-16 right-1/3 w-8 h-8 bg-gradient-to-br from-teal-400/35 to-emerald-400/30 rounded-full shadow-2xl shadow-teal-400/25 animate-bounce blur-sm" style={{ animationDelay: '2.5s', animationDuration: '7.5s' }}></div>
            
            {/* Extra large dreamy bubbles */}
            <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-300/15 to-indigo-300/10 rounded-full shadow-2xl shadow-blue-300/10 animate-pulse blur-md" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-gradient-to-br from-purple-300/18 to-pink-300/12 rounded-full shadow-2xl shadow-purple-300/12 animate-pulse blur-md" style={{ animationDelay: '3s', animationDuration: '12s' }}></div>
            <div className="absolute top-3/4 left-3/4 w-18 h-18 bg-gradient-to-br from-emerald-300/16 to-cyan-300/11 rounded-full shadow-2xl shadow-emerald-300/11 animate-pulse blur-md" style={{ animationDelay: '1.5s', animationDuration: '9s' }}></div>
            
            {/* Massive dreamy orbs */}
            <div className="absolute top-1/3 right-1/5 w-32 h-32 bg-gradient-to-br from-rose-300/12 to-pink-300/8 rounded-full shadow-2xl shadow-rose-300/8 animate-pulse blur-lg" style={{ animationDelay: '4s', animationDuration: '15s' }}></div>
            <div className="absolute bottom-1/3 left-1/5 w-28 h-28 bg-gradient-to-br from-indigo-300/14 to-blue-300/9 rounded-full shadow-2xl shadow-indigo-300/9 animate-pulse blur-lg" style={{ animationDelay: '6s', animationDuration: '13s' }}></div>
            
            {/* Enhanced gradient orbs with dreamy effects */}
            <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-br from-emerald-500/25 to-teal-500/15 rounded-full blur-3xl animate-pulse opacity-60 shadow-2xl shadow-emerald-500/10" style={{ animationDuration: '16s' }}></div>
            <div className="absolute top-40 -left-32 w-80 h-80 bg-gradient-to-br from-blue-500/25 to-cyan-500/15 rounded-full blur-3xl animate-pulse opacity-50 shadow-2xl shadow-blue-500/10" style={{ animationDelay: '2s', animationDuration: '18s' }}></div>
            <div className="absolute -bottom-32 right-1/3 w-72 h-72 bg-gradient-to-br from-violet-500/25 to-purple-500/15 rounded-full blur-3xl animate-pulse opacity-70 shadow-2xl shadow-violet-500/10" style={{ animationDelay: '4s', animationDuration: '14s' }}></div>
            
            {/* Dreamy gradient layers */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/8 via-transparent to-purple-900/8 animate-pulse" style={{ animationDuration: '20s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-emerald-900/6 via-transparent to-cyan-900/6 animate-pulse" style={{ animationDelay: '10s', animationDuration: '25s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-pink-900/4 via-transparent to-rose-900/4 animate-pulse" style={{ animationDelay: '15s', animationDuration: '22s' }}></div>
            
            {/* Subtle grid pattern overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-15"></div>
          </div>

          <div className="relative container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center max-w-6xl py-8 sm:py-0">
            {/* Trust indicator */}
            <div className="mb-6 sm:mb-8 flex justify-center px-4 sm:px-0">
              <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-black/20 backdrop-blur-md border border-blue-500/30 rounded-full shadow-2xl">
                <Star className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-yellow-400" />
                <span className="text-blue-100 text-xs sm:text-sm font-medium">Trusted by 50,000+ impact makers worldwide</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-10 text-balance uppercase">
              <span className="block text-white/95">Make Your</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent relative">
                Impact Count
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-24 sm:w-28 md:w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60"></div>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-blue-100/80 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-0">
              The world's first platform to measure, verify, and amplify your social impact. 
              Turn your good deeds into verified credentials that matter.
            </p>

                        {/* Tech-style CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4 sm:px-0">
              {user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl shadow-2xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 border border-blue-400/30 w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                    <BarChart3 className="mr-2 sm:mr-3 w-5 sm:w-6 h-5 sm:h-6 relative z-10" />
                    <span className="relative z-10">View My Impact Dashboard</span>
                    <ArrowRight className="ml-2 sm:ml-3 w-5 sm:w-6 h-5 sm:h-6 group-hover:translate-x-1 transition-transform relative z-10" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl shadow-2xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 border border-blue-400/30 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                      <Sparkles className="mr-2 sm:mr-3 w-5 sm:w-6 h-5 sm:h-6 relative z-10" />
                      <span className="relative z-10">Start Your Impact Journey</span>
                      <ArrowRight className="ml-2 sm:ml-3 w-5 sm:w-6 h-5 sm:h-6 group-hover:translate-x-1 transition-transform relative z-10" />
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="group border-2 border-blue-400/30 bg-black/20 backdrop-blur-md text-blue-100 hover:border-blue-400/60 hover:bg-blue-950/30 px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium rounded-2xl transition-all duration-300 w-full sm:w-auto"
                  >
                    <Play className="mr-2 sm:mr-3 w-5 sm:w-6 h-5 sm:h-6" />
                    <span>Watch Demo</span>
                  </Button>
                </>
              )}
            </div>


          </div>
        </section>

        {/* Polished Stats Section with Enhanced Design */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/80 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950/50">
          {/* Elegant Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Subtle geometric patterns */}
            <div className="absolute top-20 left-20 w-32 h-1 bg-gradient-to-r from-blue-200/30 to-transparent rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '8s' }}></div>
            <div className="absolute top-40 right-32 w-24 h-1 bg-gradient-to-l from-indigo-200/40 to-transparent rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
            <div className="absolute bottom-32 left-32 w-28 h-1 bg-gradient-to-r from-slate-200/35 to-transparent rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '9s' }}></div>
            
            {/* Elegant floating lines */}
            <div className="absolute top-1/3 right-20 w-1 h-40 bg-gradient-to-b from-blue-200/25 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '12s' }}></div>
            <div className="absolute bottom-1/3 left-16 w-1 h-36 bg-gradient-to-t from-indigo-200/30 to-transparent rounded-full animate-pulse" style={{ animationDelay: '3s', animationDuration: '11s' }}></div>
            
            {/* Subtle corner accents */}
            <div className="absolute top-12 right-12 w-16 h-16 border border-blue-200/20 rounded-full animate-pulse" style={{ animationDelay: '5s', animationDuration: '15s' }}></div>
            <div className="absolute bottom-12 left-12 w-20 h-20 border border-indigo-200/25 rounded-full animate-pulse" style={{ animationDelay: '7s', animationDuration: '13s' }}></div>
            
            {/* Minimal dot patterns */}
            <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-blue-300/40 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
            <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-indigo-300/45 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '8s' }}></div>
            <div className="absolute top-2/3 left-1/4 w-2.5 h-2.5 bg-slate-300/35 rounded-full animate-pulse" style={{ animationDelay: '6s', animationDuration: '7s' }}></div>
            
            {/* Elegant gradient overlays */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/30 via-transparent to-indigo-50/20 animate-pulse" style={{ animationDuration: '20s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-slate-50/20 via-transparent to-blue-50/15 animate-pulse" style={{ animationDelay: '10s', animationDuration: '25s' }}></div>
          </div>

          <div className="relative container mx-auto px-8 lg:px-12">
            {/* Enhanced Header */}
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Trusted by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Impact Makers</span> Worldwide
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Join thousands of individuals and organizations making verified social impact
              </p>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {[
                { 
                  label: 'Active Users', 
                  value: '50K+', 
                  icon: Users, 
                  color: 'from-blue-500 to-cyan-500', 
                  shadowColor: 'shadow-blue-500/25',
                  description: 'Global changemakers'
                },
                { 
                  label: 'Impact Hours', 
                  value: '2.5M', 
                  icon: Target, 
                  color: 'from-purple-500 to-pink-500', 
                  shadowColor: 'shadow-purple-500/25',
                  description: 'Verified contributions'
                },
                { 
                  label: 'Organizations', 
                  value: '1,200+', 
                  icon: Building, 
                  color: 'from-indigo-500 to-blue-500', 
                  shadowColor: 'shadow-indigo-500/25',
                  description: 'Partner institutions'
                },
                { 
                  label: 'Certificates', 
                  value: '75K+', 
                  icon: Award, 
                  color: 'from-emerald-500 to-teal-500', 
                  shadowColor: 'shadow-emerald-500/25',
                  description: 'Impact credentials'
                }
              ].map((metric, index) => (
                <div key={index} className="group text-center animate-fade-in" style={{ animationDelay: `${index * 200}ms` }}>
                  {/* Enhanced Icon Container */}
                  <div className={`relative inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-xl ${metric.shadowColor} mb-6 group-hover:scale-110 group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 border border-white/50 dark:border-gray-700/50`}>
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10 rounded-3xl group-hover:opacity-20 transition-opacity duration-300`}></div>
                    
                    {/* Animated Ring */}
                    <div className={`absolute inset-0 rounded-3xl border-2 border-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-30 scale-110 group-hover:scale-125 transition-all duration-500`}></div>
                    
                    {/* Icon */}
                    <metric.icon className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative z-10 group-hover:scale-110 transition-transform duration-300 ${
                      metric.color.includes('blue') ? 'text-blue-600 dark:text-blue-400' :
                      metric.color.includes('purple') ? 'text-purple-600 dark:text-purple-400' :
                      metric.color.includes('indigo') ? 'text-indigo-600 dark:text-indigo-400' :
                      'text-emerald-600 dark:text-emerald-400'
                    }`} />
                  </div>
                  
                  {/* Enhanced Typography */}
                  <div className="space-y-2">
                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2 group-hover:scale-105 transition-transform duration-300">
                      {metric.value}
                    </div>
                    <div className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
                      {metric.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {metric.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call-to-Action */}
            <div className="text-center mt-16">
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                Ready to make your impact count?
              </p>
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                >
                  Join the Movement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works - Redesigned */}
        <section className="relative py-20 overflow-hidden bg-white dark:bg-gray-900">
          {/* Elegant Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Clean geometric lines */}
            <div className="absolute top-16 left-16 w-40 h-0.5 bg-gradient-to-r from-gray-300/40 to-transparent animate-pulse" style={{ animationDelay: '0s', animationDuration: '12s' }}></div>
            <div className="absolute top-32 right-20 w-32 h-0.5 bg-gradient-to-l from-slate-300/45 to-transparent animate-pulse" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
            <div className="absolute bottom-24 left-24 w-36 h-0.5 bg-gradient-to-r from-gray-400/35 to-transparent animate-pulse" style={{ animationDelay: '4s', animationDuration: '14s' }}></div>
            
            {/* Vertical accent lines */}
            <div className="absolute top-1/4 right-16 w-0.5 h-32 bg-gradient-to-b from-gray-300/30 to-transparent animate-pulse" style={{ animationDelay: '1s', animationDuration: '15s' }}></div>
            <div className="absolute bottom-1/4 left-20 w-0.5 h-28 bg-gradient-to-t from-slate-300/35 to-transparent animate-pulse" style={{ animationDelay: '3s', animationDuration: '11s' }}></div>
            
            {/* Minimal corner elements */}
            <div className="absolute top-8 right-8 w-12 h-12 border border-gray-300/25 rounded-full animate-pulse" style={{ animationDelay: '5s', animationDuration: '18s' }}></div>
            <div className="absolute bottom-8 left-8 w-16 h-16 border border-slate-300/30 rounded-full animate-pulse" style={{ animationDelay: '7s', animationDuration: '16s' }}></div>
            
            {/* Subtle dot accents */}
            <div className="absolute top-1/3 left-1/3 w-1.5 h-1.5 bg-gray-400/50 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-slate-400/45 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '9s' }}></div>
            <div className="absolute top-2/3 left-1/5 w-1 h-1 bg-gray-300/40 rounded-full animate-pulse" style={{ animationDelay: '6s', animationDuration: '7s' }}></div>
            
            {/* Refined gradient overlays */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50/20 via-transparent to-slate-50/15 animate-pulse" style={{ animationDuration: '22s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-white/10 via-transparent to-gray-50/10 animate-pulse" style={{ animationDelay: '11s', animationDuration: '26s' }}></div>
          </div>
          <div className="relative container mx-auto px-8 lg:px-12 z-10">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Simple. Verified. <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Powerful.</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Transform your social impact into verified credentials in four easy steps
              </p>
            </div>

            {/* Mobile: Horizontal scroll with peek effect, Desktop: Grid */}
            <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-8">
              {/* Mobile slider container */}
              <div className="md:hidden overflow-x-auto pb-4">
                <div className="flex gap-4 px-4" style={{ width: 'calc(100% + 2rem)' }}>
                  {[
                    {
                      step: '01',
                      title: 'Choose Your Path',
                      description: 'Select your profile type and set your impact goals',
                      icon: <Users className="w-12 h-12" />,
                      gradient: 'from-blue-500 to-cyan-500',
                      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
                    },
                    {
                      step: '02',
                      title: 'Take Action',
                      description: 'Join events, volunteer, or start your own initiatives',
                      icon: <Zap className="w-12 h-12" />,
                      gradient: 'from-purple-500 to-pink-500',
                      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
                    },
                    {
                      step: '03',
                      title: 'Get Verified',
                      description: 'Multiple verification methods ensure authenticity',
                      icon: <Shield className="w-12 h-12" />,
                      gradient: 'from-green-500 to-emerald-500',
                      bgColor: 'bg-green-50 dark:bg-green-950/20'
                    },
                    {
                      step: '04',
                      title: 'Share Impact',
                      description: 'Earn badges, certificates, and build your reputation',
                      icon: <TrendingUp className="w-12 h-12" />,
                      gradient: 'from-orange-500 to-red-500',
                      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
                    }
                  ].map((item, index) => (
                    <Card key={index} className={`relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 ${item.bgColor} flex-shrink-0`} style={{ width: 'calc(75vw - 2rem)' }}>
                      <CardContent className="p-6 text-center relative">
                        {/* Step number */}
                        <div className="absolute top-3 right-3 text-4xl font-bold text-gray-400 dark:text-gray-500 opacity-80">
                          {item.step}
                        </div>
                        
                        {/* Icon */}
                        <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white group-hover:scale-105 transition-all duration-300 shadow-lg`}>
                          {item.icon}
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{item.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Desktop grid - hidden on mobile */}
              <div className="hidden md:contents">
                {[
                  {
                    step: '01',
                    title: 'Choose Your Path',
                    description: 'Select your profile type and set your impact goals',
                    icon: <Users className="w-12 h-12" />,
                    gradient: 'from-blue-500 to-cyan-500',
                    bgColor: 'bg-blue-50 dark:bg-blue-950/20'
                  },
                  {
                    step: '02',
                    title: 'Take Action',
                    description: 'Join events, volunteer, or start your own initiatives',
                    icon: <Zap className="w-12 h-12" />,
                    gradient: 'from-purple-500 to-pink-500',
                    bgColor: 'bg-purple-50 dark:bg-purple-950/20'
                  },
                  {
                    step: '03',
                    title: 'Get Verified',
                    description: 'Multiple verification methods ensure authenticity',
                    icon: <Shield className="w-12 h-12" />,
                    gradient: 'from-green-500 to-emerald-500',
                    bgColor: 'bg-green-50 dark:bg-green-950/20'
                  },
                  {
                    step: '04',
                    title: 'Share Impact',
                    description: 'Earn badges, certificates, and build your reputation',
                    icon: <TrendingUp className="w-12 h-12" />,
                    gradient: 'from-orange-500 to-red-500',
                    bgColor: 'bg-orange-50 dark:bg-orange-950/20'
                  }
                ].map((item, index) => (
                  <Card key={index} className={`relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 ${item.bgColor}`}>
                    <CardContent className="p-6 text-center relative">
                      {/* Step number */}
                      <div className="absolute top-3 right-3 text-4xl font-bold text-gray-400 dark:text-gray-500 opacity-80">
                        {item.step}
                      </div>
                      
                      {/* Icon */}
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${item.gradient} flex items-center justify-center text-white group-hover:scale-105 transition-all duration-300 shadow-lg`}>
                        {item.icon}
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50/80 to-pink-50/60 dark:from-slate-900 dark:via-indigo-950/80 dark:to-purple-950/60">
          {/* Dynamic Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Sophisticated geometric elements */}
            <div className="absolute top-20 left-20 w-48 h-0.5 bg-gradient-to-r from-indigo-300/35 to-transparent animate-pulse" style={{ animationDelay: '0s', animationDuration: '14s' }}></div>
            <div className="absolute top-40 right-24 w-36 h-0.5 bg-gradient-to-l from-purple-300/40 to-transparent animate-pulse" style={{ animationDelay: '2s', animationDuration: '12s' }}></div>
            <div className="absolute bottom-32 left-32 w-40 h-0.5 bg-gradient-to-r from-pink-300/30 to-transparent animate-pulse" style={{ animationDelay: '4s', animationDuration: '16s' }}></div>
            
            {/* Elegant vertical accents */}
            <div className="absolute top-1/4 right-20 w-0.5 h-44 bg-gradient-to-b from-indigo-300/30 to-transparent animate-pulse" style={{ animationDelay: '1s', animationDuration: '18s' }}></div>
            <div className="absolute bottom-1/4 left-16 w-0.5 h-40 bg-gradient-to-t from-purple-300/35 to-transparent animate-pulse" style={{ animationDelay: '3s', animationDuration: '13s' }}></div>
            
            {/* Refined corner details */}
            <div className="absolute top-10 right-10 w-20 h-20 border border-indigo-300/20 rounded-full animate-pulse" style={{ animationDelay: '5s', animationDuration: '20s' }}></div>
            <div className="absolute bottom-10 left-10 w-24 h-24 border border-purple-300/25 rounded-full animate-pulse" style={{ animationDelay: '7s', animationDuration: '17s' }}></div>
            
            {/* Minimalist dot patterns */}
            <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-indigo-400/45 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '9s' }}></div>
            <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '11s' }}></div>
            <div className="absolute top-2/3 left-1/6 w-2.5 h-2.5 bg-pink-400/40 rounded-full animate-pulse" style={{ animationDelay: '6s', animationDuration: '8s' }}></div>
            
            {/* Gradient mesh overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/2 animate-pulse" style={{ animationDuration: '15s' }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-100/10 to-transparent dark:via-indigo-900/5 animate-pulse" style={{ animationDelay: '7s', animationDuration: '20s' }}></div>
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30 dark:opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          <div className="relative container mx-auto px-8 lg:px-12 z-10">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Built for <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Everyone</span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Whether you&apos;re an individual volunteer, NGO, school, or corporation - we have tools for your impact journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'For Individuals',
                  description: 'Track your volunteer hours, earn badges, and build a verified impact portfolio',
                  icon: <Heart className="w-8 h-8" />,
                  features: ['Personal Impact Score', 'Digital Certificates', 'Community Network'],
                  gradient: 'from-pink-500 to-rose-500'
                },
                {
                  title: 'For Organizations',
                  description: 'Manage CSR programs, track employee engagement, and measure real impact',
                  icon: <Building className="w-8 h-8" />,
                  features: ['Team Analytics', 'Impact Reporting', 'Event Management'],
                  gradient: 'from-blue-500 to-indigo-500'
                },
                {
                  title: 'For Schools',
                  description: 'Engage students in social impact and track community service hours',
                  icon: <GraduationCap className="w-8 h-8" />,
                  features: ['Student Tracking', 'Service Learning', 'Achievement Records'],
                  gradient: 'from-green-500 to-teal-500'
                }
              ].map((feature, index) => (
                <Card key={index} className="group hover:shadow-2xl hover:shadow-gray-300/60 dark:hover:shadow-black/40 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-500 ease-out border border-gray-200/50 dark:border-gray-700/50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg shadow-gray-200/40 dark:shadow-gray-900/40">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-105 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-2">
                      {feature.features.map((item, idx) => (
                        <li key={idx} className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
          {/* Dreamy Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Large dreamy floating bubbles with glow */}
            <div className="absolute top-12 left-12 w-24 h-24 bg-gradient-to-br from-blue-300/20 to-cyan-300/15 rounded-full shadow-2xl shadow-blue-300/15 animate-bounce blur-sm" style={{ animationDelay: '0s', animationDuration: '10s' }}></div>
            <div className="absolute top-24 right-16 w-20 h-20 bg-gradient-to-br from-purple-300/25 to-pink-300/20 rounded-full shadow-2xl shadow-purple-300/20 animate-bounce blur-sm" style={{ animationDelay: '2s', animationDuration: '12s' }}></div>
            <div className="absolute bottom-16 left-20 w-18 h-18 bg-gradient-to-br from-cyan-300/22 to-blue-300/18 rounded-full shadow-2xl shadow-cyan-300/18 animate-bounce blur-sm" style={{ animationDelay: '4s', animationDuration: '9s' }}></div>
            <div className="absolute top-1/2 right-8 w-28 h-28 bg-gradient-to-br from-indigo-300/18 to-purple-300/12 rounded-full shadow-2xl shadow-indigo-300/12 animate-bounce blur-sm" style={{ animationDelay: '1s', animationDuration: '14s' }}></div>
            <div className="absolute bottom-8 right-24 w-22 h-22 bg-gradient-to-br from-pink-300/20 to-purple-300/15 rounded-full shadow-2xl shadow-pink-300/15 animate-bounce blur-sm" style={{ animationDelay: '3s', animationDuration: '11s' }}></div>
            
            {/* Extra large dreamy bubbles */}
            <div className="absolute top-1/4 left-1/4 w-36 h-36 bg-gradient-to-br from-blue-200/10 to-cyan-200/6 rounded-full shadow-2xl shadow-blue-200/8 animate-pulse blur-md" style={{ animationDelay: '0s', animationDuration: '18s' }}></div>
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-purple-200/12 to-pink-200/8 rounded-full shadow-2xl shadow-purple-200/10 animate-pulse blur-md" style={{ animationDelay: '6s', animationDuration: '20s' }}></div>
            <div className="absolute top-3/4 left-3/4 w-30 h-30 bg-gradient-to-br from-indigo-200/10 to-purple-200/6 rounded-full shadow-2xl shadow-indigo-200/8 animate-pulse blur-md" style={{ animationDelay: '3s', animationDuration: '16s' }}></div>
            
            {/* Massive dreamy orbs */}
            <div className="absolute top-1/3 right-1/6 w-44 h-44 bg-gradient-to-br from-cyan-100/8 to-blue-100/4 rounded-full shadow-2xl shadow-cyan-100/6 animate-pulse blur-lg" style={{ animationDelay: '8s', animationDuration: '24s' }}></div>
            <div className="absolute bottom-1/3 left-1/6 w-40 h-40 bg-gradient-to-br from-purple-100/10 to-pink-100/6 rounded-full shadow-2xl shadow-purple-100/8 animate-pulse blur-lg" style={{ animationDelay: '10s', animationDuration: '26s' }}></div>
            
            {/* Dreamy gradient layers */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400/4 via-transparent to-purple-400/4 animate-pulse" style={{ animationDuration: '28s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-cyan-400/3 via-transparent to-pink-400/3 animate-pulse" style={{ animationDelay: '14s', animationDuration: '32s' }}></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-400/2 via-transparent to-purple-400/2 animate-pulse" style={{ animationDelay: '21s', animationDuration: '35s' }}></div>
          </div>
          <div className="relative container mx-auto px-8 lg:px-12 text-center z-10">
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Ready to Make Impact <span className="block">That Counts?</span>
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of impact makers who are already building their verified social impact legacy
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Start Free Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-white text-white bg-transparent hover:bg-white/10 hover:text-white px-8 py-3 text-lg font-medium rounded-xl transition-all duration-300"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}