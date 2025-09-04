// home/ubuntu/impaktrweb/src/app/profile/edit/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  User, 
  MapPin, 
  Globe, 
  Mail,
  Camera,
  Save,
  ArrowLeft,
  Upload,
  X,
  Languages,
  Building,
  Briefcase,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { countries } from '@/constants/countries';
import { languages } from '@/constants/languages';
import { getInitials } from '@/lib/utils';
import toast from 'react-hot-toast';

interface ProfileData {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  avatar: string;
  banner: string;
  website: string;
  occupation: string;
  organization: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  languages: string[];
  sdgFocus: number[];
  dateOfBirth: string;
  gender: string;
  nationality: string;
  isPublic: boolean;
  showEmail: boolean;
  notifications: {
    email: boolean;
    badges: boolean;
    events: boolean;
    verifications: boolean;
    marketing: boolean;
  };
}

export default function ProfileEditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
    reset
  } = useForm<ProfileData>();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session?.user) {
      fetchProfile();
    }
  }, [session, status]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        
        // Populate form
        const profileData = {
          firstName: data.user.profile?.firstName || '',
          lastName: data.user.profile?.lastName || '',
          displayName: data.user.profile?.displayName || '',
          bio: data.user.profile?.bio || '',
          avatar: data.user.profile?.avatar || '',
          banner: data.user.profile?.banner || '',
          website: data.user.profile?.website || '',
          occupation: data.user.profile?.occupation || '',
          organization: data.user.profile?.organization || '',
          location: data.user.profile?.location || { city: '', state: '', country: '' },
          languages: data.user.profile?.languages || [],
          sdgFocus: data.user.profile?.sdgFocus || [],
          dateOfBirth: data.user.profile?.dateOfBirth?.split('T')[0] || '',
          gender: data.user.profile?.gender || '',
          nationality: data.user.profile?.nationality || '',
          isPublic: data.user.profile?.isPublic ?? true,
          showEmail: data.user.profile?.showEmail ?? false,
          notifications: data.user.profile?.notifications || {
            email: true,
            badges: true,
            events: true,
            verifications: true,
            marketing: false
          }
        };

        reset(profileData);
        setSelectedLanguages(profileData.languages);
        setSelectedSDGs(profileData.sdgFocus);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setBannerFile(file);
    }
  };

  const handleLanguageAdd = (language: string) => {
    if (!selectedLanguages.includes(language) && selectedLanguages.length < 10) {
      const newLanguages = [...selectedLanguages, language];
      setSelectedLanguages(newLanguages);
      setValue('languages', newLanguages, { shouldDirty: true });
    }
  };

  const handleLanguageRemove = (language: string) => {
    const newLanguages = selectedLanguages.filter(lang => lang !== language);
    setSelectedLanguages(newLanguages);
    setValue('languages', newLanguages, { shouldDirty: true });
  };

  const handleSDGChange = (sdgs: number[]) => {
    setSelectedSDGs(sdgs);
    setValue('sdgFocus', sdgs, { shouldDirty: true });
  };

  const onSubmit = async (data: ProfileData) => {
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      
      // Append profile data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append languages and SDGs
      formData.append('languages', JSON.stringify(selectedLanguages));
      formData.append('sdgFocus', JSON.stringify(selectedSDGs));

      // Append files
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      setProfile(result.user);
      toast.success('Profile updated successfully!');
      
      // Reset dirty state
      reset(data);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground">
                Update your profile information and preferences
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Profile Images Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Profile Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Banner Upload */}
              <div>
                <Label>Profile Banner</Label>
                <div className="relative h-32 bg-gradient-to-r from-primary-100 to-primary-200 rounded-lg overflow-hidden mt-2">
                  {bannerFile ? (
                    <img
                      src={URL.createObjectURL(bannerFile)}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  ) : profile?.banner ? (
                    <img
                      src={profile.banner}
                      alt="Current banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-primary-400" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label htmlFor="banner-upload" className="cursor-pointer">
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </label>
                  </div>
                  
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended size: 1200x300px. Max file size: 10MB
                </p>
              </div>

              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage 
                      src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar} 
                      alt="Profile picture" 
                    />
                    <AvatarFallback className="text-2xl">
                      {getInitials(profile?.displayName || session.user.name || 'User')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                    </label>
                  </div>
                  
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium">Profile Picture</h4>
                  <p className="text-sm text-muted-foreground">
                    Click to upload a new profile picture
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max file size: 5MB. Square images work best.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Location</TabsTrigger>
              <TabsTrigger value="interests">Interests & SDGs</TabsTrigger>
              <TabsTrigger value="privacy">Privacy & Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
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

                  <div>
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      {...register('displayName')}
                      placeholder="How you want to be known on the platform"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be shown on your public profile and leaderboards
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      placeholder="Tell us about yourself, your interests, and what motivates you to create impact..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {watch('bio')?.length || 0}/500 characters
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...register('dateOfBirth')}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender (Optional)</Label>
                      <Select onValueChange={(value) => setValue('gender', value, { shouldDirty: true })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Prefer not to say</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="non-binary">Non-binary</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select onValueChange={(value) => setValue('nationality', value, { shouldDirty: true })}>
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact & Location Tab */}
            <TabsContent value="contact" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Contact & Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website / Portfolio</Label>
                    <Input
                      id="website"
                      type="url"
                      {...register('website')}
                      placeholder="https://your-website.com"
                      className="pl-10"
                    />
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="occupation">Current Occupation</Label>
                      <Input
                        id="occupation"
                        {...register('occupation')}
                        placeholder="e.g. Software Engineer, Student"
                        className="pl-10"
                      />
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor="organization">Organization / School</Label>
                      <Input
                        id="organization"
                        {...register('organization')}
                        placeholder="e.g. University of Malaya, Microsoft"
                        className="pl-10"
                      />
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Location</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="country" className="text-sm">Country *</Label>
                        <Select onValueChange={(value) => setValue('location.country', value, { shouldDirty: true })}>
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
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm">State / Province</Label>
                        <Input
                          id="state"
                          {...register('location.state')}
                          placeholder="e.g. Selangor"
                        />
                      </div>
                      <div>
                        <Label htmlFor="city" className="text-sm">City</Label>
                        <Input
                          id="city"
                          {...register('location.city')}
                          placeholder="e.g. Kuala Lumpur"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Languages Spoken</Label>
                    <div className="space-y-3">
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

                      {selectedLanguages.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedLanguages.map((language) => (
                            <Badge
                              key={language}
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleLanguageRemove(language)}
                            >
                              {language} <X className="w-3 h-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interests & SDGs Tab */}
            <TabsContent value="interests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SDG Focus Areas</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select up to 5 UN Sustainable Development Goals that align with your interests
                  </p>
                </CardHeader>
                <CardContent>
                  <SDGSelector
                    selectedSDGs={selectedSDGs}
                    onSelectionChange={handleSDGChange}
                    maxSelection={5}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy & Settings Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          Public Profile
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Allow others to find and view your profile on leaderboards
                        </p>
                      </div>
                      <Switch
                        checked={watch('isPublic')}
                        onCheckedChange={(checked) => setValue('isPublic', checked, { shouldDirty: true })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          Show Email Address
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Display your email address on your public profile
                        </p>
                      </div>
                      <Switch
                        checked={watch('showEmail')}
                        onCheckedChange={(checked) => setValue('showEmail', checked, { shouldDirty: true })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={watch('notifications.email')}
                      onCheckedChange={(checked) => setValue('notifications.email', checked, { shouldDirty: true })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Badge Achievements</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when you earn new badges
                      </p>
                    </div>
                    <Switch
                      checked={watch('notifications.badges')}
                      onCheckedChange={(checked) => setValue('notifications.badges', checked, { shouldDirty: true })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Event Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Reminders for upcoming events you've joined
                      </p>
                    </div>
                    <Switch
                      checked={watch('notifications.events')}
                      onCheckedChange={(checked) => setValue('notifications.events', checked, { shouldDirty: true })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Verification Requests</Label>
                      <p className="text-sm text-muted-foreground">
                        When others request your verification or approval
                      </p>
                    </div>
                    <Switch
                      checked={watch('notifications.verifications')}
                      onCheckedChange={(checked) => setValue('notifications.verifications', checked, { shouldDirty: true })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Communications</Label>
                      <p className="text-sm text-muted-foreground">
                        Updates about new features and community highlights
                      </p>
                    </div>
                    <Switch
                      checked={watch('notifications.marketing')}
                      onCheckedChange={(checked) => setValue('notifications.marketing', checked, { shouldDirty: true })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sticky Save Bar */}
          {isDirty && (
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg">
              <div className="container mx-auto max-w-4xl flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  You have unsaved changes
                </p>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Discard Changes
                  </Button>
                  <Button 
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}