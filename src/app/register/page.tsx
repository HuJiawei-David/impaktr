// home/ubuntu/impaktrweb/src/app/register/page.tsx

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { UserType } from '@prisma/client';
import { ProfileTypeSelector } from '@/components/auth/ProfileTypeSelector';
import { IndividualRegistrationForm } from '@/components/auth/IndividualRegistrationForm';
import { OrganizationRegistrationForm } from '@/components/auth/OrganizationRegistrationForm';

function RegisterContent() {
  const { user, isLoading: authLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedProfileType, setSelectedProfileType] = useState<UserType | null>(null);

  useEffect(() => {
    // Check if user is already authenticated but not onboarded
    if (!authLoading && !user) {
      // Redirect to Auth0 login with signup hint
      window.location.href = '/api/auth/login?screen_hint=signup';
      return;
    }

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
  }, [authLoading, user, searchParams]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return null; // Will redirect in useEffect
  }

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
    <div className="min-h-screen bg-background">
      {renderRegistrationForm()}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}