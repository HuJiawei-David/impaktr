// home/ubuntu/impaktrweb/src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  GraduationCap,
  Building2,
  Stethoscope,
  Calendar,
  Microscope,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Footer } from '@/components/layout/Footer';
import { SDGSimple } from '@/components/home/SDGSimple';

// Build For Everyone Interactive Box Component
function BuildForEveryoneBox() {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const userTypes = [
    {
      title: 'Individuals',
      subtitle: 'Volunteers & Students',
      icon: Heart,
      gradient: 'from-rose-500 to-pink-600',
      bgGradient: 'from-rose-50 to-pink-100',
      description: 'Track your volunteer hours, earn verified badges, and build a portfolio of your social impact.',
      features: ['Personal Impact Score', 'SDG Badges', 'Digital Certificates', 'LinkedIn Integration'],
      stats: '50K+ Active Users'
    },
    {
      title: 'Corporate',
      subtitle: 'Companies & Enterprises',
      icon: Building,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-100',
      description: 'Manage CSR programs, track employee engagement, and measure your organization\'s real impact.',
      features: ['CSR Dashboard', 'Team Engagement', 'Impact Reports', 'ESG Compliance'],
      stats: '500+ Companies'
    },
    {
      title: 'NGOs & Organizations',
      subtitle: 'Non-Profits & Community Groups',
      icon: Building2,
      gradient: 'from-emerald-500 to-green-600',
      bgGradient: 'from-emerald-50 to-green-100',
      description: 'Streamline volunteer management, track outcomes, and showcase your organization\'s impact.',
      features: ['Volunteer Management', 'Event Organization', 'Impact Tracking', 'Donor Reports'],
      stats: '1,200+ Organizations'
    },
    {
      title: 'Healthcare',
      subtitle: 'Medical & Health Organizations',
      icon: Stethoscope,
      gradient: 'from-teal-500 to-cyan-600',
      bgGradient: 'from-teal-50 to-cyan-100',
      description: 'Coordinate health initiatives, manage medical volunteers, and track community health impact.',
      features: ['Health Programs', 'Medical Volunteers', 'Community Outreach', 'Health Metrics'],
      stats: '300+ Health Orgs'
    },
    {
      title: 'Educational Institutions',
      subtitle: 'Schools & Universities',
      icon: GraduationCap,
      gradient: 'from-amber-500 to-orange-600',
      bgGradient: 'from-amber-50 to-orange-100',
      description: 'Integrate service learning, track student engagement, and connect education with real-world impact.',
      features: ['Service Learning', 'Student Tracking', 'Academic Integration', 'Community Projects'],
      stats: '800+ Institutions'
    },
    {
      title: 'Research & Innovation',
      subtitle: 'Labs & Research Centers',
      icon: Microscope,
      gradient: 'from-purple-500 to-violet-600',
      bgGradient: 'from-purple-50 to-violet-100',
      description: 'Connect researchers with community needs, track research impact, and bridge academia with society.',
      features: ['Research Projects', 'Community Labs', 'Impact Studies', 'Innovation Tracking'],
      stats: '150+ Research Centers'
    }
  ];

  const selectedType = userTypes[selectedIndex];
  const Icon = selectedType.icon;

  // Creative diagram component for each type
  const CreativeDiagram = () => {
    switch(selectedIndex) {
      case 0: // Individuals
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Concentric circles representing individual growth */}
            <div className="absolute w-64 h-64 rounded-full bg-white/10 animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="absolute w-48 h-48 rounded-full bg-white/15 animate-pulse" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
            <div className="absolute w-32 h-32 rounded-full bg-white/20 animate-pulse" style={{animationDuration: '2s', animationDelay: '1s'}}></div>
            <div className="relative z-10 bg-white/30 backdrop-blur-md rounded-full p-8 shadow-2xl">
              <Icon className="w-20 h-20 text-white" />
            </div>
            {/* Floating badges around */}
            <div className="absolute top-12 right-16 bg-white/40 backdrop-blur-sm p-3 rounded-lg shadow-xl animate-bounce" style={{animationDuration: '2s'}}>
              <Star className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-12 left-16 bg-white/40 backdrop-blur-sm p-3 rounded-lg shadow-xl animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}>
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        );
      case 1: // Corporate
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Building blocks representing corporate structure */}
            <div className="relative flex flex-col gap-2">
              <div className="flex gap-2 justify-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg shadow-xl animate-pulse"></div>
                <div className="w-20 h-20 bg-white/25 backdrop-blur-sm rounded-lg shadow-xl animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg shadow-xl animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
              <div className="flex gap-2 justify-center">
                <div className="w-20 h-20 bg-white/25 backdrop-blur-sm rounded-lg shadow-xl animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <div className="w-20 h-20 bg-white/40 backdrop-blur-md rounded-lg shadow-2xl flex items-center justify-center">
                  <Icon className="w-12 h-12 text-white" />
                </div>
                <div className="w-20 h-20 bg-white/25 backdrop-blur-sm rounded-lg shadow-xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
              </div>
            </div>
            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full" style={{zIndex: 0}}>
              <line x1="50%" y1="30%" x2="50%" y2="70%" stroke="white" strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
              <line x1="30%" y1="50%" x2="70%" y2="50%" stroke="white" strokeWidth="2" opacity="0.3" strokeDasharray="5,5" />
            </svg>
          </div>
        );
      case 2: // NGOs
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Network of connections */}
            <div className="relative w-64 h-64">
              {/* Central hub */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-md rounded-full p-8 shadow-2xl z-10">
                <Icon className="w-16 h-16 text-white" />
              </div>
              {/* Orbiting elements */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    transform: `rotate(${i * 60}deg) translateY(-100px)`,
                    animation: `spin ${10 + i}s linear infinite`
                  }}
                >
                  <Users className="w-6 h-6 text-white" />
                </div>
              ))}
            </div>
            <style jsx>{`
              @keyframes spin {
                from { transform: rotate(0deg) translateY(-100px); }
                to { transform: rotate(360deg) translateY(-100px); }
              }
            `}</style>
          </div>
        );
      case 3: // Healthcare
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Heartbeat wave design */}
            <div className="relative w-72 h-72">
              {/* Outer pulse circles */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border-2 border-white/20 animate-pulse" style={{animationDuration: '2s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-white/25 animate-pulse" style={{animationDuration: '2s', animationDelay: '0.3s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-2 border-white/30 animate-pulse" style={{animationDuration: '2s', animationDelay: '0.6s'}}></div>
              
              {/* ECG/Heartbeat line */}
              <svg className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-32" viewBox="0 0 200 80">
                <path
                  d="M 0 40 L 40 40 L 50 20 L 60 60 L 70 30 L 80 40 L 120 40 L 130 20 L 140 60 L 150 30 L 160 40 L 200 40"
                  stroke="white"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <animate
                    attributeName="stroke-dasharray"
                    from="0,300"
                    to="300,0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
              
              {/* Central medical icon with glow */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/30 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/40">
                <Icon className="w-16 h-16 text-white relative z-10" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              </div>
              
              {/* Medical plus icons orbiting */}
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-10 h-10 bg-white/40 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    transform: `rotate(${i * 90}deg) translateY(-110px) rotate(-${i * 90}deg)`,
                    animation: `orbit-${i} 8s linear infinite`
                  }}
                >
                  <div className="text-white text-lg font-bold">+</div>
                </div>
              ))}
              
              {/* Health metrics cards */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-white/30 animate-pulse">
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-lg">💚</span> Active
                </span>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white/40 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-white/30 animate-pulse" style={{animationDelay: '0.5s'}}>
                <span className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-lg">🏥</span> 24/7
                </span>
              </div>
            </div>
            <style jsx>{`
              @keyframes orbit-0 {
                from { transform: rotate(0deg) translateY(-110px) rotate(0deg); }
                to { transform: rotate(360deg) translateY(-110px) rotate(-360deg); }
              }
              @keyframes orbit-1 {
                from { transform: rotate(90deg) translateY(-110px) rotate(-90deg); }
                to { transform: rotate(450deg) translateY(-110px) rotate(-450deg); }
              }
              @keyframes orbit-2 {
                from { transform: rotate(180deg) translateY(-110px) rotate(-180deg); }
                to { transform: rotate(540deg) translateY(-110px) rotate(-540deg); }
              }
              @keyframes orbit-3 {
                from { transform: rotate(270deg) translateY(-110px) rotate(-270deg); }
                to { transform: rotate(630deg) translateY(-110px) rotate(-630deg); }
              }
            `}</style>
          </div>
        );
      case 4: // Educational
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Book/learning pyramid */}
            <div className="relative">
              {/* Layered books */}
              <div className="flex flex-col gap-3 items-center">
                <div className="w-48 h-12 bg-white/20 backdrop-blur-sm rounded-lg shadow-xl transform -rotate-2 animate-pulse"></div>
                <div className="w-40 h-12 bg-white/25 backdrop-blur-sm rounded-lg shadow-xl transform rotate-1 animate-pulse" style={{animationDelay: '0.3s'}}></div>
                <div className="w-32 h-12 bg-white/30 backdrop-blur-sm rounded-lg shadow-xl animate-pulse" style={{animationDelay: '0.6s'}}></div>
              </div>
              {/* Graduation cap on top */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white/40 backdrop-blur-md p-6 rounded-lg shadow-2xl">
                <Icon className="w-16 h-16 text-white" />
              </div>
              {/* Floating knowledge symbols */}
              <div className="absolute -right-8 top-8 text-white text-4xl animate-bounce" style={{animationDuration: '2s'}}>💡</div>
              <div className="absolute -left-8 top-16 text-white text-3xl animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}>📚</div>
            </div>
          </div>
        );
      case 5: // Research
        return (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* DNA helix inspired design */}
            <div className="relative w-64 h-80">
              {/* Helix strands */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 300">
                <path
                  d="M 50 0 Q 100 50, 50 100 T 50 200 T 50 300"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.3"
                  strokeDasharray="10,5"
                />
                <path
                  d="M 150 0 Q 100 50, 150 100 T 150 200 T 150 300"
                  stroke="white"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.3"
                  strokeDasharray="10,5"
                />
              </svg>
              {/* Connection points */}
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-white rounded-full shadow-lg animate-pulse"
                  style={{
                    left: `${30 + (i % 2) * 40}%`,
                    top: `${15 + i * 18}%`,
                    animationDelay: `${i * 0.2}s`
                  }}
                ></div>
              ))}
              {/* Central icon */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/40 backdrop-blur-md rounded-full p-8 shadow-2xl">
                <Icon className="w-16 h-16 text-white" />
              </div>
              {/* Atom orbits */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white/20 rounded-full animate-spin" style={{animationDuration: '10s'}}></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full animate-spin" style={{animationDuration: '8s', animationDirection: 'reverse'}}></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto mb-16">
      {/* Main Box */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* Top Content - Split 50/50 */}
        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Left Side - Creative Diagram (50%) */}
          <div className={`w-full md:w-1/2 bg-gradient-to-br ${selectedType.gradient} flex items-center justify-center p-12 transition-all duration-500 overflow-hidden relative`}>
            <CreativeDiagram />
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className={`inline-flex items-center px-6 py-3 rounded-full bg-white/30 backdrop-blur-md text-white text-lg font-bold shadow-xl`}>
                <div className="w-3 h-3 rounded-full bg-white mr-3 animate-pulse"></div>
                {selectedType.stats}
              </div>
            </div>
          </div>

          {/* Right Side - Content (50%) */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-6">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {selectedType.title}
              </h3>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
                {selectedType.subtitle}
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                {selectedType.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
                Key Features:
              </h4>
              <ul className="space-y-3">
                {selectedType.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-gray-600 dark:text-gray-400">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${selectedType.gradient} flex items-center justify-center mr-3 flex-shrink-0`}>
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-base">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {userTypes.map((type, index) => {
              const ButtonIcon = type.icon;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`group flex flex-col items-center justify-center gap-2 px-2 py-4 rounded-xl font-medium transition-all duration-300 ${
                    selectedIndex === index
                      ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg scale-105`
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    selectedIndex === index
                      ? 'bg-white/20'
                      : `bg-gradient-to-r ${type.gradient} group-hover:scale-110`
                  }`}>
                    <ButtonIcon className={`w-6 h-6 ${
                      selectedIndex === index ? 'text-white' : 'text-white'
                    }`} />
                  </div>
                  <span className="text-xs text-center leading-tight">{type.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [isLoading, user, router]);

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

  // Don't render landing page content for authenticated users
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-slate-600 dark:text-slate-300">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main>
        {/* Polished Tech Hero Section */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950 pt-20 pb-12">
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
              <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/50 rounded-full shadow-lg">
                <Star className="w-3 sm:w-4 h-3 sm:h-4 mr-2 text-yellow-500 dark:text-yellow-400" />
                <span className="text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium">Trusted by 50,000+ impact makers worldwide</span>
              </div>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight mb-10 text-balance uppercase">
              <span className="block text-gray-900 dark:text-white">Make Your</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent relative">
                Impact Count
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-24 sm:w-28 md:w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-60"></div>
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-0">
              The world's first platform to measure, verify, and amplify your social impact. 
              Turn your good deeds into verified credentials that matter.
            </p>

            {/* Sign In / Sign Up Buttons */}
            <div className="flex flex-col gap-4 justify-center items-center mb-8 sm:mb-10 px-4 sm:px-0">
              <Link href="/signup" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                  className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white px-8 sm:px-14 py-4 sm:py-5 text-lg sm:text-xl font-semibold rounded-2xl shadow-2xl shadow-blue-500/25 transform hover:scale-105 transition-all duration-300 border border-blue-400/30 w-full sm:w-auto min-w-[280px] sm:min-w-[320px]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl"></div>
                      <span className="relative z-10">Start Your Impact Journey</span>
                    </Button>
                  </Link>
                  
              <Link href="/signin" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg" 
                  className="border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:border-blue-700 dark:hover:border-blue-400 px-8 sm:px-14 py-4 sm:py-5 text-lg sm:text-xl font-medium rounded-2xl transition-all duration-300 w-full sm:w-auto min-w-[280px] sm:min-w-[320px] shadow-lg"
                  >
                  <span>Sign In</span>
                  </Button>
              </Link>
            </div>



          </div>
        </section>

        {/* SDG Section - Aligned with UN Sustainable Development Goals */}
        <SDGSimple />

        {/* Polished Stats Section with Plain White Background */}
        <section className="relative py-20 bg-gray-50 dark:bg-gray-900">

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

        {/* Explore Opportunities Section */}
        <section className="relative py-20 overflow-hidden bg-white dark:bg-gray-900">
          {/* Wave pattern background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* SVG Wave patterns */}
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="none">
                <path d="M0,200 Q300,100 600,200 T1200,200 L1200,0 L0,0 Z" fill="rgba(16, 185, 129, 0.1)" />
                <path d="M0,400 Q300,300 600,400 T1200,400 L1200,200 L0,200 Z" fill="rgba(5, 150, 105, 0.08)" />
                <path d="M0,600 Q300,500 600,600 T1200,600 L1200,400 L0,400 Z" fill="rgba(6, 182, 212, 0.06)" />
              </svg>
            </div>
            
            {/* Organic leaf shapes */}
            <div className="absolute top-20 left-1/4 w-16 h-8 bg-green-200/30 rounded-full transform rotate-12 animate-pulse" style={{ animationDelay: '0s', animationDuration: '6s' }}></div>
            <div className="absolute top-40 right-1/3 w-12 h-6 bg-emerald-200/40 rounded-full transform -rotate-24 animate-pulse" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-32 left-1/5 w-20 h-10 bg-teal-200/25 rounded-full transform rotate-45 animate-pulse" style={{ animationDelay: '4s', animationDuration: '7s' }}></div>
            
            {/* Floating circles with different sizes */}
            <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-green-300/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
            <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-emerald-300/30 rounded-full animate-bounce" style={{ animationDelay: '3s', animationDuration: '5s' }}></div>
          </div>
          
          <div className="relative container mx-auto px-8 lg:px-12 z-10">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Explore <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Opportunities</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                From volunteering to research, scholarships to sponsorships - find meaningful ways to create lasting impact in your community and beyond.
              </p>
            </div>

            {/* Rectangle Flip Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 justify-items-center">
              {[
                {
                  title: 'Volunteer Events',
                  icon: Calendar,
                  lightBg: 'bg-gradient-to-br from-green-50 to-emerald-100',
                  iconBg: 'from-green-400 to-emerald-500',
                  borderColor: 'border-green-200',
                  textColor: 'text-green-800',
                  description: 'Join community service events and make a direct impact. From local cleanups to global initiatives, find volunteer opportunities that match your passion and schedule.',
                  stats: '2,500+ active events'
                },
                {
                  title: 'Research & Lab Assistant',
                  icon: Microscope,
                  lightBg: 'bg-gradient-to-br from-blue-50 to-cyan-100',
                  iconBg: 'from-blue-400 to-cyan-500',
                  borderColor: 'border-blue-200',
                  textColor: 'text-blue-800',
                  description: 'Contribute to groundbreaking research while gaining valuable experience. Work alongside researchers in labs, field studies, and academic projects.',
                  stats: '800+ research positions'
                },
                {
                  title: 'Scholarship Opportunities',
                  icon: GraduationCap,
                  lightBg: 'bg-gradient-to-br from-purple-50 to-violet-100',
                  iconBg: 'from-purple-400 to-violet-500',
                  borderColor: 'border-purple-200',
                  textColor: 'text-purple-800',
                  description: 'Access funding for your education and professional development. Discover scholarships based on academic merit, community service, and impact potential.',
                  stats: '1,200+ scholarships'
                },
                {
                  title: 'Sponsorship Opportunities',
                  icon: Building,
                  lightBg: 'bg-gradient-to-br from-orange-50 to-red-100',
                  iconBg: 'from-orange-400 to-red-500',
                  borderColor: 'border-orange-200',
                  textColor: 'text-orange-800',
                  description: 'Connect with sponsors for your projects and initiatives. Whether you are starting a nonprofit or organizing an event, find the support you need.',
                  stats: '600+ sponsors available'
                },
                {
                  title: 'Donation Campaigns',
                  icon: DollarSign,
                  lightBg: 'bg-gradient-to-br from-pink-50 to-rose-100',
                  iconBg: 'from-pink-400 to-rose-500',
                  borderColor: 'border-pink-200',
                  textColor: 'text-pink-800',
                  description: 'Support meaningful causes through verified donation campaigns. Every contribution is tracked and verified to ensure maximum impact transparency.',
                  stats: '400+ active campaigns'
                }
              ].map((opportunity, index) => (
                <div key={index} className="group" style={{ perspective: '1000px' }}>
                  <div 
                    className="relative w-64 h-96 transition-transform duration-700 cursor-pointer"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: 'rotateY(0deg)'
                    }}
                    onClick={(e) => {
                      const currentTransform = e.currentTarget.style.transform;
                      if (currentTransform.includes('180deg')) {
                        e.currentTarget.style.transform = 'rotateY(0deg)';
                      } else {
                        e.currentTarget.style.transform = 'rotateY(180deg)';
                      }
                    }}
                  >
                    {/* Front of Card - Light Color Design */}
                    <div 
                      className="absolute inset-0" 
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Card className={`w-full h-full ${opportunity.lightBg} shadow-2xl drop-shadow-xl border-2 ${opportunity.borderColor}`}>
                        <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${opportunity.iconBg} flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            <opportunity.icon className="w-10 h-10" />
                          </div>
                          <h3 className={`font-bold text-xl leading-tight ${opportunity.textColor} mb-4`}>
                            {opportunity.title}
                          </h3>
                          <div className={`px-4 py-2 bg-white/70 rounded-full border ${opportunity.borderColor}`}>
                            <span className={`${opportunity.textColor} text-sm font-medium`}>
                              Click to learn more
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Back of Card - Light Color Design */}
                    <div 
                      className="absolute inset-0" 
                      style={{ 
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <Card className={`w-full h-full ${opportunity.lightBg} shadow-2xl drop-shadow-xl border-2 ${opportunity.borderColor}`}>
                        <CardContent className="p-6 h-full flex flex-col">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${opportunity.iconBg} flex items-center justify-center text-white mb-4 shadow-lg`}>
                            <opportunity.icon className="w-8 h-8" />
                          </div>
                          <h3 className={`font-bold text-xl mb-4 ${opportunity.textColor}`}>
                            {opportunity.title}
                          </h3>
                          <p className={`${opportunity.textColor.replace('800', '700')} text-sm leading-relaxed`}>
                            {opportunity.description}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action */}
            <div className="text-center mt-16">
              <Link href="/opportunities">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  View All Opportunities
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works - Redesigned with Dotted Pattern */}
        <section className="relative py-20 overflow-hidden bg-white dark:bg-gray-900">
          {/* Dotted pattern background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Radial dot pattern */}
            <div className="absolute inset-0 opacity-25" style={{
              backgroundImage: `radial-gradient(circle at 20px 20px, rgba(236, 72, 153, 0.3) 2px, transparent 2px), 
                               radial-gradient(circle at 60px 60px, rgba(251, 113, 133, 0.2) 1px, transparent 1px),
                               radial-gradient(circle at 100px 40px, rgba(249, 115, 22, 0.15) 1.5px, transparent 1.5px)`,
              backgroundSize: '80px 80px, 120px 120px, 160px 160px'
            }}></div>
            
            {/* Scattered larger dots */}
            <div className="absolute top-16 left-1/5 w-8 h-8 bg-rose-300/40 rounded-full animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }}></div>
            <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-pink-300/50 rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '5s' }}></div>
            <div className="absolute bottom-1/4 left-1/3 w-10 h-10 bg-orange-300/30 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '6s' }}></div>
            <div className="absolute top-2/3 right-1/5 w-4 h-4 bg-rose-400/35 rounded-full animate-pulse" style={{ animationDelay: '3s', animationDuration: '4.5s' }}></div>
            
            {/* Connecting lines */}
            <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-rose-200/30 to-pink-200/20 transform rotate-12 animate-pulse" style={{ animationDelay: '1s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/3 right-1/3 w-24 h-0.5 bg-gradient-to-r from-pink-200/25 to-orange-200/15 transform -rotate-12 animate-pulse" style={{ animationDelay: '3s', animationDuration: '7s' }}></div>
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

            {/* Steps with Light Arrows - Bigger Content */}
            <div className="max-w-7xl mx-auto">
              {/* Mobile: Vertical layout */}
              <div className="md:hidden space-y-12">
                  {[
                    {
                      step: '01',
                      title: 'Choose Your Path',
                      description: 'Select your profile type and set your impact goals',
                      icon: <Users className="w-12 h-12" />,
                    color: 'text-blue-500'
                    },
                    {
                      step: '02',
                      title: 'Take Action',
                      description: 'Join events, volunteer, or start your own initiatives',
                      icon: <Zap className="w-12 h-12" />,
                    color: 'text-purple-500'
                    },
                    {
                      step: '03',
                      title: 'Get Verified',
                      description: 'Multiple verification methods ensure authenticity',
                      icon: <Shield className="w-12 h-12" />,
                    color: 'text-green-500'
                    },
                    {
                      step: '04',
                      title: 'Share Impact',
                      description: 'Earn badges, certificates, and build your reputation',
                      icon: <TrendingUp className="w-12 h-12" />,
                    color: 'text-orange-500'
                    }
                  ].map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center">
                    {/* Step Content */}
                    <div className="flex flex-col items-center">
                      {/* Step Number */}
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                        <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">{item.step}</span>
                        </div>
                        
                        {/* Icon */}
                      <div className={`mb-6 ${item.color}`}>
                          {item.icon}
                        </div>
                        
                        {/* Content */}
                      <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">{item.description}</p>
                    </div>
                    
                    {/* Light Arrow - except for last item */}
                    {index < 3 && (
                      <div className="mt-10 flex flex-col items-center">
                        <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300/60 to-gray-400/40 dark:from-gray-600/60 dark:to-gray-500/40"></div>
                        <div className="w-0 h-0 border-l-3 border-r-3 border-t-6 border-l-transparent border-r-transparent border-t-gray-400/40 dark:border-t-gray-500/40"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop: Horizontal layout with arrows */}
              <div className="hidden md:flex md:items-center md:justify-between">
                {[
                  {
                    step: '01',
                    title: 'Choose Your Path',
                    description: 'Select your profile type and set your impact goals',
                    icon: <Users className="w-12 h-12" />,
                    color: 'text-blue-500'
                  },
                  {
                    step: '02',
                    title: 'Take Action',
                    description: 'Join events, volunteer, or start your own initiatives',
                    icon: <Zap className="w-12 h-12" />,
                    color: 'text-purple-500'
                  },
                  {
                    step: '03',
                    title: 'Get Verified',
                    description: 'Multiple verification methods ensure authenticity',
                    icon: <Shield className="w-12 h-12" />,
                    color: 'text-green-500'
                  },
                  {
                    step: '04',
                    title: 'Share Impact',
                    description: 'Earn badges, certificates, and build your reputation',
                    icon: <TrendingUp className="w-12 h-12" />,
                    color: 'text-orange-500'
                  }
                ].map((item, index) => (
                  <React.Fragment key={index}>
                    {/* Step Content */}
                    <div className="flex flex-col items-center text-center max-w-sm">
                      {/* Step Number */}
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
                        <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">{item.step}</span>
                      </div>
                      
                      {/* Icon */}
                      <div className={`mb-6 ${item.color}`}>
                        {item.icon}
                      </div>
                      
                      {/* Content */}
                      <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                    
                    {/* Light Arrow - except for last item */}
                    {index < 3 && (
                      <div className="flex items-center mx-6">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-gray-300/60 to-gray-400/40 dark:from-gray-600/60 dark:to-gray-500/40"></div>
                        <div className="w-0 h-0 border-t-3 border-b-3 border-l-6 border-t-transparent border-b-transparent border-l-gray-400/40 dark:border-l-gray-500/40 ml-1"></div>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Build for Everyone Section - Redesigned with Interactive Box */}
        <section className="relative py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Built for{' '}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                  Everyone
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Our platform adapts to your unique needs, whether you're an individual volunteer, 
                a corporate team, or a community organization making a difference.
              </p>
            </div>

            {/* Interactive Flashcard Box */}
            <BuildForEveryoneBox />

            {/* Bottom CTA */}
            <div className="text-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Start Your Impact Journey?
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of individuals and organizations already making verified impact. 
                  Choose your path and start building a better world today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    Get Started Free
                  </Button>
                  <Button variant="outline" className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-3 rounded-xl transition-all duration-300">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Ready to Make Impact */}
        <section className="relative py-16 overflow-hidden bg-white dark:bg-gray-900">
          {/* Starburst pattern background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Radiating lines from center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-0.5 h-32 bg-gradient-to-t from-transparent via-violet-200/20 to-transparent animate-pulse" 
                  style={{ 
                    transform: `rotate(${i * 30}deg)`, 
                    transformOrigin: 'bottom center',
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '4s'
                  }}
                ></div>
              ))}
            </div>
            
            {/* Star shapes */}
            <div className="absolute top-16 left-1/4 w-8 h-8 bg-violet-300/30" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
            <div className="absolute top-1/3 right-1/5 w-6 h-6 bg-purple-300/40" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
            <div className="absolute bottom-1/4 left-1/5 w-10 h-10 bg-indigo-300/25" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}></div>
            
            {/* Concentric circles */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-violet-200/20 rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-purple-200/30 rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-200/40 rounded-full animate-pulse" style={{ animationDelay: '4s', animationDuration: '4s' }}></div>
          </div>
          <div className="relative container mx-auto px-8 lg:px-12 text-center z-10">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Make Impact <span className="block">That Counts?</span>
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
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