// home/ubuntu/impaktrweb/src/components/auth/OrganizationRegistrationForm.tsx

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { Building2, Upload, MapPin, FileText, Users, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function OrganizationRegistrationForm({ profileType }: OrganizationRegistrationFormProps) {
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
    setValue
  } = useForm<OrganizationRegistrationData>({
    defaultValues: {
      contactPersonEmail: user?.email || '',
      sdgFocus: []
    }
  });

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

  const onSubmit = async (data: OrganizationRegistrationData) => {
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
            {getFormTitle(profileType)}
          </h1>
          <p className="text-muted-foreground">
            Complete your organization profile to start creating impact opportunities
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                SDG Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Select SDGs your organization focuses on (up to 8)</Label>
                  <p className="text-sm text-muted-foreground mb-4">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Organization Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    {logo ? (
                      <img
                        src={URL.createObjectURL(logo)}
                        alt="Logo preview"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && file.size <= 5 * 1024 * 1024) {
                          setLogo(file);
                        }
                      }}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Max file size: 5MB. Recommended size: 200x200px. Formats: JPG, PNG, SVG
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Documents */}
          {(profileType === UserType.NGO || profileType === UserType.HEALTHCARE || profileType === UserType.SCHOOL) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Verification Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Upload verification documents (optional)</Label>
                    <p className="text-sm text-muted-foreground mb-4">
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
              {isLoading ? 'Creating Organization...' : 'Complete Registration'}
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


