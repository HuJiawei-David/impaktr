// home/ubuntu/impaktrweb/src/components/auth/OrganizationRegistrationForm.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { Building2, Upload, MapPin, FileText, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { UserType } from '@prisma/client';
import { countries } from '@/constants/countries';
import { industries } from '@/constants/industries';
import { SDGSelector } from '@/components/ui/sdg-selector';

interface OrganizationRegistrationData {
  organizationName: string;
  registrationNumber?: string;
  industry?: string;
  companySize?: string;
  type?: string;
  city: string;
  country: string;
  website?: string;
  description: string;
  contactPersonName: string;
  contactPersonRole: string;
  contactPersonEmail: string;
  contactPersonPhone?: string;
  sdgFocus: number[];
}

interface OrganizationRegistrationFormProps {
  profileType: UserType;
  isStepMode?: boolean;
  onDataChange?: (data: any) => void;
  validationErrors?: string[];
}

type Option = { value: string; label: string };

const organizationTypes: Partial<Record<UserType, Option[]>> = {
  [UserType.NGO]: [
    { value: 'charity', label: 'Charity' },
    { value: 'social-enterprise', label: 'Social Enterprise' },
    { value: 'non-profit', label: 'Non-Profit' },
    { value: 'community-organization', label: 'Community Organization' }
  ],
  [UserType.SCHOOL]: [
    { value: 'primary-school', label: 'Primary School' },
    { value: 'secondary-school', label: 'Secondary School' },
    { value: 'college', label: 'College' },
    { value: 'university', label: 'University' },
    { value: 'vocational-school', label: 'Vocational School' }
  ],
  [UserType.CORPORATE]: [
    { value: 'private-company', label: 'Private Company' },
    { value: 'public-company', label: 'Public Company' },
    { value: 'multinational', label: 'Multinational Corporation' },
    { value: 'startup', label: 'Startup' },
    { value: 'small-business', label: 'Small Business' }
  ],
  [UserType.HEALTHCARE]: [
    { value: 'hospital', label: 'Hospital' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'research-center', label: 'Research Center' },
    { value: 'medical-college', label: 'Medical College' },
    { value: 'health-organization', label: 'Health Organization' }
  ]
};

const companySizes: Option[] = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' }
];

const getFormTitle = (profileType: UserType) => {
  switch (profileType) {
    case UserType.NGO: return 'NGO Registration';
    case UserType.SCHOOL: return 'Educational Institution Registration';
    case UserType.CORPORATE: return 'Corporate Registration';
    case UserType.HEALTHCARE: return 'Healthcare Institution Registration';
    default: return 'Organization Registration';
  }
};

export function OrganizationRegistrationForm({ profileType, isStepMode = false, onDataChange, validationErrors = [] }: OrganizationRegistrationFormProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [verificationDocs, setVerificationDocs] = useState<File[]>([]);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<OrganizationRegistrationData>({
    defaultValues: {
      contactPersonEmail: user?.email || '',
      sdgFocus: []
    }
  });

  // Simple validation function that doesn't cause infinite loops
  const validateForm = () => {
    const organizationName = watch('organizationName');
    const contactEmail = watch('contactPersonEmail');
    
    return organizationName && contactEmail;
  };

  const handleSDGChange = (sdgs: number[]) => {
    setSelectedSDGs(sdgs);
    setValue('sdgFocus', sdgs);
  };

  const handleVerificationDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + verificationDocs.length <= 5) {
      setVerificationDocs(prev => [...prev, ...files]);
    }
  };

  const removeVerificationDoc = (index: number) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
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

  const onSubmit = async (data: OrganizationRegistrationData) => {
    // In step mode, just update the data and let the parent handle submission
    if (isStepMode) {
      onDataChange?.(data);
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // Append organization data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append profile type
      formData.append('profileType', profileType);

      // Append logo if selected
      if (logo) {
        formData.append('logo', logo);
      }

      // Append verification documents
      verificationDocs.forEach((doc, index) => {
        formData.append(`verificationDoc_${index}`, doc);
      });

      const response = await fetch('/api/organizations/register', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      await response.json();
      
      sessionStorage.setItem('registrationComplete', 'true');
      router.push('/onboarding');
      
    } catch (error) {
      console.error('Registration error:', error);
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
              {getFormTitle(profileType)}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Complete your organization profile to start creating impact opportunities
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Organization Details */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Building2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="organizationName">Organization Name *</Label>
                <Input
                  id="organizationName"
                  {...register('organizationName', { required: 'Organization name is required' })}
                  placeholder="Enter your organization's full legal name"
                  error={errors.organizationName?.message}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Organization Type *</Label>
                  <Select onValueChange={(value) => setValue('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizationTypes[profileType]?.map((typeOption: Option) => (
                        <SelectItem key={typeOption.value} value={typeOption.value}>
                          {typeOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-destructive text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="registrationNumber">
                    {profileType === UserType.CORPORATE ? 'Company Registration Number' : 
                     profileType === UserType.SCHOOL ? 'Accreditation/License Number' :
                     'Registration/License Number'}
                  </Label>
                  <Input
                    id="registrationNumber"
                    {...register('registrationNumber')}
                    placeholder="Enter registration number"
                  />
                </div>
              </div>

              {profileType === UserType.CORPORATE && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select onValueChange={(value) => setValue('industry', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry: Option) => (
                          <SelectItem key={industry.value} value={industry.value}>
                            {industry.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select onValueChange={(value) => setValue('companySize', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size: Option) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Describe your organization's mission, activities, and impact goals..."
                  rows={4}
                  error={errors.description?.message}
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...register('website')}
                  placeholder="https://your-organization.com"
                />
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country *</Label>
                  <SearchableSelect
                    options={countries.map(country => ({
                      value: country.name,
                      label: country.name,
                      flag: country.flag
                    }))}
                    value={watch('country')}
                    placeholder="Search country..."
                    onValueChange={(value) => setValue('country', value)}
                    error={!!errors.country}
                  />
                  {errors.country && (
                    <p className="text-destructive text-sm mt-1">{errors.country.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    {...register('city', { required: 'City is required' })}
                    placeholder="Enter city"
                    error={errors.city?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Users className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                  <Input
                    id="contactPersonName"
                    {...register('contactPersonName', { required: 'Contact person name is required' })}
                    placeholder="Enter full name"
                    error={errors.contactPersonName?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonRole">Role/Title *</Label>
                  <Input
                    id="contactPersonRole"
                    {...register('contactPersonRole', { required: 'Role is required' })}
                    placeholder="e.g. Director, Manager, Coordinator"
                    error={errors.contactPersonRole?.message}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPersonEmail">Email Address *</Label>
                  <Input
                    id="contactPersonEmail"
                    type="email"
                    {...register('contactPersonEmail', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    placeholder="contact@organization.com"
                    error={errors.contactPersonEmail?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonPhone">Phone Number</Label>
                  <Input
                    id="contactPersonPhone"
                    type="tel"
                    {...register('contactPersonPhone')}
                    placeholder="+60 12-345-6789"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SDG Focus Areas */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Globe className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                SDG Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select SDGs your organization focuses on (up to 8)</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose the UN Sustainable Development Goals that align with your organization's mission
                  </p>
                </div>
                
                <SDGSelector
                  selectedSDGs={selectedSDGs}
                  onSelectionChange={handleSDGChange}
                  maxSelection={8}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <Upload className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Organization Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left: Large Preview */}
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center border-4 border-blue-200 dark:border-blue-700 shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-blue-300 dark:hover:shadow-blue-900 hover:scale-105 hover:border-blue-400 dark:hover:border-blue-500">
                      {logo ? (
                        <img
                          src={URL.createObjectURL(logo)}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                          <Building2 className="w-16 h-16 mb-3" />
                          <span className="text-base font-medium">Upload Logo</span>
                        </div>
                      )}
                    </div>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo(null)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 shadow-xl transition-all duration-200 hover:scale-110 ring-4 ring-white dark:ring-gray-800"
                        title="Remove logo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Upload Area */}
                <div className="space-y-4">
                  <label 
                    htmlFor="logo-upload" 
                    className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50 hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg group"
                  >
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800/60 transition-colors">
                        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="mb-2 text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Click to upload
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 px-4">
                        JPG, PNG or SVG (max. 5MB)<br/>Recommended: 200x200px
                      </p>
                    </div>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            alert('File size must be less than 5MB');
                            return;
                          }
                          setLogo(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  
                  {logo && (
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {logo.name}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                            {(logo.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Documents */}
          {(profileType === UserType.NGO || profileType === UserType.HEALTHCARE || profileType === UserType.SCHOOL) && (
            <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-900 dark:text-white">
                  <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Verification Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Upload verification documents (optional)</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Upload registration certificates, licenses, or other official documents (up to 5 files)
                    </p>
                    
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleVerificationDocsChange}
                      disabled={verificationDocs.length >= 5}
                    />
                  </div>

                  {verificationDocs.length > 0 && (
                    <div className="space-y-2">
                      <Label>Uploaded Documents:</Label>
                      {verificationDocs.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm truncate">{doc.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVerificationDoc(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    <span>Creating Organization...</span>
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


