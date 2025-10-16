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
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  
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

  const handleVerificationDocsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + verificationDocs.length <= 5) {
      setVerificationDocs(prev => [...prev, ...files]);
    }
  };

  const removeVerificationDoc = (index: number) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for logo
  const handleLogoDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);
  };

  const handleLogoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingLogo(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        setLogo(file);
      } else {
        alert('Please upload an image file');
      }
    }
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
              <CardTitle className="text-gray-900 dark:text-white">UN Sustainable Development Goals</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select all the SDGs your organization focuses on (optional)
              </p>
            </CardHeader>
            <CardContent>
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
                <Upload className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Organization Logo
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Upload your organization&apos;s logo (optional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Preview - Centered */}
              <div className="flex flex-col items-center">
                <label 
                  htmlFor="logo-upload-main"
                  className={`w-40 h-40 rounded-lg bg-gray-50 dark:bg-gray-900 border-2 flex items-center justify-center overflow-hidden transition-colors cursor-pointer ${
                    isDraggingLogo 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onDragEnter={handleLogoDragEnter}
                  onDragOver={handleLogoDragOver}
                  onDragLeave={handleLogoDragLeave}
                  onDrop={handleLogoDrop}
                >
                  {logo ? (
                    <img
                      src={URL.createObjectURL(logo)}
                      alt="Logo preview"
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 dark:text-gray-600 text-center px-2">
                      <Building2 className="w-12 h-12 mb-2" />
                      <span className="text-xs">
                        {isDraggingLogo ? 'Drop here' : 'Drag or click'}
                      </span>
                    </div>
                  )}
                </label>
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
              </div>

              {/* File Info - Centered */}
              {logo && (
                <div className="max-w-md mx-auto p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                    {logo.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {(logo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
              
              {/* Action Buttons - Centered */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  <label 
                    htmlFor="logo-upload" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {logo ? 'Change' : 'Choose File'}
                  </label>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo(null)}
                      className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG or SVG (max. 5MB)
                </p>
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
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30'
                  }`}
                  onDragEnter={handleDocsDragEnter}
                  onDragOver={handleDocsDragOver}
                  onDragLeave={handleDocsDragLeave}
                  onDrop={handleDocsDrop}
                >
                  <FileText className={`w-10 h-10 mx-auto mb-3 ${
                    isDraggingDocs ? 'text-blue-500' : 'text-gray-400'
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
                      <Upload className="w-4 h-4" />
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
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
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


