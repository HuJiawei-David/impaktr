// home/ubuntu/impaktrweb/src/components/profile/ProfileEditor.tsx

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Save, 
  X, 
  Upload, 
  MapPin, 
  Globe, 
  User,
  Briefcase,
  Languages,
  Settings,
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

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  website: string;
  languages: string[];
  occupation: string;
  organization: string;
  impaktrScore: number;
  currentRank: string;
  joinedAt: string;
  sdgFocus: number[];
  stats: {
    totalHours: number;
    verifiedHours: number;
    eventsJoined: number;
    badgesEarned: number;
    certificates: number;
    followers: number;
    following: number;
  };
}

interface ProfileEditorProps {
  profile: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onCancel: () => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  bio: string;
  occupation: string;
  organization: string;
  website: string;
  city: string;
  state: string;
  country: string;
  languages: string[];
  sdgFocus: number[];
  isPublic: boolean;
  showEmail: boolean;
  showProgress: boolean;
  allowMessages: boolean;
}

export function ProfileEditor({ profile, onSave, onCancel }: ProfileEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(profile.languages || []);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>(profile.sdgFocus || []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: profile.name?.split(' ')[0] || '',
      lastName: profile.name?.split(' ').slice(1).join(' ') || '',
      bio: profile.bio || '',
      occupation: profile.occupation || '',
      organization: profile.organization || '',
      website: profile.website || '',
      city: profile.location?.city || '',
      state: profile.location?.state || '',
      country: profile.location?.country || '',
      languages: profile.languages || [],
      sdgFocus: profile.sdgFocus || [],
      isPublic: true, // Default values - these would come from actual profile
      showEmail: false,
      showProgress: true,
      allowMessages: true
    }
  });

  const handleLanguageAdd = (language: string) => {
    if (!selectedLanguages.includes(language) && selectedLanguages.length < 10) {
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

  const handleSDGChange = (sdgs: number[]) => {
    setSelectedSDGs(sdgs);
    setValue('sdgFocus', sdgs);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      // Basic profile data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Avatar and banner files
      if (avatar) formData.append('avatar', avatar);
      if (banner) formData.append('banner', banner);

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      onSave(result.user);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      // Handle error - show toast notification
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) { // 5MB limit
      if (type === 'avatar') {
        setAvatar(file);
      } else {
        setBanner(file);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">
              Update your profile information and privacy settings
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              {/* Profile Pictures */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Profile Pictures
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Banner Upload */}
                  <div>
                    <Label>Profile Banner</Label>
                    <div className="mt-2">
                      <div 
                        className="relative h-32 rounded-lg bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden"
                        style={{
                          backgroundImage: banner ? `url(${URL.createObjectURL(banner)})` : 
                                         profile.banner ? `url(${profile.banner})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'banner')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                          <div className="text-white text-center">
                            <Upload className="w-6 h-6 mx-auto mb-2" />
                            <div className="text-sm">Click to upload banner</div>
                            <div className="text-xs opacity-75">Max 5MB • 1200x400px recommended</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Avatar Upload */}
                  <div>
                    <Label>Profile Picture</Label>
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-20 h-20">
                          <AvatarImage 
                            src={avatar ? URL.createObjectURL(avatar) : profile.avatar} 
                            alt="Profile picture" 
                          />
                          <AvatarFallback className="text-lg">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 rounded-full flex items-center justify-center transition-opacity cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e, 'avatar')}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                        >
                          Change Photo
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max 5MB • JPG, PNG, WebP
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
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
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      placeholder="Tell people about yourself, your interests, and what drives your impact journey..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {watch('bio')?.length || 0}/500 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="website"
                        type="url"
                        {...register('website')}
                        placeholder="https://your-website.com"
                        className="pl-10"
                      />
                    </div>
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
                    <Select value={watch('country')} onValueChange={(value) => setValue('country', value)}>
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
                        error={errors.city?.message}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        {...register('state')}
                      />
                    </div>
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
                    <Label>Add Languages (up to 10)</Label>
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
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleLanguageRemove(language)}
                        >
                          {language} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Professional Information Tab */}
            <TabsContent value="professional" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
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
                    <Label htmlFor="organization">Organization/Company</Label>
                    <Input
                      id="organization"
                      {...register('organization')}
                      placeholder="e.g. University of Malaya, Microsoft, World Wildlife Fund"
                    />
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
                    Select up to 8 UN Sustainable Development Goals that align with your interests and activities
                  </p>
                </CardHeader>
                <CardContent>
                  <SDGSelector
                    selectedSDGs={selectedSDGs}
                    onSelectionChange={handleSDGChange}
                    maxSelection={8}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Settings Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Privacy & Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="flex items-center">
                        <Eye className="w-4 h-4 mr-2" />
                        Public Profile
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to find and view your profile in search results
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
                        Display your email address on your public profile
                      </p>
                    </div>
                    <Switch
                      checked={watch('showEmail')}
                      onCheckedChange={(checked) => setValue('showEmail', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Impact Progress</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your Impact Score, badges, and achievements publicly
                      </p>
                    </div>
                    <Switch
                      checked={watch('showProgress')}
                      onCheckedChange={(checked) => setValue('showProgress', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Let other users send you direct messages
                      </p>
                    </div>
                    <Switch
                      checked={watch('allowMessages')}
                      onCheckedChange={(checked) => setValue('allowMessages', checked)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Data & Account */}
              <Card>
                <CardHeader>
                  <CardTitle>Data & Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" className="self-start">
                      Download My Data
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Download all your data including profile, activity history, and certificates
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" className="self-start text-destructive hover:text-destructive">
                      Deactivate Account
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Temporarily hide your profile and stop receiving notifications
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}