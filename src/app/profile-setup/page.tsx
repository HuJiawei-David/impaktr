// home/ubuntu/impaktrweb/src/app/profile-setup/page.tsx

'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { UserType } from '@prisma/client';
import { ProfileTypeSelector } from '@/components/auth/ProfileTypeSelector';
import { IndividualRegistrationForm } from '@/components/auth/IndividualRegistrationForm';
import { OrganizationRegistrationForm } from '@/components/auth/OrganizationRegistrationForm';
import { StepByStepOnboarding } from '@/components/auth/StepByStepOnboarding';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function RegisterContent() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [useStepByStep, setUseStepByStep] = useState(true); // Default to step-by-step
  const [selectedProfileType, setSelectedProfileType] = useState<UserType | null>(null);

  // Handle completion of onboarding - must be defined before any early returns
  const handleOnboardingComplete = useCallback(async () => {
    sessionStorage.setItem('registrationComplete', 'true');
    sessionStorage.setItem('onboardingComplete', 'true');
    // Clear the selected profile type since onboarding is complete
    sessionStorage.removeItem('selectedProfileType');
    
    // Redirect directly to dashboard
    router.push('/dashboard');
  }, [router]);

  useEffect(() => {
    // Check if user is already authenticated but not onboarded
    if (!authLoading && !user) {
      // Redirect to NextAuth login
      signIn();
      return;
    }

    // Check if we should use step-by-step onboarding
    const stepMode = searchParams?.get('step') !== 'false';
    setUseStepByStep(stepMode);

    // Get profile type from URL params or sessionStorage
    const typeParam = searchParams?.get('type');
    const storedType = sessionStorage.getItem('selectedProfileType');
    
    if (typeParam) {
      const profileType = typeParam.toUpperCase() as UserType;
      if (Object.values(UserType).includes(profileType)) {
        setSelectedProfileType(profileType);
        sessionStorage.setItem('selectedProfileType', profileType);
      }
    } else if (storedType && Object.values(UserType).includes(storedType as UserType)) {
      setSelectedProfileType(storedType as UserType);
    }
  }, [authLoading, user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="inline-flex items-center space-x-2 mb-4">
            <span className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              impaktr
            </span>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-300">Setting up your profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Use step-by-step onboarding by default
  if (useStepByStep) {
    return (
      <StepByStepOnboarding
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Legacy flow for backward compatibility
  // If no profile type selected, show selector
  if (!selectedProfileType) {
    return <ProfileTypeSelector />;
  }

  // Show appropriate registration form based on profile type
  const renderRegistrationForm = () => {
    switch (selectedProfileType) {
      case UserType.INDIVIDUAL:
        return <IndividualRegistrationForm />;
      
      case UserType.NGO:
      case UserType.CORPORATE:
      case UserType.SCHOOL:
      case UserType.HEALTHCARE:
        return <OrganizationRegistrationForm profileType={selectedProfileType} />;
      
      default:
        return <ProfileTypeSelector />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderRegistrationForm()}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <RegisterContent />
    </Suspense>
  );
}