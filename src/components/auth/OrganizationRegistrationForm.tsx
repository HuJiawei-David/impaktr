// home/ubuntu/impaktrweb/src/components/auth/OrganizationRegistrationForm.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { Building2, Upload, MapPin, FileText, Users, Globe, Sparkles, Check, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { UserType } from '@/types/enums';
import { countries } from '@/constants/countries';
import { industries } from '@/constants/industries';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { PhoneInput } from '@/components/ui/phone-input';
import { toast } from 'react-hot-toast';
import { SDGRecommendation } from '@/lib/sdg/sdg-recommendation-engine';

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
  contactPersonFirstName: string;
  contactPersonLastName?: string;
  contactPersonRole: string;
  contactPersonEmail: string;
  contactPersonPhone?: string;
  sdgFocus: number[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormDataUpdate = Record<string, any>;

interface OrganizationRegistrationFormProps {
  profileType: UserType;
  isStepMode?: boolean;
  onDataChange?: (data: FormDataUpdate) => void;
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

type EnrichedSDGRecommendation = SDGRecommendation & {
  confidenceLevel: {
    level: 'very-high' | 'high' | 'medium' | 'low';
    label: string;
    description: string;
  };
  isNew?: boolean;
};

export function OrganizationRegistrationForm({ profileType, isStepMode = false, onDataChange, validationErrors = [] }: OrganizationRegistrationFormProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [verificationDocs, setVerificationDocs] = useState<File[]>([]);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  
  // SDG Recommendations State
  const [sdgRecommendations, setSdgRecommendations] = useState<EnrichedSDGRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<OrganizationRegistrationData>({
    defaultValues: {
      organizationName: user?.name || '',
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

  // Debounced organization name and description analysis for SDG recommendations
  const organizationName = watch('organizationName');
  const description = watch('description');
  
  const fetchSDGRecommendations = useCallback(async (orgName: string, orgDescription?: string) => {
    if (!orgName || orgName.trim().length < 3) return;

    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      const response = await fetch('/api/sdg/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: orgName.trim(),
          description: orgDescription?.trim(),
          contextSDGs: selectedSDGs,
          mode: 'quick', // Use quick mode for faster response
          minConfidence: 0.5, // Higher threshold for more accurate recommendations
          maxRecommendations: 8 // Limit to top 8 most relevant SDGs
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.recommendations.length > 0) {
          setSdgRecommendations(data.recommendations);
          setShowRecommendations(true);
        } else {
          setSdgRecommendations([]);
          setShowRecommendations(false);
        }
      } else {
        const errorData = await response.json();
        setRecommendationError(errorData.error || 'Failed to get recommendations');
      }
    } catch (error) {
      console.error('Error fetching SDG recommendations:', error);
      setRecommendationError('Network error occurred');
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [selectedSDGs]);

  useEffect(() => {
    if (!organizationName || organizationName.trim().length < 3) {
      setSdgRecommendations([]);
      setShowRecommendations(false);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchSDGRecommendations(organizationName, description);
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimer);
  }, [organizationName, description, fetchSDGRecommendations]);

  const applySDGRecommendation = (sdgNumber: number) => {
    if (!selectedSDGs.includes(sdgNumber)) {
      if (selectedSDGs.length < 17) {
        setSelectedSDGs([...selectedSDGs, sdgNumber]);
        setValue('sdgFocus', [...selectedSDGs, sdgNumber]);
        toast.success(`SDG ${sdgNumber} added`);
      } else {
        toast.error('Maximum 17 SDGs allowed');
      }
    }
  };

  const applyAllRecommendations = () => {
    const newSDGs = sdgRecommendations
      .filter(rec => !selectedSDGs.includes(rec.sdgNumber))
      .map(rec => rec.sdgNumber)
      .slice(0, 17 - selectedSDGs.length);

    if (newSDGs.length > 0) {
      const updatedSDGs = [...selectedSDGs, ...newSDGs];
      setSelectedSDGs(updatedSDGs);
      setValue('sdgFocus', updatedSDGs);
      toast.success(`Added ${newSDGs.length} recommended SDG${newSDGs.length > 1 ? 's' : ''}`);
      setShowRecommendations(false);
    }
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

  // Drag and drop handlers for verification documents
  const handleDocsDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocs(true);
  };

  const handleDocsDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocs(false);
  };

  const handleDocsDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDocsDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingDocs(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length + verificationDocs.length <= 5) {
      setVerificationDocs(prev => [...prev, ...validFiles]);
    } else {
      alert(`You can only upload up to 5 files. You have ${verificationDocs.length} files already.`);
    }
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
      console.log('Starting organization registration...');
      const formData = new FormData();
      
      // Append organization data
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          // Include optional fields even if undefined/null to ensure proper validation
          formData.append(key, '');
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value.toString());
        }
      });

      // Append profile type
      formData.append('profileType', profileType);

      // Append logo if selected
      if (logo) {
        console.log('Uploading logo...');
        formData.append('logo', logo);
      }

      // Append verification documents
      if (verificationDocs.length > 0) {
        console.log(`Uploading ${verificationDocs.length} verification documents...`);
      }
      verificationDocs.forEach((doc, index) => {
        formData.append(`verificationDoc_${index}`, doc);
      });

      console.log('Sending registration request...');
      const response = await fetch('/api/organizations/register', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Registration failed:', result);
        alert(`Registration failed: ${result.error || 'Unknown error'}\n${result.details ? JSON.stringify(result.details) : ''}`);
        throw new Error(result.error || 'Registration failed');
      }

      console.log('Registration successful!');
      sessionStorage.setItem('registrationComplete', 'true');
      router.push('/onboarding');
      
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        alert(`Registration failed: ${error.message}`);
      }
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
                  <SearchableSelect
                    options={organizationTypes[profileType]?.map((typeOption: Option) => ({
                      value: typeOption.value,
                      label: typeOption.label
                    })) || []}
                    value={watch('type')}
                    placeholder="Search organization type..."
                    onValueChange={(value) => setValue('type', value)}
                    error={!!errors.type}
                  />
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
                    <SearchableSelect
                      options={industries.map((industry: Option) => ({
                        value: industry.value,
                        label: industry.label
                      }))}
                      value={watch('industry')}
                      placeholder="Search industry..."
                      onValueChange={(value) => setValue('industry', value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="companySize">Company Size</Label>
                    <SearchableSelect
                      options={companySizes.map((size: Option) => ({
                        value: size.value,
                        label: size.label
                      }))}
                      value={watch('companySize')}
                      placeholder="Search company size..."
                      onValueChange={(value) => setValue('companySize', value)}
                    />
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
                  <Label htmlFor="contactPersonFirstName">First Name *</Label>
                  <Input
                    id="contactPersonFirstName"
                    {...register('contactPersonFirstName', { required: 'First name is required' })}
                    placeholder="Enter first name"
                    error={errors.contactPersonFirstName?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="contactPersonLastName">Last Name</Label>
                  <Input
                    id="contactPersonLastName"
                    {...register('contactPersonLastName')}
                    placeholder="Enter last name (optional)"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPersonRole">Role/Title *</Label>
                  <Input
                    id="contactPersonRole"
                    {...register('contactPersonRole', { required: 'Role is required' })}
                    placeholder="e.g. Director, Manager, Coordinator"
                    error={errors.contactPersonRole?.message}
                  />
                </div>

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
                  <PhoneInput
                    id="contactPersonPhone"
                    label="Phone Number"
                    value={watch('contactPersonPhone') || ''}
                    onChange={(value) => setValue('contactPersonPhone', value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SDG Focus Areas */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">UN Sustainable Development Goals</CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Select all the SDGs your organization focuses on (optional)
                  </p>
                </div>
                {watch('organizationName') && watch('organizationName').length >= 3 && !isLoadingRecommendations && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchSDGRecommendations(watch('organizationName'), watch('description'))}
                    className="text-xs"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Get AI Suggestions
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {watch('organizationName') && watch('organizationName').length >= 3 && (
                <p className="text-xs text-muted-foreground mb-3 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI will suggest relevant SDGs based on your organization name and description
                </p>
              )}

              {/* SDG AI Recommendations */}
              {showRecommendations && sdgRecommendations.length > 0 && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mb-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-base">AI SDG Recommendations</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRecommendations(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on your organization name and description, we recommend these SDGs:
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {sdgRecommendations.map((rec) => (
                      <div
                        key={rec.sdgNumber}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          selectedSDGs.includes(rec.sdgNumber)
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                            : 'bg-white border-gray-200 dark:bg-gray-900'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: rec.color }}
                            />
                            <span className="font-medium text-sm">
                              SDG {rec.sdgNumber}: {rec.sdgName}
                            </span>
                            {selectedSDGs.includes(rec.sdgNumber) && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Confidence: {(rec.confidence * 100).toFixed(0)}% 
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                              rec.confidenceLevel?.level === 'very-high' ? 'bg-green-100 text-green-800' :
                              rec.confidenceLevel?.level === 'high' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {rec.confidenceLevel?.label || 'Medium'}
                            </span>
                          </div>
                          {rec.reasoning && rec.reasoning.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {rec.reasoning[0]}
                            </p>
                          )}
                          {rec.keywords && rec.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {rec.keywords.slice(0, 3).map((keyword: string, idx: number) => (
                                <span key={idx} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {!selectedSDGs.includes(rec.sdgNumber) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applySDGRecommendation(rec.sdgNumber)}
                            className="ml-2"
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={applyAllRecommendations}
                        disabled={sdgRecommendations.every(rec => selectedSDGs.includes(rec.sdgNumber))}
                      >
                        Apply All Recommendations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLoadingRecommendations && (
                <div className="flex items-center justify-center py-4 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                  <span className="text-sm text-muted-foreground">Analyzing organization details...</span>
                </div>
              )}

              {recommendationError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{recommendationError}</p>
                </div>
              )}

              <SDGSelector
                selectedSDGs={selectedSDGs}
                onSelectionChange={handleSDGChange}
                maxSelection={17}
                showSelectAll={true}
              />
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center text-gray-900 dark:text-white">
                <div className="text-blue-600 dark:text-blue-400 mr-2">
                  <Upload className="w-5 h-5" />
                </div>
                Organization Logo
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Add your organization&apos;s logo to help others recognize your brand. This will be visible on your public profile.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Preview Section */}
                <div className="flex justify-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500">
                      {logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={URL.createObjectURL(logo)}
                          alt="Logo preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                          <Building2 className="w-8 h-8 mb-2" />
                          <span className="text-sm font-medium">No logo</span>
                        </div>
                      )}
                    </div>
                    {logo && (
                      <button
                        type="button"
                        onClick={() => setLogo(null)}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 hover:scale-110"
                        title="Remove logo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Area */}
                <div className="space-y-4">
                  <label 
                    htmlFor="logo-upload-main" 
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 group"
                  >
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-10 h-10 mb-3 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors text-blue-600 dark:text-blue-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Choose a logo
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        or drag and drop here
                      </p>
                    </div>
                    <Input
                      id="logo-upload-main"
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
                  
                  {/* File Info */}
                  {logo && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {logo.name}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400">
                            {(logo.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Guidelines */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Logo Guidelines
                    </h4>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Use high-quality images (PNG, JPG, or SVG)</li>
                      <li>• Recommended size: 400x400 pixels or larger</li>
                      <li>• Keep file size under 5MB</li>
                      <li>• Ensure logo is clear and recognizable</li>
                    </ul>
                  </div>
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
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Upload registration certificates, licenses, or other official documents (optional, up to 5 files)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDraggingDocs
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-800'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                  }`}
                  onDragEnter={handleDocsDragEnter}
                  onDragOver={handleDocsDragOver}
                  onDragLeave={handleDocsDragLeave}
                  onDrop={handleDocsDrop}
                >
                  <FileText className={`w-10 h-10 mx-auto mb-3 ${
                    isDraggingDocs ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                  }`} />
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {isDraggingDocs ? 'Drop files here' : 'Drag and drop files here'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    or
                  </p>
                  {verificationDocs.length < 5 && (
                    <label 
                      htmlFor="verification-docs-upload" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      Choose Files
                    </label>
                  )}
                  <Input
                    id="verification-docs-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    onChange={handleVerificationDocsChange}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    PDF, JPG, or PNG files • {verificationDocs.length} of 5 uploaded
                  </p>
                </div>

                {/* Uploaded Documents List */}
                {verificationDocs.length > 0 && (
                  <div className="space-y-2">
                    {verificationDocs.map((doc, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {doc.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVerificationDoc(index)}
                          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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


