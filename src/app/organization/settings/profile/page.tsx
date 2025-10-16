// home/ubuntu/impaktrweb/src/app/organization/settings/profile/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Building2, 
  Save, 
  Upload,
  ArrowLeft,
  Globe,
  MapPin,
  Users,
  Briefcase
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { industries, companySizes } from '@/constants/industries';
import { countries } from '@/constants/countries';

interface OrganizationProfile {
  name: string;
  email: string;
  website?: string;
  description?: string;
  industry: string;
  companySize: string;
  country: string;
  address?: string;
  city?: string;
  phone?: string;
  logo?: string;
}

interface OrganizationData {
  id: string;
  name: string;
  email: string;
  website?: string;
  description?: string;
  industry: string;
  companySize: string;
  country: string;
  address?: string;
  city?: string;
  phone?: string;
  logo?: string;
}

export default function OrganizationProfileSettingsPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<OrganizationProfile>();

  const watchedValues = watch();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin');
      return;
    }

    if (user) {
      fetchOrganizationData();
    }
  }, [isLoading, user, router]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations/dashboard');
      
      if (response.status === 401) {
        router.push('/signin');
        return;
      }

      if (response.status === 404) {
        router.push('/dashboard');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }

      const data = await response.json();
      setOrganizationData(data);
      
      // Populate form
      setValue('name', data.name);
      setValue('email', data.email);
      setValue('website', data.website || '');
      setValue('description', data.description || '');
      setValue('industry', data.industry);
      setValue('companySize', data.companySize);
      setValue('country', data.country);
      setValue('address', data.address || '');
      setValue('city', data.city || '');
      setValue('phone', data.phone || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: OrganizationProfile) => {
    setSaving(true);
    try {
      const response = await fetch('/api/organizations/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update organization profile');
      }

      toast.success('Organization profile updated successfully!');
      fetchOrganizationData(); // Refresh data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement logo upload to S3
      toast.success('Logo upload functionality coming soon!');
    }
  };

  // Add religious organizations to industries
  const allIndustries = [
    ...industries,
    { value: 'religious', label: 'Religious Organizations' }
  ];

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!organizationData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Organization Found</h2>
          <p className="text-muted-foreground mb-4">You are not part of any organization.</p>
          <Button onClick={() => router.push('/dashboard')} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Organization Profile</h1>
              <p className="text-muted-foreground">
                Update your organization's profile information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-6 h-6 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  {organizationData.logo ? (
                    <img
                      src={organizationData.logo}
                      alt="Organization logo"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <Label htmlFor="logo">Organization Logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Recommended size: 200x200px. Max file size: 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Organization name is required' })}
                    error={errors.name?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    error={errors.email?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="+60 12 345 6789"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Tell us about your organization..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Organization Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-6 h-6 mr-2" />
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <SearchableSelect
                    options={allIndustries.map(industry => ({
                      value: industry.value,
                      label: industry.label
                    }))}
                    value={watchedValues.industry}
                    placeholder="Search industry..."
                    onValueChange={(value) => setValue('industry', value)}
                  />
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size *</Label>
                  <SearchableSelect
                    options={companySizes.map(size => ({
                      value: size.value,
                      label: size.label
                    }))}
                    value={watchedValues.companySize}
                    placeholder="Search company size..."
                    onValueChange={(value) => setValue('companySize', value)}
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <SearchableSelect
                    options={countries.map(country => ({
                      value: country.name,
                      label: country.name,
                      flag: country.flag
                    }))}
                    value={watchedValues.country}
                    placeholder="Search country..."
                    onValueChange={(value) => setValue('country', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-6 h-6 mr-2" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...register('city')}
                    placeholder="City name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !isDirty} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
