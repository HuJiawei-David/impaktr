// home/ubuntu/impaktrweb/src/app/onboarding/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Target, 
  Bell, 
  Award,
  ArrowRight,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { useForm } from 'react-hook-form';

interface OnboardingData {
  sdgFocus: number[];
  preferredActivities: string[];
  motivation: string[];
  availability: {
    hoursPerWeek: number;
    weekdayAvailable: boolean;
    weekendAvailable: boolean;
  };
  impactGoal: {
    targetHours: number;
    targetPeriod: string;
  };
  verificationPreference: string;
  notifications: {
    email: boolean;
    push: boolean;
    badges: boolean;
    events: boolean;
    verifications: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showProgress: boolean;
    allowRecommendations: boolean;
  };
}

const activities = [
  { id: 'volunteering', label: 'Volunteering', icon: '🤝' },
  { id: 'donating', label: 'Donating', icon: '💝' },
  { id: 'research', label: 'Research Participation', icon: '🔬' },
  { id: 'scholarships', label: 'Scholarships', icon: '🎓' },
  { id: 'csr', label: 'CSR Challenges', icon: '🏢' },
  { id: 'mentoring', label: 'Mentoring', icon: '👥' }
];

const verificationOptions = [
  { value: 'self-peer', label: 'Self + Peer Verification', description: 'You report hours, peers confirm' },
  { value: 'organizer', label: 'NGO/Organizer Verification', description: 'Event organizers verify your participation' },
  { value: 'corporate', label: 'Corporate Verification', description: 'Your employer verifies CSR activities' },
  { value: 'school', label: 'School Verification', description: 'Educational institution verifies service learning' }
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [selectedMotivations] = useState<string[]>([]);

  const {
    handleSubmit,
    setValue,
    watch
  } = useForm<OnboardingData>({
    defaultValues: {
      availability: {
        hoursPerWeek: 2,
        weekdayAvailable: true,
        weekendAvailable: true
      },
      impactGoal: {
        targetHours: 50,
        targetPeriod: 'year'
      },
      notifications: {
        email: true,
        push: true,
        badges: true,
        events: true,
        verifications: true
      },
      privacy: {
        publicProfile: true,
        showProgress: true,
        allowRecommendations: true
      }
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/api/auth/login');
      return;
    }

    // Check if registration is complete
    const registrationComplete = sessionStorage.getItem('registrationComplete');
    if (!registrationComplete) {
      router.push('/register');
      return;
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: OnboardingData) => {
    setIsLoading(true);
    
    try {
      const onboardingData = {
        ...data,
        sdgFocus: selectedSDGs,
        preferredActivities: selectedActivities,
        motivation: selectedMotivations
      };

      const response = await fetch('/api/users/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        throw new Error('Onboarding failed');
      }

      // Clear session storage
      sessionStorage.removeItem('selectedProfileType');
      sessionStorage.removeItem('registrationComplete');

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-6 h-6 mr-2" />
                Choose Your Impact Focus
              </CardTitle>
              <p className="text-muted-foreground">
                Select up to 5 UN Sustainable Development Goals that you&apos;re most passionate about
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <SDGSelector
                selectedSDGs={selectedSDGs}
                onSelectionChange={setSelectedSDGs}
                maxSelection={5}
              />

              <div className="space-y-4">
                <Label>What activities interest you most? (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activities.map((activity) => (
                    <Card
                      key={activity.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedActivities.includes(activity.id)
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => {
                        setSelectedActivities(prev => 
                          prev.includes(activity.id)
                            ? prev.filter((id: string) => id !== activity.id)
                            : [...prev, activity.id]
                        );
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{activity.icon}</div>
                          <div className="text-sm font-medium">{activity.label}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="hoursPerWeek">How many hours per week can you contribute?</Label>
                  <Select onValueChange={(value) => setValue('availability.hoursPerWeek', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hours" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1-2 hours</SelectItem>
                      <SelectItem value="3">3-5 hours</SelectItem>
                      <SelectItem value="6">6-10 hours</SelectItem>
                      <SelectItem value="11">11-20 hours</SelectItem>
                      <SelectItem value="21">20+ hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="targetHours">Annual impact goal</Label>
                  <Select onValueChange={(value) => setValue('impactGoal.targetHours', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Set your goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 hours per year</SelectItem>
                      <SelectItem value="50">50 hours per year</SelectItem>
                      <SelectItem value="100">100 hours per year</SelectItem>
                      <SelectItem value="200">200 hours per year</SelectItem>
                      <SelectItem value="300">300+ hours per year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>When are you usually available?</Label>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="weekdays"
                      checked={watch('availability.weekdayAvailable')}
                      onCheckedChange={(checked) => setValue('availability.weekdayAvailable', checked)}
                    />
                    <Label htmlFor="weekdays">Weekdays</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="weekends"
                      checked={watch('availability.weekendAvailable')}
                      onCheckedChange={(checked) => setValue('availability.weekendAvailable', checked)}
                    />
                    <Label htmlFor="weekends">Weekends</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-6 h-6 mr-2" />
                Verification Preferences
              </CardTitle>
              <p className="text-muted-foreground">
                Choose how you&apos;d like your impact hours to be verified for maximum credibility
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Preferred verification method</Label>
                {verificationOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      watch('verificationPreference') === option.value
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => setValue('verificationPreference', option.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{option.label}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                        </div>
                        {watch('verificationPreference') === option.value && (
                          <CheckCircle className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Why Verification Matters
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Verified hours carry more weight in your Impaktr Score™ and are more trusted by employers, universities, and organizations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                Notifications & Privacy
              </CardTitle>
              <p className="text-muted-foreground">
                Customize how you want to be notified and control your privacy settings
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Notification Preferences</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={watch('notifications.email')}
                      onCheckedChange={(checked) => setValue('notifications.email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="badge-notifications">Badge & Achievement Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when you earn new badges</p>
                    </div>
                    <Switch
                      id="badge-notifications"
                      checked={watch('notifications.badges')}
                      onCheckedChange={(checked) => setValue('notifications.badges', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="event-notifications">Event Reminders</Label>
                      <p className="text-sm text-muted-foreground">Reminders for upcoming events</p>
                    </div>
                    <Switch
                      id="event-notifications"
                      checked={watch('notifications.events')}
                      onCheckedChange={(checked) => setValue('notifications.events', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="verification-notifications">Verification Requests</Label>
                      <p className="text-sm text-muted-foreground">When others need your verification</p>
                    </div>
                    <Switch
                      id="verification-notifications"
                      checked={watch('notifications.verifications')}
                      onCheckedChange={(checked) => setValue('notifications.verifications', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Privacy Settings</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="public-profile">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Allow others to find and view your profile</p>
                    </div>
                    <Switch
                      id="public-profile"
                      checked={watch('privacy.publicProfile')}
                      onCheckedChange={(checked) => setValue('privacy.publicProfile', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="show-progress">Show Progress</Label>
                      <p className="text-sm text-muted-foreground">Display your impact score and badges publicly</p>
                    </div>
                    <Switch
                      id="show-progress"
                      checked={watch('privacy.showProgress')}
                      onCheckedChange={(checked) => setValue('privacy.showProgress', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="allow-recommendations">Smart Recommendations</Label>
                      <p className="text-sm text-muted-foreground">Get personalized event and opportunity suggestions</p>
                    </div>
                    <Switch
                      id="allow-recommendations"
                      checked={watch('privacy.allowRecommendations')}
                      onCheckedChange={(checked) => setValue('privacy.allowRecommendations', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center">
              <span className="text-white font-bold text-sm">I</span>
            </div>
            <span className="font-bold text-xl brand-gradient-text">Impaktr</span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Let&apos;s Personalize Your Impact Journey
          </h1>
          <p className="text-muted-foreground mb-6">
            Help us understand your interests and goals so we can provide the best experience
          </p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Step Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
            >
              Back
            </Button>

            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="gradient"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && selectedSDGs.length === 0) ||
                  (currentStep === 2 && selectedMotivations.length === 0) ||
                  isLoading
                }
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading}
                className="px-8"
              >
                {isLoading ? 'Setting Up...' : 'Complete Setup'}
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>

        {/* Step Indicators */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i}>
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
              {i < totalSteps - 1 && (
                <div
                  className={`w-8 h-1 rounded-full transition-colors ${
                    i + 1 < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Preview Card */}
        {currentStep === totalSteps && (
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
                <h3 className="font-semibold text-lg">You&apos;re All Set!</h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">SDG FOCUS</Label>
                  <p className="font-medium">{selectedSDGs.length} goals selected</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ACTIVITIES</Label>
                  <p className="font-medium">{selectedActivities.length} interests</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">GOAL</Label>
                  <p className="font-medium">{watch('impactGoal.targetHours')} hours/year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}