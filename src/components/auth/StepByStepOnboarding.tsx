'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserType } from '@prisma/client';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileTypeSelector } from './ProfileTypeSelector';
import { IndividualRegistrationForm } from './IndividualRegistrationForm';
import { OrganizationRegistrationForm } from './OrganizationRegistrationForm';
import { sdgs } from '@/constants/sdgs';

interface FormData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationality?: string;
  city?: string;
  state?: string;
  occupation?: string;
  organization?: string;
  bio?: string;
  gender?: string;
  country?: string;
  languages?: string[];
  sdgInterests?: number[];
  privacy?: {
    isPublic: boolean;
    showEmail: boolean;
  };
  [key: string]: unknown;
}

interface PreferencesData {
  notifications: {
    email: boolean;
    push: boolean;
    badges: boolean;
    events: boolean;
  };
  privacy: {
    isPublic: boolean;
    showEmail: boolean;
  };
  sdgInterests: number[];
}

interface OnboardingStep {
  id: string;
  title: string;
  component: React.ComponentType<{ onDataChange?: (data: FormData | PreferencesData) => void; formData?: FormData }>;
  props?: Record<string, unknown>;
  validation?: () => boolean;
}

interface StepByStepOnboardingProps {
  initialStep?: number;
  onComplete?: () => void;
}

// Preferences Step Component
const PreferencesStep = React.memo(function PreferencesStep({ onDataChange }: { onDataChange?: (data: PreferencesData) => void }) {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      badges: true,
      events: true,
    },
    privacy: {
      isPublic: true,
      showEmail: false,
    },
    sdgInterests: [] as number[], // Changed to store SDG IDs
  });

  const handleSDGToggle = useCallback((sdgId: number) => {
    setPreferences(prevPreferences => {
      const newSDGInterests = prevPreferences.sdgInterests.includes(sdgId)
        ? prevPreferences.sdgInterests.filter(id => id !== sdgId)
        : [...prevPreferences.sdgInterests, sdgId];
      
      const newPreferences = { ...prevPreferences, sdgInterests: newSDGInterests };
      return newPreferences;
    });
  }, []);

  // Call onDataChange when preferences change
  useEffect(() => {
    if (onDataChange) {
      onDataChange(preferences);
    }
  }, [preferences, onDataChange]);

  return (
    <div className="space-y-8">
      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Notification Preferences
        </h3>
        <div className="space-y-3">
          {Object.entries(preferences.notifications).map(([key, value]) => (
            <label key={key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => {
                  setPreferences(prevPreferences => {
                    const newPreferences = {
                      ...prevPreferences,
                      notifications: {
                        ...prevPreferences.notifications,
                        [key]: e.target.checked,
                      },
                    };
                    return newPreferences;
                  });
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300 capitalize">
                {key === 'email' ? 'Email Notifications' :
                 key === 'push' ? 'Push Notifications' :
                 key === 'badges' ? 'Badge Updates' :
                 'Event Notifications'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Privacy Settings */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Privacy Settings
        </h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.privacy.isPublic}
              onChange={(e) => {
                setPreferences(prevPreferences => {
                  const newPreferences = {
                    ...prevPreferences,
                    privacy: {
                      ...prevPreferences.privacy,
                      isPublic: e.target.checked,
                    },
                  };
                  return newPreferences;
                });
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Make my profile public
            </span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={preferences.privacy.showEmail}
              onChange={(e) => {
                setPreferences(prevPreferences => {
                  const newPreferences = {
                    ...prevPreferences,
                    privacy: {
                      ...prevPreferences.privacy,
                      showEmail: e.target.checked,
                    },
                  };
                  return newPreferences;
                });
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-gray-700 dark:text-gray-300">
              Show email on public profile
            </span>
          </label>
        </div>
      </div>

      {/* SDG Interests */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          UN Sustainable Development Goals
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select the SDGs you&apos;re most passionate about (optional, select up to 8)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sdgs.map((sdg) => (
            <label 
              key={sdg.id} 
              className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                preferences.sdgInterests.includes(sdg.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <input
                type="checkbox"
                checked={preferences.sdgInterests.includes(sdg.id)}
                onChange={() => handleSDGToggle(sdg.id)}
                disabled={!preferences.sdgInterests.includes(sdg.id) && preferences.sdgInterests.length >= 8}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-2xl">{sdg.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      SDG {sdg.id}
                    </span>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sdg.color }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {sdg.shortTitle}
                  </span>
                </div>
              </div>
            </label>
          ))}
        </div>
        {preferences.sdgInterests.length >= 8 && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Maximum of 8 SDGs selected. Deselect one to choose another.
          </p>
        )}
      </div>
    </div>
  );
});

// Review Step Component
const ReviewStep = React.memo(function ReviewStep({ onDataChange, formData }: { onDataChange?: (data: FormData) => void; formData?: FormData }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Almost Done!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Review your information and complete your profile setup
        </p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          What happens next?
        </h4>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span>Your profile will be created and verified</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span>You&apos;ll receive a welcome email with next steps</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span>Start exploring impact opportunities on your dashboard</span>
          </li>
        </ul>
      </div>
    </div>
  );
});

export function StepByStepOnboarding({ initialStep = 1, onComplete }: StepByStepOnboardingProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const [currentStep, setCurrentStep] = useState(1); // Always start from step 1, will be adjusted based on profile type
  const [selectedProfileType, setSelectedProfileType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Stable callback for form data updates
  const handleFormDataChange = useCallback((data: FormData | PreferencesData) => {
    setFormData(data as FormData);
  }, []);

  // Validation function for basic information step - pure function to prevent recreation
  const validateBasicInfo = useCallback((data: FormData) => {
    const errors: string[] = [];
    
    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }
    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    }
    if (!data.dateOfBirth) {
      errors.push('Date of birth is required');
    }
    if (!data.nationality) {
      errors.push('Nationality is required');
    }
    if (!data.city?.trim()) {
      errors.push('City is required');
    }
    if (!data.state?.trim()) {
      errors.push('State is required');
    }
    if (!data.country) {
      errors.push('Country is required');
    }
    
    return { isValid: errors.length === 0, errors };
  }, []);

  // Check if profile type is already selected from sessionStorage or URL
  useEffect(() => {
    const storedType = sessionStorage.getItem('selectedProfileType');
    if (storedType && Object.values(UserType).includes(storedType as UserType)) {
      setSelectedProfileType(storedType as UserType);
    }
  }, []);

  // Create steps array conditionally based on whether profile type is already selected
  const steps = React.useMemo(() => {
    // If no profile type is selected, only show the profile type selection step
    if (!selectedProfileType) {
      return [
        {
          id: 'profile-type',
          title: 'Profile Type',
          component: ProfileTypeSelector,
        }
      ];
    }

    // Once profile type is selected, show the rest of the steps
    const baseSteps = [
      {
        id: 'basic-info',
        title: 'Basic Information',
        component: selectedProfileType === UserType.INDIVIDUAL 
          ? IndividualRegistrationForm 
          : OrganizationRegistrationForm,
        props: { 
          profileType: selectedProfileType,
          isStepMode: true,
        },
      },
      {
        id: 'preferences',
        title: 'Preferences',
        component: PreferencesStep,
      },
      {
        id: 'review',
        title: 'Review & Complete',
        component: ReviewStep,
      },
    ];

    return baseSteps;
  }, [selectedProfileType]);

  const stepTitles = React.useMemo(() => steps.map(step => step.title), [steps]);

  const handleNext = async () => {
    // Clear previous validation errors
    setValidationErrors([]);
    
    // Handle validation based on step ID instead of step number
    const currentStepData = steps[currentStep - 1];
    if (currentStepData?.id === 'basic-info' && selectedProfileType) {
      const validation = validateBasicInfo(formData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return; // Don't proceed if validation fails
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Collect all form data including SDG interests
      const allFormData = {
        ...formData,
        // Ensure SDG interests are included in the final submission
        sdgFocus: formData.sdgInterests || [],
        // Include other preferences
        isPublic: formData.privacy?.isPublic ?? true,
        showEmail: formData.privacy?.showEmail ?? false,
      };

      console.log('Submitting form data:', allFormData);

      // Create FormData for submission
      const submitData = new FormData();
      
      // Append all form data with proper formatting
      Object.entries(allFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'privacy' && key !== 'sdgInterests') {
          if (Array.isArray(value)) {
            submitData.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            submitData.append(key, value.toString());
          } else if (typeof value === 'object') {
            // Skip nested objects that aren't arrays
            return;
          } else {
            submitData.append(key, value.toString());
          }
        }
      });

      // Log what we're sending
      const formDataEntries: Record<string, string> = {};
      submitData.forEach((value, key) => {
        formDataEntries[key] = value.toString();
      });
      console.log('FormData entries:', formDataEntries);

      // Submit to registration API
      const response = await fetch('/api/users/register', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration failed:', errorData);
        
        // Show detailed error message
        if (errorData.details) {
          const fieldErrors = errorData.details.map((d: { field: string; message: string }) => 
            `${d.field}: ${d.message}`
          ).join(', ');
          throw new Error(`Validation failed: ${fieldErrors}`);
        }
        
        throw new Error(errorData.error || 'Registration failed');
      }

      // Handle completion logic here
      if (onComplete) {
        await onComplete();
      } else {
        // Default completion behavior
        sessionStorage.setItem('onboardingComplete', 'true');
        // Use window.location for navigation to avoid router issues
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete registration. Please check all required fields.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileTypeSelect = (type: UserType) => {
    setSelectedProfileType(type);
    sessionStorage.setItem('selectedProfileType', type);
    // Reset to step 1 (which will now be the basic-info step)
    setCurrentStep(1);
  };

  const renderCurrentStep = () => {
    const step = steps[currentStep - 1];

    if (step.id === 'profile-type') {
      return <ProfileTypeSelector onSelect={handleProfileTypeSelect} />;
    }

    // Only spread props if they exist
    if ('props' in step && step.props) {
      const StepComponent = step.component;
      return <StepComponent {...step.props} onDataChange={handleFormDataChange} />;
    }

    // For steps without props (like PreferencesStep, ReviewStep)
    const StepComponent = step.component;
    if (step.id === 'preferences') {
      return <StepComponent onDataChange={handleFormDataChange} />;
    }
    if (step.id === 'review') {
      return <StepComponent formData={formData} />;
    }
    return <StepComponent />;
  };

  const canProceed = useCallback((data: FormData) => {
    // Only validate basic info step
    const currentStepData = steps[currentStep - 1];
    if (currentStepData?.id === 'basic-info' && selectedProfileType) {
      return validateBasicInfo(data).isValid;
    }
    return true; // Other steps are always valid for now
  }, [currentStep, selectedProfileType, validateBasicInfo, steps]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" style={{ paddingTop: '80px' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl dark:shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 mb-6">
                <span className="font-bold text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  impaktr
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 dark:text-white">
                Complete Your Profile
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Let&apos;s get you set up to start making an impact
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl dark:shadow-2xl">
          <CardContent className="p-6">
            <ProgressBar
              currentStep={currentStep}
              totalSteps={steps.length}
              steps={stepTitles}
            />
          </CardContent>
        </Card>

        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <Card className="mb-6 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-700 shadow-lg dark:shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                    Please complete all required fields
                  </h3>
                  <div>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step Content */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl dark:shadow-2xl">
          <CardContent className="p-8">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="relative z-10 flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg dark:shadow-xl">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg transition-all duration-200"
          >
            ← Previous
          </Button>

          <div className="flex space-x-4">
            {currentStep < steps.length ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed(formData) || isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Next Step →'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed(formData) || isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Completing...</span>
                  </div>
                ) : (
                  'Complete Setup ✓'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
