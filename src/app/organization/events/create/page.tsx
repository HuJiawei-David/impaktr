// home/ubuntu/impaktrweb/src/app/events/create/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  Image as ImageIcon,
  FileText,
  Award,
  Save,
  Eye,
  ArrowLeft,
  Plus,
  X,
  Globe,
  Building2
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { SDGSelector } from '@/components/ui/sdg-selector';
import { toast } from 'react-hot-toast';
import { EventPreview } from '@/components/events/EventPreview';
import { useEventNotificationStore } from '@/store/eventNotificationStore';

interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  registrationDeadline?: string;
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
  verificationType: 'SELF' | 'PEER' | 'ORGANIZER' | 'GPS' | 'AUTOMATIC';
  organizationId?: string;
  requiresApproval: boolean;
  certificateTemplate?: string;
  isPublic: boolean;
  customFields: Array<{
    name: string;
    type: 'text' | 'number' | 'select' | 'boolean';
    required: boolean;
    options?: string[];
  }>;
}

const verificationTypes = [
  { value: 'ORGANIZER', label: 'Organizer Verification', description: 'Event organizers verify participant hours' },
  { value: 'PEER', label: 'Peer Verification', description: 'Participants verify each other' },
  { value: 'GPS', label: 'GPS Check-in', description: 'Location-based automatic verification' },
  { value: 'SELF', label: 'Self Reporting', description: 'Participants self-report their hours' }
];

const skillOptions = [
  'Teaching', 'Coding', 'Design', 'Marketing', 'Photography', 'Writing',
  'Translation', 'Medical', 'Construction', 'Gardening', 'Cooking',
  'Event Planning', 'Fundraising', 'Public Speaking', 'Social Media',
  'Data Analysis', 'Project Management', 'Research', 'Sales', 'Customer Service'
];

export default function CreateEventPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === 'loading';
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [organizations, setOrganizations] = useState<Array<{
    id: string;
    name: string;
    logo?: string;
    type?: string;
  }>>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [customFields, setCustomFields] = useState<EventFormData['customFields']>([]);
  
  // Event notification store
  const { incrementCount } = useEventNotificationStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues
  } = useForm<EventFormData>({
    defaultValues: {
      intensity: 1.0,
      verificationType: 'ORGANIZER',
      location: { isVirtual: false, city: '' },
      requiresApproval: false,
      sdgTags: [],
      skills: [],
      customFields: [],
      isPublic: true
    }
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signup');
      return;
    }

    if (user) {
      fetchUserOrganizations();
    }
  }, [isLoading, user]);

  const fetchUserOrganizations = async () => {
    try {
      const response = await fetch('/api/users/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, {
      name: '',
      type: 'text',
      required: false,
      options: []
    }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: Partial<EventFormData['customFields'][0]>) => {
    const updated = [...customFields];
    updated[index] = { ...updated[index], ...field };
    setCustomFields(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + eventImages.length <= 5) {
      setEventImages([...eventImages, ...files]);
    } else {
      toast.error('Maximum 5 images allowed');
    }
  };

  const removeImage = (index: number) => {
    setEventImages(eventImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EventFormData, saveAsDraft = false) => {
    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    try {
      const formData = new FormData();
      
      // Append event data
      const eventData = {
        ...data,
        sdgTags: selectedSDGs,
        skills: selectedSkills,
        customFields,
        status: saveAsDraft ? 'DRAFT' : 'ACTIVE'
      };

      formData.append('eventData', JSON.stringify(eventData));

      // Append images
      eventImages.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      const response = await fetch('/api/organization/events', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const result = await response.json();
      
      toast.success(saveAsDraft ? 'Event saved as draft' : 'Event created successfully!');
      // Increment event notification count
      incrementCount(1);
      router.push(`/organization/events`);
      
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    {...register('title', { required: 'Event title is required' })}
                    placeholder="e.g., Beach Cleanup Drive, Community Garden Project"
                    error={errors.title?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    placeholder="Describe what participants will do, what impact they'll create, and what they'll gain from this experience..."
                    rows={4}
                    error={errors.description?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="organizationId">Create for Organization (Optional)</Label>
                  <Select onValueChange={(value) => setValue('organizationId', value === 'individual' ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization or create as individual" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Create as Individual</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4" />
                            <span>{org.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* SDG Selection */}
                <div>
                  <Label>SDG Focus Areas *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select up to 5 UN Sustainable Development Goals that this event supports
                  </p>
                  <div className="mt-4">
                    <SDGSelector
                      selectedSDGs={selectedSDGs}
                      onSelectionChange={setSelectedSDGs}
                      maxSelection={5}
                      showDescription={true}
                      showSelectAll={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Event Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={eventImages.length >= 5}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload up to 5 images (JPG, PNG, WebP). First image will be the cover photo.
                    </p>
                  </div>

                  {eventImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {eventImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <Badge className="absolute bottom-1 left-1 text-xs">Cover</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Date and Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Date and Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date and Time *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      {...register('startDate', { required: 'Start date is required' })}
                      error={errors.startDate?.message}
                    />
                  </div>

                  <div>
                    <Label htmlFor="endDate">End Date and Time (Optional)</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      {...register('endDate')}
                      min={watch('startDate')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="registrationDeadline">Registration Deadline <span className="text-red-500">*</span></Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    {...register('registrationDeadline', { required: 'Registration deadline is required' })}
                    max={watch('startDate')}
                  />
                  {errors.registrationDeadline && (
                    <p className="text-xs text-red-500 mt-1">{errors.registrationDeadline.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Set a deadline for participants to register before the event starts.
                  </p>
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
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watch('location.isVirtual')}
                    onCheckedChange={(checked) => setValue('location.isVirtual', checked)}
                  />
                  <Label>This is a virtual event</Label>
                </div>

                {!watch('location.isVirtual') && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        {...register('location.city', { 
                          required: !watch('location.isVirtual') ? 'City is required' : false 
                        })}
                        placeholder="e.g., Kuala Lumpur"
                        error={errors.location?.city?.message}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Full Address (Optional)</Label>
                      <Textarea
                        id="address"
                        {...register('location.address')}
                        placeholder="Street address, building name, specific meeting point..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}

                {watch('location.isVirtual') && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Virtual event details (meeting links, access codes) can be shared with participants after they join.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Participants
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxParticipants">Maximum Participants (Optional)</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    {...register('maxParticipants', { min: 1, valueAsNumber: true })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={watch('requiresApproval')}
                      onCheckedChange={(checked) => setValue('requiresApproval', checked)}
                    />
                    <Label>Require approval before joining</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={watch('isPublic')}
                      onCheckedChange={(checked) => setValue('isPublic', checked)}
                    />
                    <Label>Public event (visible to all users)</Label>
                  </div>
                  {!watch('isPublic') && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        Private events are only visible to your organization members.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Skills and Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Skills and Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Skills Required (Optional)</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select skills that would be helpful for this event
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {skillOptions.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer p-2 rounded border hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>

                  {selectedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Intensity Level */}
                <div>
                  <Label htmlFor="intensity">Intensity Level</Label>
                  <Select 
                    value={watch('intensity')?.toString()} 
                    onValueChange={(value) => setValue('intensity', parseFloat(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">Light (0.8x) - Suitable for beginners</SelectItem>
                      <SelectItem value="1.0">Medium (1.0x) - Standard intensity</SelectItem>
                      <SelectItem value="1.2">High (1.2x) - Physically or mentally demanding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification Method */}
                <div>
                  <Label>Verification Method</Label>
                  <div className="space-y-3 mt-2">
                    {verificationTypes.map((type) => (
                      <label key={type.value} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-accent">
                        <input
                          type="radio"
                          value={type.value}
                          {...register('verificationType')}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Custom Registration Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Registration Fields</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add custom questions for participants during registration (optional)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {customFields.map((field, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">Field {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomField(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Field Name</Label>
                        <Input
                          placeholder="e.g., Dietary Restrictions"
                          value={field.name}
                          onChange={(e) => updateCustomField(index, { name: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label>Field Type</Label>
                        <Select 
                          value={field.type} 
                          onValueChange={(value: "text" | "number" | "select" | "boolean") => updateCustomField(index, { type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="select">Dropdown</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <Label>Options (comma separated)</Label>
                        <Input
                          placeholder="Option 1, Option 2, Option 3"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateCustomField(index, { 
                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          })}
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateCustomField(index, { required: e.target.checked })}
                      />
                      <Label className="text-sm">Required field</Label>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomField}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Field
                </Button>
              </CardContent>
            </Card>

            {/* Certificate Template */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="certificateTemplate">Certificate Template</Label>
                  <Select onValueChange={(value) => setValue('certificateTemplate', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose certificate template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Impaktr Certificate</SelectItem>
                      <SelectItem value="eco">Environmental Impact Certificate</SelectItem>
                      <SelectItem value="education">Education Support Certificate</SelectItem>
                      <SelectItem value="community">Community Service Certificate</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Final Review */}
            <Card>
              <CardHeader>
                <CardTitle>Review Your Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div><strong>Title:</strong> {watch('title')}</div>
                  <div><strong>Date:</strong> {watch('startDate') && new Date(watch('startDate')).toLocaleDateString()}</div>
                  <div><strong>Location:</strong> {watch('location.isVirtual') ? 'Virtual' : watch('location.city')}</div>
                  <div><strong>SDGs:</strong> {selectedSDGs.length} selected</div>
                  <div><strong>Skills:</strong> {selectedSkills.length} selected</div>
                  <div><strong>Verification:</strong> {watch('verificationType')}</div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Event
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/organization/events')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div>
              <h1 className="text-3xl font-bold">Create New Event</h1>
              <p className="text-muted-foreground">
                Create an impactful volunteering opportunity for your community
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Basic Info</span>
            <span>Date & Location</span>
            <span>Requirements</span>
            <span>Advanced</span>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => onSubmit(data, false))}>
          {/* Step Content */}
          <div className="mb-8">
            {renderStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit((data) => onSubmit(data, true))();
                }}
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                {isDraft ? 'Saving Draft...' : 'Save Draft'}
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!watch('title') && currentStep === 1}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {isSubmitting ? 'Creating Event...' : 'Create Event'}
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Preview Modal */}
        {showPreview && (
          <EventPreview
            event={{
              ...getValues(),
              id: 'preview-' + Date.now(),
              sdgTags: selectedSDGs,
              skills: selectedSkills,
              images: eventImages.map(img => URL.createObjectURL(img)),
              documents: [],
              currentParticipants: 0,
              creator: {
                id: session?.user?.id || 'temp-id',
                name: session?.user?.name || 'You',
                avatar: session?.user?.image || ''
              },
              organization: organizations.find(org => org.id === getValues().organizationId) ? {
                id: organizations.find(org => org.id === getValues().organizationId)!.id,
                name: organizations.find(org => org.id === getValues().organizationId)!.name,
                logo: organizations.find(org => org.id === getValues().organizationId)!.logo || ''
              } : undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              status: 'DRAFT' as const,
              location: {
                ...getValues().location,
                country: 'Malaysia' // Default country
              }
            }}
            showActions={false}
          />
        )}
      </div>
    </div>
  );
}