// home/ubuntu/impaktrweb/src/app/events/[id]/edit/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Award,
  Upload,
  X,
  Save,
  ArrowLeft,
  AlertTriangle,
  Globe,
  Eye,
  EyeOff
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { toast } from 'react-hot-toast';
import { EventStatus } from '@/types/enums';
import { VerificationType } from '@/types/enums';

// Type for participation with user data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParticipationWithUser = any & {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    address?: string;
    city: string;
    coordinates?: { lat: number; lng: number };
    isVirtual: boolean;
  };
  maxParticipants?: number;
  sdgTags: number[];
  skills: string[];
  intensity: number;
  verificationType: VerificationType;
  images: string[];
  documents: string[];
  status: EventStatus;
}

interface Event extends EventFormData {
  id: string;
  creatorId: string;
  organizationId?: string;
  currentParticipants: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  participations: ParticipationWithUser[];
}

export default function EventEditPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const authLoading = status === 'loading';
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset
  } = useForm<EventFormData>();

  const watchedValues = watch();

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) {
        throw new Error('Event not found');
      }

      const data = await response.json();
      const eventData = data.event;

      // Check if user has permission to edit
      if (eventData.creatorId !== user?.id && !isUserOrgAdmin(eventData.organizationId)) {
        toast.error('You do not have permission to edit this event');
        router.push(`/events/${eventId}`);
        return;
      }

      setEvent(eventData);
      setSelectedSDGs(eventData.sdgTags);
      setSelectedSkills(eventData.skills);
      setPreviewImages(eventData.images);

      // Populate form
      reset({
        title: eventData.title,
        description: eventData.description,
        startDate: new Date(eventData.startDate).toISOString().slice(0, 16),
        endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().slice(0, 16) : '',
        location: eventData.location,
        maxParticipants: eventData.maxParticipants,
        sdgTags: eventData.sdgTags,
        skills: eventData.skills,
        intensity: eventData.intensity,
        verificationType: eventData.verificationType,
        status: eventData.status
      });

    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Failed to load event');
      router.push('/events');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user?.id, router, reset]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signup');
      return;
    }

    if (eventId) {
      fetchEvent();
    }
  }, [authLoading, user, eventId, fetchEvent, router]);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const isUserOrgAdmin = (organizationId?: string) => {
    // This would check if user is admin of the organization
    // Implementation depends on your organization membership structure
    return false; // Placeholder
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file.`);
        return false;
      }
      return true;
    });

    if (uploadedImages.length + validFiles.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploadedImages(prev => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImages(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    if (index < uploadedImages.length) {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSkillAdd = (skill: string) => {
    if (skill && !selectedSkills.includes(skill) && selectedSkills.length < 10) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      setValue('skills', newSkills);
    }
  };

  const handleSkillRemove = (skill: string) => {
    const newSkills = selectedSkills.filter(s => s !== skill);
    setSelectedSkills(newSkills);
    setValue('skills', newSkills);
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSaving(true);

    try {
      const formData = new FormData();

      // Append form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append SDGs and skills
      formData.append('sdgTags', JSON.stringify(selectedSDGs));
      formData.append('skills', JSON.stringify(selectedSkills));

      // Append uploaded images
      uploadedImages.forEach((file, index) => {
        formData.append(`image_${index}`, file);
      });

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update event');
      }

      const result = await response.json();
      toast.success('Event updated successfully!');
      setHasUnsavedChanges(false);
      
      // Redirect based on event status
      if (data.status === EventStatus.ACTIVE) {
        router.push(`/events/${eventId}`);
      } else {
        router.push('/dashboard');
      }

    } catch (error) {
      console.error('Error updating event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    if (event && event.currentParticipants > 0) {
      toast.error('Cannot delete event with participants');
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success('Event deleted successfully');
      router.push('/dashboard');

    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const skillOptions = [
    'Teaching', 'Coding', 'Design', 'Marketing', 'Photography', 'Writing',
    'Translation', 'Medical', 'Construction', 'Gardening', 'Cooking',
    'Event Planning', 'Fundraising', 'Public Speaking', 'Social Media',
    'Data Analysis', 'Project Management', 'Research', 'Legal Advice'
  ];

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Event not found</h2>
          <p className="text-muted-foreground mb-4">
            The event you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have permission to edit it.
          </p>
          <Button onClick={() => router.push('/events')}>
            Back to Events
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
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    router.back();
                  }
                } else {
                  router.back();
                }
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Edit Event</h1>
              <p className="text-muted-foreground">
                Make changes to your event and save them
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant={
              event.status === EventStatus.ACTIVE ? 'default' :
              event.status === EventStatus.DRAFT ? 'secondary' :
              event.status === EventStatus.COMPLETED ? 'success' : 'destructive'
            }>
              {event.status}
            </Badge>

            {event.currentParticipants > 0 && (
              <Badge variant="outline">
                {event.currentParticipants} participants
              </Badge>
            )}
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 dark:text-yellow-200">
                You have unsaved changes. Make sure to save before leaving this page.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            {/* Pill-like Navigation */}
            <div className="flex flex-wrap gap-2">
              <Button
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
                variant={activeTab === 'details' ? 'default' : 'outline'}
                onClick={() => setActiveTab('details')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'details' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Details
              </Button>
              <Button
                variant={activeTab === 'media' ? 'default' : 'outline'}
                onClick={() => setActiveTab('media')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'media' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Media
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'outline'}
                onClick={() => setActiveTab('settings')}
                className={`rounded-full px-6 py-2 ${
                  activeTab === 'settings' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Settings
              </Button>
            </div>

            {/* Basic Information Tab Content */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      {...register('title', { required: 'Title is required' })}
                      placeholder="Enter a compelling event title"
                      error={errors.title?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register('description', { required: 'Description is required' })}
                      placeholder="Describe what participants will do and the impact they'll create..."
                      rows={4}
                      error={errors.description?.message}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date & Time *</Label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        {...register('startDate', { required: 'Start date is required' })}
                        error={errors.startDate?.message}
                      />
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date & Time</Label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        {...register('endDate')}
                        min={watchedValues.startDate}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={watchedValues.location?.isVirtual}
                      onCheckedChange={(checked) => 
                        setValue('location.isVirtual', checked, { shouldDirty: true })
                      }
                    />
                    <Label htmlFor="isVirtual">Virtual Event</Label>
                  </div>

                  {!watchedValues.location?.isVirtual && (
                    <>
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          {...register('location.city', { 
                            required: !watchedValues.location?.isVirtual ? 'City is required' : false 
                          })}
                          placeholder="Enter city name"
                          error={errors.location?.city?.message}
                        />
                      </div>

                      <div>
                        <Label htmlFor="address">Specific Address</Label>
                        <Input
                          id="address"
                          {...register('location.address')}
                          placeholder="Enter full address (optional)"
                        />
                      </div>

                      <div>
                        <Label>Event Location Coordinates *</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Click to get precise location coordinates for attendance verification (within 200m)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const city = watchedValues.location?.city?.trim();
                              const address = watchedValues.location?.address?.trim();

                              // Check if we have at least city or address
                              if (!city && !address) {
                                toast.error('Please enter a city and address first');
                                return;
                              }

                              toast.loading('Getting location coordinates...', { id: 'location' });
                              
                              // Build the full address query
                              let query = '';
                              if (address && city) {
                                query = `${address}, ${city}`;
                              } else if (address) {
                                query = address;
                              } else if (city) {
                                query = city;
                              }

                              // Call Nominatim API for geocoding
                              const response = await fetch(
                                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
                                {
                                  headers: {
                                    'User-Agent': 'Impaktr Event Management App'
                                  }
                                }
                              );

                              if (!response.ok) {
                                throw new Error('Failed to geocode address');
                              }

                              const data = await response.json();

                              if (!data || data.length === 0) {
                                toast.error('Address not found. Please check the address or city.', { id: 'location' });
                                return;
                              }

                              const coordinates = {
                                lat: parseFloat(data[0].lat),
                                lng: parseFloat(data[0].lon),
                              };

                              setValue('location.coordinates', coordinates, { shouldValidate: true, shouldDirty: true });
                              toast.success(`Location coordinates saved successfully!`, { id: 'location' });
                            } catch (error) {
                              console.error('Geocoding error:', error);
                              toast.error('Failed to get location coordinates. Please try again.', { id: 'location' });
                            }
                          }}
                          className="w-full"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          {watchedValues.location?.coordinates ? 'Update Location Coordinates' : 'Get Location Coordinates'}
                        </Button>
                        {watchedValues.location?.coordinates ? (
                          <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                              ✓ Coordinates saved: {watchedValues.location.coordinates.lat.toFixed(6)}, {watchedValues.location.coordinates.lng.toFixed(6)}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Participants will need to be within 200 meters of this location to mark attendance.
                            </p>
                          </div>
                        ) : (
                          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                              ⚠ Coordinates not set
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              Please click "Get Location Coordinates" to enable location-based attendance verification.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {/* Details Tab Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Impact & Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-4 block">SDG Focus Areas (select up to 5)</Label>
                    <SDGSelector
                      selectedSDGs={selectedSDGs}
                      onSelectionChange={(sdgs) => {
                        setSelectedSDGs(sdgs);
                        setValue('sdgTags', sdgs, { shouldDirty: true });
                      }}
                      maxSelection={5}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="intensity">Intensity Level</Label>
                      <Select
                        value={watchedValues.intensity?.toString()}
                        onValueChange={(value) => setValue('intensity', parseFloat(value), { shouldDirty: true })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.8">Light (0.8x points)</SelectItem>
                          <SelectItem value="1.0">Medium (1.0x points)</SelectItem>
                          <SelectItem value="1.2">High (1.2x points)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="maxParticipants">Max Participants</Label>
                      <Input
                        id="maxParticipants"
                        type="number"
                        {...register('maxParticipants', { 
                          min: { value: 1, message: 'Minimum 1 participant' },
                          max: { value: 1000, message: 'Maximum 1000 participants' }
                        })}
                        placeholder="Leave empty for unlimited"
                        error={errors.maxParticipants?.message}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Skills Required</Label>
                    <div className="mt-2">
                      <Select onValueChange={handleSkillAdd}>
                        <SelectTrigger>
                          <SelectValue placeholder="Add a skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillOptions
                            .filter(skill => !selectedSkills.includes(skill))
                            .map((skill) => (
                              <SelectItem key={skill} value={skill}>
                                {skill}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedSkills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => handleSkillRemove(skill)}
                          >
                            {skill} ×
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="verificationType">Verification Method</Label>
                    <Select
                      value={watchedValues.verificationType}
                      onValueChange={(value) => setValue('verificationType', value as VerificationType, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ORGANIZER">Organizer Verification</SelectItem>
                        <SelectItem value="PEER">Peer Verification</SelectItem>
                        <SelectItem value="GPS">GPS Check-in</SelectItem>
                        <SelectItem value="SELF">Self Reporting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}

            {/* Media Tab Content */}
            {activeTab === 'media' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Event Images
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="images">Upload Images (Max 5)</Label>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={previewImages.length >= 5}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended size: 1200x800px. Max file size: 5MB each.
                    </p>
                  </div>

                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {previewImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <Image
                            src={image}
                            alt={`Event image ${index + 1}`}
                            width={200}
                            height={128}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            onClick={() => removeImage(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            )}

            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Status & Visibility</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Event Status</Label>
                    <Select
                      value={watchedValues.status}
                      onValueChange={(value) => setValue('status', value as EventStatus, { shouldDirty: true })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">
                          <div className="flex items-center">
                            <EyeOff className="w-4 h-4 mr-2" />
                            Draft - Not visible to public
                          </div>
                        </SelectItem>
                        <SelectItem value="ACTIVE">
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-2" />
                            Active - Open for registration
                          </div>
                        </SelectItem>
                        <SelectItem value="COMPLETED">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Completed - No longer accepting participants
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {event.currentParticipants > 0 && watchedValues.status === EventStatus.DRAFT && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                            Cannot set to draft
                          </p>
                          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                            This event has {event.currentParticipants} participants and cannot be changed to draft status.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Delete Event</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete this event. This action cannot be undone.
                        {event.currentParticipants > 0 && ' Cannot delete events with participants.'}
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={event.currentParticipants > 0}
                      >
                        Delete Event
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (hasUnsavedChanges) {
                  if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    router.back();
                  }
                } else {
                  router.back();
                }
              }}
            >
              Cancel
            </Button>

            <div className="flex items-center space-x-3">
              {watchedValues.status === EventStatus.DRAFT && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue('status', EventStatus.ACTIVE, { shouldDirty: true });
                    handleSubmit(onSubmit)();
                  }}
                  disabled={isSaving}
                >
                  Save & Publish
                </Button>
              )}

              <Button type="submit" disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}