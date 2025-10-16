// home/ubuntu/impaktrweb/src/app/journey/page.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Heart, GraduationCap, Building2, Cross, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserType } from '@prisma/client';

interface ProfileTypeOption {
  id: UserType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  color: string;
  bgColor: string;
}

const profileTypes: ProfileTypeOption[] = [
  {
    id: UserType.INDIVIDUAL,
    title: 'Individual',
    subtitle: 'For Volunteers, Students, Donors',
    description: 'Build your Impact Score & Badges',
    icon: User,
    features: [
      'Build your Impact Score & Badges',
      'Join or create volunteer events',
      'Apply for scholarships & sponsorships',
      'Share certificates on LinkedIn'
    ],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900'
  },
  {
    id: UserType.NGO,
    title: 'NGO / Non-Profit',
    subtitle: 'For Non-Profits & Community Orgs',
    description: 'Recruit verified volunteers & donors',
    icon: Heart,
    features: [
      'Recruit verified volunteers & donors',
      'Post events & donation campaigns',
      'Issue digital certificates to participants',
      'Track & report impact across SDGs'
    ],
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950 dark:hover:bg-pink-900'
  },
  {
    id: UserType.CORPORATE,
    title: 'Corporate',
    subtitle: 'For Companies & Enterprises',
    description: 'Engage employees in CSR programs',
    icon: Building2,
    features: [
      'Engage employees in CSR programs',
      'Track corporate social impact',
      'Build partnerships with NGOs',
      'Generate ESG reports & compliance'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900'
  },
  {
    id: UserType.SCHOOL,
    title: 'School / University',
    subtitle: 'For Educational Institutions',
    description: 'Integrate service learning programs',
    icon: GraduationCap,
    features: [
      'Integrate service learning programs',
      'Track student volunteer hours',
      'Partner with community organizations',
      'Enhance curriculum with real impact'
    ],
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900'
  },
  {
    id: UserType.HEALTHCARE,
    title: 'Healthcare',
    subtitle: 'For Hospitals & Medical Centers',
    description: 'Coordinate health outreach programs',
    icon: Cross,
    features: [
      'Coordinate health outreach programs',
      'Manage medical volunteer programs',
      'Track community health impact',
      'Connect with health-focused NGOs'
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900'
  }
];

export default function JourneyPage() {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    
    try {
      // Store selected profile type in sessionStorage
      sessionStorage.setItem('selectedProfileType', selectedType);
      
      // Redirect to signup with the selected profile type
      router.push(`/signup?type=${selectedType.toLowerCase()}`);
    } catch (error) {
      console.error('Error selecting profile type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 pt-16">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              impaktr
            </span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Join the global platform for verified social impact and meaningful change.
          </p>
        </div>

        {/* Progress Indicator - Moved to top */}
        <div className="flex items-start justify-center space-x-3 mb-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <span className="text-xs font-medium text-gray-900 dark:text-white mt-1">Select</span>
          </div>
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mt-3.5" />
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">2</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Sign Up</span>
          </div>
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mt-3.5" />
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">3</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Profile</span>
          </div>
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mt-3.5" />
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">4</span>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Complete</span>
          </div>
        </div>

        {/* Profile Type Cards - 3x2 Grid Layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Welcome Card - Special styling */}
          <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <h3 className="mb-4 font-bold leading-tight">
                  <div className="text-2xl md:text-3xl text-white">Choose Your</div>
                  <div>
                    <span className="text-3xl md:text-4xl text-yellow-300">impaktr</span>
                    <span className="text-2xl md:text-3xl text-white"> Profile</span>
                  </div>
                </h3>
                <p className="text-blue-100 text-base font-medium mb-4">
                  Select how you want to create impact
                </p>
              </div>
              <p className="text-blue-50 text-sm leading-relaxed">
                Your profile type customizes the opportunities, dashboards, and recognition you&apos;ll get on your journey to make a difference.
              </p>
            </CardContent>
          </Card>

          {/* Profile Type Cards */}
          {profileTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-0 ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 shadow-xl scale-105 bg-white dark:bg-gray-800' 
                    : 'hover:scale-102 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardContent className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                      type.color === 'text-blue-600' ? 'from-blue-500 to-blue-600' : 
                      type.color === 'text-pink-600' ? 'from-pink-500 to-pink-600' : 
                      type.color === 'text-green-600' ? 'from-green-500 to-green-600' : 
                      type.color === 'text-purple-600' ? 'from-purple-500 to-purple-600' : 
                      'from-orange-500 to-orange-600'
                    } flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{type.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {type.subtitle}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-4">
                    {type.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            size="lg"
            disabled={!selectedType || isLoading}
            onClick={handleContinue}
            className="px-12 py-4 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Continue to Sign Up</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button>
          
          {selectedType && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
              You selected: <span className="font-medium text-gray-900 dark:text-white">{profileTypes.find(t => t.id === selectedType)?.title}</span>
            </p>
          )}
          
          {!selectedType && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Please select a profile type to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

