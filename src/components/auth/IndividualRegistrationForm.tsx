// home/ubuntu/impaktrweb/src/components/auth/IndividualRegistrationForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { CalendarDays, Upload, MapPin, Languages, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { countries } from '@/constants/countries';
import { languages } from '@/constants/languages';

interface IndividualRegistrationData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  nationality: string;
  city: string;
  state: string;
  country: string;
  organization?: string;
  occupation?: string;
  bio?: string;
  languages: string[];
  website?: string;
  showEmail: boolean;
  isPublic: boolean;
}

interface IndividualRegistrationFormProps {
  isStepMode?: boolean;
  onDataChange?: (data: any) => void;
  validationErrors?: string[];
}

export function IndividualRegistrationForm({ isStepMode = false, onDataChange, validationErrors = [] }: IndividualRegistrationFormProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<IndividualRegistrationData>({
    defaultValues: {
      firstName: (user?.name?.split(' ')[0] || '') as string,
      lastName: (user?.name?.split(' ').slice(1).join(' ') || '') as string,
      showEmail: false,
      isPublic: true,
      languages: []
    }
  });


  // Helper function to check if a field has validation errors
  const hasFieldError = (fieldName: string) => {
    return validationErrors.some(error => 
      error.toLowerCase().includes(fieldName.toLowerCase()) ||
      error.toLowerCase().includes(fieldName.replace(/([A-Z])/g, ' $1').toLowerCase())
    );
  };

  // Simple validation function that doesn't cause infinite loops
  const validateForm = () => {
    const firstName = watch('firstName');
    const lastName = watch('lastName');
    const dateOfBirth = watch('dateOfBirth');
    const nationality = watch('nationality');
    const country = watch('country');
    const city = watch('city');
    const state = watch('state');
    
    return firstName && lastName && dateOfBirth && nationality && country && city && state;
  };

  // Add validation rules for Select fields
  const validateNationality = (value: string) => {
    if (!value) return 'Nationality is required';
    return true;
  };

  const validateCountry = (value: string) => {
    if (!value) return 'Country is required';
    return true;
  };

  const handleLanguageAdd = (language: string) => {
    if (!selectedLanguages.includes(language) && selectedLanguages.length < 5) {
      const newLanguages = [...selectedLanguages, language];
      setSelectedLanguages(newLanguages);
      setValue('languages', newLanguages);
    }
  };

  const handleLanguageRemove = (language: string) => {
    const newLanguages = selectedLanguages.filter(lang => lang !== language);
    setSelectedLanguages(newLanguages);
    setValue('languages', newLanguages);
  };

  // Watch form data and update parent component in real-time
  const watchedData = watch();
  
  useEffect(() => {
    if (isStepMode && onDataChange) {
      // Use a subscription to watch form changes instead of watching the entire object
      const subscription = watch((value) => {
        onDataChange(value);
      });
      return () => subscription.unsubscribe();
    }
    return undefined;
  }, [isStepMode, onDataChange, watch]);

  const onSubmit: SubmitHandler<IndividualRegistrationData> = async (data) => {
    // In step mode, just update the data and let the parent handle submission
    if (isStepMode) {
      onDataChange?.(data);
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!data.nationality) {
        throw new Error('Nationality is required');
      }
      if (!data.country) {
        throw new Error('Country is required');
      }
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append profile data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      console.log('Form data being sent:', data);
      console.log('FormData entries:', Array.from(formData.entries()));

      // Append profile picture if selected
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      // Submit registration data
      const response = await fetch('/api/users/register', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Registration API error:', errorData);
        throw new Error(errorData.error || `Registration failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('Registration successful:', result);
      
      // Store registration completion and redirect to onboarding
      sessionStorage.setItem('registrationComplete', 'true');
      router.push('/onboarding');
      
    } catch (error) {
      console.error('Registration error:', error);
      // Handle error (show toast notification)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isStepMode ? "" : "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8"}>
      <div className={isStepMode ? "" : "container mx-auto px-4 max-w-2xl"}>
        {/* Header - Only show when not in step mode */}
        {!isStepMode && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-2 mb-6">
              <span className="font-bold text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                impaktr
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Tell us about yourself to personalize your impact journey
            </p>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <CalendarDays className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName', { required: 'First name is required' })}
                    error={errors.firstName?.message || (hasFieldError('firstName') ? 'First name is required' : undefined)}
                    className={hasFieldError('firstName') ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={errors.lastName?.message || (hasFieldError('lastName') ? 'Last name is required' : undefined)}
                    className={hasFieldError('lastName') ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </div>
              </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    error={errors.dateOfBirth?.message || (hasFieldError('dateOfBirth') ? 'Date of birth is required' : undefined)}
                    className={hasFieldError('dateOfBirth') ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </div>
                
                <div className="mb-6">
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <SearchableSelect
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "non-binary", label: "Non-binary" },
                      { value: "prefer-not-to-say", label: "Prefer not to say" },
                      { value: "other", label: "Other" }
                    ]}
                    value={watch('gender')}
                    placeholder="Search gender..."
                    onValueChange={(value) => setValue('gender', value)}
                  />
                </div>

                <div className="mb-6">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <SearchableSelect
                    options={countries.map(country => ({
                      value: country.name,
                      label: country.name,
                      flag: country.flag
                    }))}
                    value={watch('nationality')}
                    placeholder="Search nationality..."
                    onValueChange={(value) => setValue('nationality', value, { shouldValidate: true })}
                    error={hasFieldError('nationality')}
                  />
                  {(errors.nationality || hasFieldError('nationality')) && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.nationality?.message || 'Nationality is required'}
                    </p>
                  )}
                </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <MapPin className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-6">
                <Label htmlFor="country">Country *</Label>
                <SearchableSelect
                  options={countries.map(country => ({
                    value: country.name,
                    label: country.name,
                    flag: country.flag
                  }))}
                  value={watch('country')}
                  placeholder="Search country..."
                  onValueChange={(value) => setValue('country', value, { shouldValidate: true })}
                  error={hasFieldError('country')}
                />
                {(errors.country || hasFieldError('country')) && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.country?.message || 'Country is required'}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('city', { required: 'City is required' })}
                    placeholder="e.g. New York City"
                    error={errors.city?.message || (hasFieldError('city') ? 'City is required' : undefined)}
                    className={hasFieldError('city') ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    {...register('state', { required: 'State is required' })}
                    placeholder="e.g. New York"
                    error={errors.state?.message || (hasFieldError('state') ? 'State is required' : undefined)}
                    className={hasFieldError('state') ? 'border-red-500 focus:border-red-500' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Building className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="occupation">Current Occupation</Label>
                <Input
                  id="occupation"
                  {...register('occupation')}
                  placeholder="e.g. Software Engineer, Student, Teacher"
                />
              </div>

              <div>
                <Label htmlFor="organization">Organization/School (Optional)</Label>
                <Input
                  id="organization"
                  {...register('organization')}
                  placeholder="e.g. Stanford University, Microsoft"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Tell us a bit about yourself and your interests..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="website">Website/Portfolio (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  placeholder="https://your-website.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Languages className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Languages Spoken
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Languages (up to 5)</Label>
                <SearchableSelect
                  options={languages
                    .filter(lang => !selectedLanguages.includes(lang.name))
                    .map(language => ({
                      value: language.name,
                      label: language.name
                    }))}
                  value=""
                  placeholder="Search and add a language..."
                  onValueChange={handleLanguageAdd}
                />
              </div>

              {selectedLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedLanguages.map((language) => (
                    <Badge
                      key={language}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleLanguageRemove(language)}
                    >
                      {language} ×
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Picture */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Upload className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    {profilePicture ? (
                      <img
                        src={URL.createObjectURL(profilePicture)}
                        alt="Profile preview"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
                          setProfilePicture(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Max file size: 5MB. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Submit Button - Only show when not in step mode */}
          {!isStepMode && (
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Back
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Creating Profile...</span>
                  </div>
                ) : (
                  'Complete Registration →'
                )}
              </Button>
            </div>
          )}
        </form>

        {/* Progress Indicator - Only show when not in step mode */}
        {!isStepMode && (
          <>
            <div className="flex items-center justify-center space-x-2 mt-8">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
              Step 3 of 4
            </p>
          </>
        )}
      </div>
    </div>
  );
}