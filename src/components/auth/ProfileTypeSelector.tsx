// home/ubuntu/impaktrweb/src/components/auth/ProfileTypeSelector.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Heart, GraduationCap, Building2, Cross } from 'lucide-react';
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

export function ProfileTypeSelector() {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    
    try {
      // Store selected profile type in sessionStorage for onboarding
      sessionStorage.setItem('selectedProfileType', selectedType);
      
      // Redirect to registration form with profile type
      router.push(`/register?type=${selectedType.toLowerCase()}`);
    } catch (error) {
      console.error('Error selecting profile type:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-bold text-xl brand-gradient-text">Impaktr</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            🌍 Choose Your Impact Profile
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Select how you want to create impact on Impaktr. Your profile type customizes the opportunities, dashboards, and recognition you'll get.
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
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-primary shadow-lg scale-105' 
                    : 'hover:scale-102'
                } ${type.bgColor}`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardContent className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className={`w-12 h-12 rounded-lg ${type.bgColor} border-2 border-border flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${type.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-1">{type.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {type.subtitle}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-foreground font-medium mb-4">
                    {type.description}
                  </p>

                  {/* Features */}
                  <ul className="space-y-2">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
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
            variant="gradient"
            disabled={!selectedType || isLoading}
            onClick={handleContinue}
            className="px-12"
          >
            {isLoading ? 'Processing...' : 'Continue with Selected Profile'}
          </Button>
          
          {selectedType && (
            <p className="text-sm text-muted-foreground mt-3">
              You selected: <span className="font-medium">{profileTypes.find(t => t.id === selectedType)?.title}</span>
            </p>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="w-8 h-1 bg-muted rounded-full" />
          <div className="w-3 h-3 rounded-full bg-muted" />
          <div className="w-8 h-1 bg-muted rounded-full" />
          <div className="w-3 h-3 rounded-full bg-muted" />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Step 1 of 3
        </p>
      </div>
    </div>
  );
}