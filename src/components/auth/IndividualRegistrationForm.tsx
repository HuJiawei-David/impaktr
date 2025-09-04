// home/ubuntu/impaktrweb/src/components/auth/IndividualRegistrationForm.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { CalendarDays, Upload, MapPin, Languages, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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

export function IndividualRegistrationForm() {
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

  const onSubmit: SubmitHandler<IndividualRegistrationData> = async (data) => {
    setIsLoading(true);
    
    try {
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
        throw new Error('Registration failed');
      }

      await response.json();
      
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
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground">
            Tell us about yourself to personalize your impact journey
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarDays className="w-5 h-5 mr-2" />
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
                    error={errors.firstName?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={errors.lastName?.message}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth', { required: 'Date of birth is required' })}
                    error={errors.dateOfBirth?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender (Optional)</Label>
                  <Select onValueChange={(value) => setValue('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="nationality">Nationality *</Label>
                <Select onValueChange={(value) => setValue('nationality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nationality && (
                  <p className="text-destructive text-sm mt-1">{errors.nationality.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="country">Country *</Label>
                <Select onValueChange={(value) => setValue('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.flag} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-destructive text-sm mt-1">{errors.country.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('city', { required: 'City is required' })}
                    placeholder="e.g. Kuala Lumpur"
                    error={errors.city?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    {...register('state', { required: 'State is required' })}
                    placeholder="e.g. Selangor"
                    error={errors.state?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
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
                  placeholder="e.g. University of Malaya, Microsoft"
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Languages className="w-5 h-5 mr-2" />
                Languages Spoken
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Languages (up to 5)</Label>
                <Select onValueChange={handleLanguageAdd}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter(lang => !selectedLanguages.includes(lang.name))
                      .map((language) => (
                        <SelectItem key={language.code} value={language.name}>
                          {language.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
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
                      <Upload className="w-6 h-6 text-muted-foreground" />
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Max file size: 5MB. Supported formats: JPG, PNG, WebP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to find and view your profile
                  </p>
                </div>
                <Switch
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => setValue('isPublic', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email on your public profile
                  </p>
                </div>
                <Switch
                  checked={watch('showEmail')}
                  onCheckedChange={(checked) => setValue('showEmail', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
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
              variant="gradient"
              disabled={isLoading}
              className="px-8"
            >
              {isLoading ? 'Creating Profile...' : 'Complete Registration'}
            </Button>
          </div>
        </form>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="w-8 h-1 bg-primary rounded-full" />
          <div className="w-3 h-3 rounded-full bg-primary" />
          <div className="w-8 h-1 bg-muted rounded-full" />
          <div className="w-3 h-3 rounded-full bg-muted" />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Step 2 of 3
        </p>
      </div>
    </div>
  );
}