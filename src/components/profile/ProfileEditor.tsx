// home/ubuntu/impaktrweb/src/components/profile/ProfileEditor.tsx

'use client';

import React, { useState, useCallback } from 'react';
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
  EyeOff,
  Award,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { PhoneInput } from '@/components/ui/phone-input';
import { countries } from '@/constants/countries';
import { languages } from '@/constants/languages';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  firstName?: string;
  lastName?: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  website: string;
  phone?: string;
  languages: string[];
  skills?: string[];
  occupation: string;
  organization: string;
  impaktrScore: number;
  currentRank: string;
  joinedAt: string;
  sdgFocus: number[];
  isPublic?: boolean;
  showEmail?: boolean;
  showProgress?: boolean;
  allowMessages?: boolean;
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
  phone?: string;
  city: string;
  state: string;
  country: string;
  languages: string[];
  skills: string[];
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
  const [selectedSkills, setSelectedSkills] = useState<string[]>(profile.skills || []);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>(profile.sdgFocus || []);
  
  // SDG AI Recommendations State
  const [concernText, setConcernText] = useState('');
  const [sdgRecommendations, setSdgRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Skills options - same as in IndividualRegistrationForm
  const skillOptions = [
    'Teaching', 'Coding', 'Design', 'Marketing', 'Photography', 'Writing',
    'Translation', 'Medical', 'Construction', 'Gardening', 'Cooking',
    'Event Planning', 'Fundraising', 'Public Speaking', 'Social Media',
    'Data Analysis', 'Project Management', 'Research', 'Sales', 'Customer Service'
  ];

  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    defaultValues: {
      // Parse firstName from name if firstName is not available
      // First name is all parts except the last one (e.g., "Li Yuan" from "Li Yuan Peng")
      firstName: profile.firstName || (() => {
        if (!profile.name) return '';
        const parts = profile.name.trim().split(/\s+/);
        if (parts.length > 1) {
          return parts.slice(0, -1).join(' ');
        }
        return parts[0] || '';
      })(),
      // Parse lastName from name if lastName is not available
      // Last name is the last part (e.g., "Peng" from "Li Yuan Peng")
      lastName: profile.lastName || (() => {
        if (!profile.name) return '';
        const parts = profile.name.trim().split(/\s+/);
        if (parts.length > 1) {
          return parts[parts.length - 1] || '';
        }
        return '';
      })(),
      bio: profile.bio || '',
      occupation: profile.occupation || '',
      organization: profile.organization || '',
      website: profile.website || '',
      phone: profile.phone || '',
      city: profile.location?.city || '',
      state: profile.location?.state || '',
      country: profile.location?.country || '',
      languages: profile.languages || [],
      skills: profile.skills || [],
      sdgFocus: profile.sdgFocus || [],
      isPublic: profile.isPublic !== undefined ? profile.isPublic : true,
      showEmail: profile.showEmail !== undefined ? profile.showEmail : false,
      showProgress: profile.showProgress !== undefined ? profile.showProgress : true,
      allowMessages: profile.allowMessages !== undefined ? profile.allowMessages : true
    }
  });

  // Track if form has changes (including file uploads)
  const hasChanges = isDirty || avatar !== null || banner !== null;

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

  const handleSkillToggle = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(newSkills);
    setValue('skills', newSkills, { shouldDirty: true });
  };

  const handleSDGChange = (sdgs: number[]) => {
    setSelectedSDGs(sdgs);
    setValue('sdgFocus', sdgs, { shouldDirty: true });
  };

  // Fetch SDG recommendations based on user's concerns
  const fetchSDGRecommendations = useCallback(async (text: string) => {
    if (!text || text.trim().length < 3) return;

    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      const response = await fetch('/api/sdg/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: text.trim(),
          description: text.trim(),
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

  // Apply a single SDG recommendation
  const applySDGRecommendation = (sdgNumber: number) => {
    if (!selectedSDGs.includes(sdgNumber)) {
      if (selectedSDGs.length < 17) {
        const newSDGs = [...selectedSDGs, sdgNumber];
        setSelectedSDGs(newSDGs);
        setValue('sdgFocus', newSDGs, { shouldDirty: true });
      }
    }
  };

  // Apply all recommendations
  const applyAllRecommendations = () => {
    const newSDGs = sdgRecommendations
      .filter(rec => !selectedSDGs.includes(rec.sdgNumber))
      .map(rec => rec.sdgNumber)
      .slice(0, 17 - selectedSDGs.length);

    if (newSDGs.length > 0) {
      const updatedSDGs = [...selectedSDGs, ...newSDGs];
      setSelectedSDGs(updatedSDGs);
      setValue('sdgFocus', updatedSDGs, { shouldDirty: true });
      setShowRecommendations(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      console.log('📝 Form data before sending:', data);
      
      // Basic profile data - only append non-empty values
      Object.entries(data).forEach(([key, value]) => {
        // All fields now exist in schema - no need to skip any
        
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            formData.append(key, value.toString());
          } else if (typeof value === 'string' && value.trim() !== '') {
            formData.append(key, value);
          } else if (typeof value === 'string' && value.trim() === '') {
            // Skip empty strings - they'll be handled as null on the backend
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Ensure skills are included
      if (selectedSkills.length > 0) {
        formData.append('skills', JSON.stringify(selectedSkills));
      } else {
        formData.append('skills', JSON.stringify([]));
      }

      // Avatar and banner files
      if (avatar) formData.append('avatar', avatar);
      if (banner) formData.append('banner', banner);

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        // Try to get error details from response
        const text = await response.text();
        console.error('Profile update API error:', response.status);
        console.error('Response text:', text);
        
        try {
          const errorData = JSON.parse(text);
          console.error('Error data:', errorData);
          throw new Error(errorData.error || errorData.details || `Failed to update profile: ${response.status}`);
        } catch (e) {
          console.error('Could not parse error response as JSON');
          throw new Error(`Failed to update profile: ${response.status} - ${text.substring(0, 100)}`);
        }
      }

      const result = await response.json();
      
      // Reset file states after successful save
      setAvatar(null);
      setBanner(null);
      
      // Reset form dirty state with the saved data
      reset(data);
      
      // Show success message
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved.',
      });
      
      onSave(result.user);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
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
            <Button 
              onClick={handleSubmit(onSubmit)} 
              disabled={isLoading || !hasChanges}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center gap-2 mb-6">
              <Button
                type="button"
                variant={activeTab === 'basic' ? 'default' : 'outline'}
                onClick={() => setActiveTab('basic')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'basic' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Basic Info
              </Button>
              <Button
                type="button"
                variant={activeTab === 'professional' ? 'default' : 'outline'}
                onClick={() => setActiveTab('professional')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'professional' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Professional
              </Button>
              <Button
                type="button"
                variant={activeTab === 'interests' ? 'default' : 'outline'}
                onClick={() => setActiveTab('interests')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'interests' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Interests
              </Button>
              <Button
                type="button"
                variant={activeTab === 'privacy' ? 'default' : 'outline'}
                onClick={() => setActiveTab('privacy')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'privacy' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Privacy
              </Button>
            </div>

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
                        className="relative h-32 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer overflow-hidden"
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
                        {(!banner && !profile.banner) && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-700 dark:text-gray-200 text-center">
                              <Upload className="w-6 h-6 mx-auto mb-2" />
                              <div className="text-sm font-medium">Click to upload banner</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">Max 5MB • 1200x400px recommended</div>
                            </div>
                          </div>
                        )}
                        {(banner || profile.banner) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 dark:bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
                            <div className="text-white text-center">
                              <Upload className="w-6 h-6 mx-auto mb-2" />
                              <div className="text-sm font-medium">Click to change banner</div>
                              <div className="text-xs opacity-90">Max 5MB • 1200x400px recommended</div>
                            </div>
                          </div>
                        )}
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

                  <div>
                    <PhoneInput
                      id="phone"
                      label="Phone Number"
                      value={watch('phone') || ''}
                      onChange={(value) => setValue('phone', value, { shouldDirty: true, shouldTouch: true })}
                      placeholder="Enter phone number"
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
                          className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white border border-gray-300 dark:border-gray-600"
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

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Skills
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select your skills to help match you with relevant events
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Your Skills</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose skills that you have or are interested in
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {skillOptions.map((skill) => (
                        <label key={skill} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-accent">
                          <input
                            type="checkbox"
                            checked={selectedSkills.includes(skill)}
                            onChange={() => handleSkillToggle(skill)}
                            className="rounded"
                          />
                          <span className="text-sm">{skill}</span>
                        </label>
                      ))}
                    </div>

                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white border border-gray-300 dark:border-gray-600"
                            onClick={() => handleSkillToggle(skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    )}
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
                    Select the UN Sustainable Development Goals that align with your interests and activities (optional)
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Optional AI Matching Input */}
                  <div>
                    <Label htmlFor="concern-text" className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">
                      Your Current Concerns (Optional)
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Describe your concerns or interests, and AI will help match relevant SDGs
                    </p>
                    <div className="w-full">
                      <Textarea
                        id="concern-text"
                        value={concernText}
                        onChange={(e) => setConcernText(e.target.value)}
                        placeholder="e.g., I'm concerned about climate change, education access, and gender equality..."
                        rows={3}
                        className="w-full"
                      />
                      {concernText && concernText.trim().length >= 3 && !isLoadingRecommendations && (
                        <div className="mt-2 flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fetchSDGRecommendations(concernText)}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Get AI Suggestions
                          </Button>
                        </div>
                      )}
                    </div>
                    {concernText && concernText.trim().length >= 3 && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI will suggest relevant SDGs based on your concerns
                      </p>
                    )}

                    {/* SDG AI Recommendations */}
                    {showRecommendations && sdgRecommendations.length > 0 && (
                      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mt-4">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-5 h-5 text-blue-600" />
                              <CardTitle className="text-base">AI SDG Recommendations</CardTitle>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowRecommendations(false)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on your concerns, we recommend these SDGs:
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
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
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
                                  type="button"
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
                              type="button"
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
                      <div className="flex items-center justify-center py-4 mt-4">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">Analyzing your concerns...</span>
                      </div>
                    )}

                    {recommendationError && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{recommendationError}</p>
                      </div>
                    )}
                  </div>

                  <SDGSelector
                    selectedSDGs={selectedSDGs}
                    onSelectionChange={handleSDGChange}
                    maxSelection={17}
                    showSelectAll={true}
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
                      checked={watch('isPublic') ?? true}
                      onCheckedChange={(checked) => {
                        console.log('Public Profile switch changed to:', checked);
                        setValue('isPublic', checked, { shouldDirty: true, shouldTouch: true });
                      }}
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
                      checked={watch('showEmail') ?? false}
                      onCheckedChange={(checked) => {
                        console.log('Show Email switch changed to:', checked);
                        setValue('showEmail', checked, { shouldDirty: true, shouldTouch: true });
                      }}
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
                      checked={watch('showProgress') ?? true}
                      onCheckedChange={(checked) => {
                        console.log('Show Progress switch changed to:', checked);
                        setValue('showProgress', checked, { shouldDirty: true, shouldTouch: true });
                      }}
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
                      checked={watch('allowMessages') ?? true}
                      onCheckedChange={(checked) => {
                        console.log('Allow Messages switch changed to:', checked);
                        setValue('allowMessages', checked, { shouldDirty: true, shouldTouch: true });
                      }}
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