// home/ubuntu/impaktrweb/src/components/auth/ProfileTypeSelector.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Heart, GraduationCap, Building2, Cross } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserType } from '@/types/user';

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
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900'
  },
  {
    id: UserType.SCHOOL,
    title: 'School / University',
    subtitle: 'For Schools, Colleges & Universities',
    description: 'Post scholarships & exchange programs',
    icon: GraduationCap,
    features: [
      'Post scholarships & exchange programs',
      'Create student leaderboards & service records',
      'Launch verified research opportunities',
      'Generate official impact transcripts'
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900'
  },
  {
    id: UserType.CORPORATE,
    title: 'Company / Corporate',
    subtitle: 'For Employers & CSR Teams',
    description: 'Run CSR programs & recruit volunteers',
    icon: Building2,
    features: [
      'Run CSR programs & recruit volunteers',
      'Fund projects, NGOs & scholarships',
      'Track Corporate Impact Score globally',
      'Download ESG-ready reports'
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900'
  },
  {
    id: UserType.HEALTHCARE,
    title: 'Healthcare Institution',
    subtitle: 'For Hospitals & Research Centres',
    description: 'Post clinical & community volunteering',
    icon: Cross,
    features: [
      'Post clinical & community volunteering',
      'Run research studies & recruit participants',
      'Launch medical donation campaigns',
      'Benchmark health-related SDG contributions'
    ],
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900'
  }
];

interface ProfileTypeSelectorProps {
  onSelect?: (type: UserType) => void;
  isStepMode?: boolean;
}

export function ProfileTypeSelector({ onSelect, isStepMode = false }: ProfileTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedType) return;

    if (isStepMode && onSelect) {
      onSelect(selectedType);
      return;
    }

    setIsLoading(true);
    
    try {
      // Store selected profile type in sessionStorage for onboarding
      sessionStorage.setItem('selectedProfileType', selectedType);
      
      // Redirect to profile setup form with profile type
      router.push(`/profile-setup?type=${selectedType.toLowerCase()}`);
    } catch (error) {
      console.error('Error selecting profile type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-6">
            <span className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              impaktr
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            🌍 Choose Your Impact Profile
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Select how you want to create impact on Impaktr. Your profile type customizes the opportunities, dashboards, and recognition you&apos;ll get.
          </p>
        </div>

        {/* Profile Type Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                        <div className="w-2 h-2 rounded-full bg-white" />
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
                  
                  {isSelected && (
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        ✓ Selected - Click Continue to proceed
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue Button - Only show when not in step mode */}
        {!isStepMode && (
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
                'Continue Setup →'
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
        )}

        {/* Step mode selection feedback */}
        {isStepMode && selectedType && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-green-700 dark:text-green-300 font-medium">
                Selected: {profileTypes.find(t => t.id === selectedType)?.title}
              </span>
            </div>
          </div>
        )}

        {/* Progress Indicator - Only show when not in step mode */}
        {!isStepMode && (
          <>
            <div className="flex items-center justify-center space-x-2 mt-8">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              Step 1 of 3
            </p>
          </>
        )}
      </div>
    </div>
  );
}