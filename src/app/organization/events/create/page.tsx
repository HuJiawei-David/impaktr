// home/ubuntu/impaktrweb/src/app/events/create/page.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, useWatch } from 'react-hook-form';
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
  Building2,
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  Info
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  requiresApproval: boolean;
  certificateTemplate?: string;
  isPublic: boolean;
  eventInstructions?: string;
  materialsNeeded?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    email: string;
  } | null;
  autoIssueCertificates?: boolean;
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
  const [editEventId, setEditEventId] = useState<string | null>(null);
  const isEditMode = !!editEventId;
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [selectedSDGs, setSelectedSDGs] = useState<number[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [customFields, setCustomFields] = useState<EventFormData['customFields']>([]);
  
  // SDG Recommendations State
  const [sdgRecommendations, setSdgRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  
  // Validation State
  const [stepValidationErrors, setStepValidationErrors] = useState<{[key: number]: string[]}>({});
  const [isValidating, setIsValidating] = useState(false);
  
  // Switch animation state
  const [switchAnimations, setSwitchAnimations] = useState<{[key: string]: boolean}>({});
  
  // Event notification store
  const { incrementCount } = useEventNotificationStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    getValues,
    control
  } = useForm<EventFormData>({
    defaultValues: {
      intensity: 1.0,
      verificationType: 'ORGANIZER',
      location: { isVirtual: false, city: '' },
      requiresApproval: false,
      sdgTags: [],
      skills: [],
      customFields: [],
      isPublic: true,
      autoIssueCertificates: true,
      eventInstructions: '',
      materialsNeeded: [],
      emergencyContact: null
    }
  });

  // Use useWatch for reactive switch values
  const isVirtual = useWatch({ control, name: 'location.isVirtual' });
  const requiresApproval = useWatch({ control, name: 'requiresApproval' });
  const isPublic = useWatch({ control, name: 'isPublic' });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signup');
      return;
    }

    // Check for edit query parameter
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        setEditEventId(editId);
      }
    }
  }, [isLoading, user]);

  useEffect(() => {
    // Load event data if in edit mode
    if (isEditMode && editEventId && user && !loadingEvent) {
      setLoadingEvent(true);
      fetchEventForEdit();
    }
  }, [isEditMode, editEventId, user]);

  const fetchEventForEdit = async () => {
    if (!editEventId) return;
    
    try {
      setLoadingEvent(true);
      const response = await fetch(`/api/organization/events/${editEventId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      const data = await response.json();
      const event = data.event;

      // Parse SDG tags
      const sdgTags = event.sdg ? (() => {
        try {
          if (typeof event.sdg === 'string' && event.sdg.startsWith('[')) {
            const parsed = JSON.parse(event.sdg);
            return Array.isArray(parsed) ? parsed.filter((num: any) => num !== null && !isNaN(num)) : [];
          }
          return event.sdg.split(',').map((sdg: string) => {
            const match = sdg.match(/\d+/);
            return match ? parseInt(match[0], 10) : null;
          }).filter((num: number | null) => num !== null);
        } catch {
          return [];
        }
      })() : [];

      // Format dates for datetime-local inputs
      const formatDateForInput = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Parse location
      let location = { isVirtual: false, city: '' };
      try {
        if (typeof event.location === 'string') {
          location = JSON.parse(event.location);
        } else if (event.location) {
          location = event.location;
        }
      } catch {
        // Keep default
      }

      // Parse emergency contact
      let emergencyContact = null;
      if (event.emergencyContact) {
        try {
          emergencyContact = typeof event.emergencyContact === 'string' 
            ? JSON.parse(event.emergencyContact) 
            : event.emergencyContact;
        } catch {
          emergencyContact = null;
        }
      }

      // Set form values
      setValue('title', event.title || '');
      setValue('description', event.description || '');
      setValue('startDate', formatDateForInput(event.startDate));
      setValue('endDate', formatDateForInput(event.endDate));
      setValue('registrationDeadline', formatDateForInput(event.registrationDeadline));
      setValue('location', location);
      setValue('maxParticipants', event.maxParticipants || undefined);
      setValue('intensity', event.intensity || 1.0);
      setValue('verificationType', event.verificationType || 'ORGANIZER');
      setValue('eventInstructions', event.eventInstructions || '');
      setValue('materialsNeeded', event.materialsNeeded || []);
      setValue('emergencyContact', emergencyContact);
      setValue('requiresApproval', event.requiresApproval || false);
      setValue('autoIssueCertificates', event.autoIssueCertificates !== false);
      setValue('isPublic', event.isPublic !== false);

      setSelectedSDGs(sdgTags);
      setSelectedSkills(event.skills || []);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event');
      router.push('/organization/events');
    } finally {
      setLoadingEvent(false);
    }
  };

  // Debounced title and description analysis for SDG recommendations
  useEffect(() => {
    const title = watch('title');
    const description = watch('description');
    
    if (!title || title.trim().length < 3) {
      setSdgRecommendations([]);
      setShowRecommendations(false);
      return;
    }

    const debounceTimer = setTimeout(() => {
      fetchSDGRecommendations(title, description);
    }, 1000); // 1 second debounce

    return () => clearTimeout(debounceTimer);
  }, [watch('title'), watch('description')]);

  // Real-time validation effect
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Clear validation errors for the current step when any field changes
      if (name && stepValidationErrors[currentStep]?.length > 0) {
        clearStepValidationErrors(currentStep);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, currentStep, stepValidationErrors]);


  const fetchSDGRecommendations = async (title: string, description?: string) => {
    if (!title || title.trim().length < 3) return;

    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      const response = await fetch('/api/sdg/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description?.trim(),
          contextSDGs: selectedSDGs,
          mode: 'quick', // Use quick mode for faster response
          minConfidence: 0.4, // Lower threshold since we have description
          maxRecommendations: 5
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
  };

  const applySDGRecommendation = (sdgNumber: number) => {
    if (!selectedSDGs.includes(sdgNumber)) {
      if (selectedSDGs.length < 5) {
        setSelectedSDGs([...selectedSDGs, sdgNumber]);
        toast.success(`SDG ${sdgNumber} added`);
      } else {
        toast.error('Maximum 5 SDGs allowed');
      }
    }
  };

  const applyAllRecommendations = () => {
    const newSDGs = sdgRecommendations
      .filter(rec => rec.isNew)
      .map(rec => rec.sdgNumber)
      .slice(0, 5 - selectedSDGs.length);

    if (newSDGs.length > 0) {
      setSelectedSDGs([...selectedSDGs, ...newSDGs]);
      toast.success(`Added ${newSDGs.length} recommended SDG${newSDGs.length > 1 ? 's' : ''}`);
      setShowRecommendations(false);
    }
  };

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Validation functions for each step
  const validateStep1 = (): string[] => {
    const errors: string[] = [];
    const formData = getValues();
    
    if (!formData.title || formData.title.trim().length === 0) {
      errors.push('Event title is required');
    }
    
    if (!formData.description || formData.description.trim().length === 0) {
      errors.push('Event description is required');
    }
    
    if (selectedSDGs.length === 0) {
      errors.push('At least one SDG must be selected');
    }
    
    return errors;
  };

  const validateStep2 = (): string[] => {
    const errors: string[] = [];
    const formData = getValues();
    
    if (!formData.startDate) {
      errors.push('Start date and time is required');
    }
    
    if (!formData.registrationDeadline) {
      errors.push('Registration deadline is required');
    }
    
    if (formData.startDate && formData.registrationDeadline) {
      const startDate = new Date(formData.startDate);
      const regDeadline = new Date(formData.registrationDeadline);
      if (regDeadline >= startDate) {
        errors.push('Registration deadline must be before the event start date');
      }
    }
    
    if (!formData.location.isVirtual) {
      if (!formData.location.city || formData.location.city.trim().length === 0) {
        errors.push('City is required for non-virtual events');
      }
      if (!formData.location.address || formData.location.address.trim().length === 0) {
        errors.push('Meeting location is required for non-virtual events');
      }
    }
    
    return errors;
  };

  const validateStep3 = (): string[] => {
    const errors: string[] = [];
    // Step 3 has no required fields, all are optional
    return errors;
  };

  const validateStep4 = (): string[] => {
    const errors: string[] = [];
    // Step 4 has no required fields, all are optional
    return errors;
  };

  const validateCurrentStep = (step?: number): boolean => {
    const stepToValidate = step ?? currentStep;
    setIsValidating(true);
    let errors: string[] = [];
    
    switch (stepToValidate) {
      case 1:
        errors = validateStep1();
        break;
      case 2:
        errors = validateStep2();
        break;
      case 3:
        errors = validateStep3();
        break;
      case 4:
        errors = validateStep4();
        break;
      default:
        errors = [];
    }
    
    setStepValidationErrors(prev => ({
      ...prev,
      [stepToValidate]: errors
    }));
    
    setIsValidating(false);
    return errors.length === 0;
  };

  const clearStepValidationErrors = (step: number) => {
    setStepValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[step];
      return newErrors;
    });
  };

  const handleSwitchChange = (switchKey: string, checked: boolean, onChange: (checked: boolean) => void) => {
    console.log('🔄 Switch clicked:', switchKey, 'New value:', checked);
    console.log('Before update - All form values:', getValues());
    
    // Trigger animation
    setSwitchAnimations(prev => ({ ...prev, [switchKey]: true }));
    
    // Call the original onChange
    onChange(checked);
    
    // Use setTimeout to check the value after React has updated
    setTimeout(() => {
      console.log('After update - All form values:', getValues());
      console.log('✅ Switch state updated:', switchKey, '=', checked);
    }, 0);
    
    // Clear animation after a short delay
    setTimeout(() => {
      setSwitchAnimations(prev => ({ ...prev, [switchKey]: false }));
    }, 300);
  };

  // Track if user explicitly clicked submit button (using ref for synchronous updates)
  const isExplicitSubmitRef = useRef(false);

  const handleNext = () => {
    // Use functional update to ensure we have the latest step value
    setCurrentStep((prevStep) => {
      // Ensure we don't go beyond the last step
      if (prevStep >= totalSteps) {
        console.warn(`Already on the last step (${prevStep} of ${totalSteps})`);
        return prevStep;
      }
      
      // Validate the current step before proceeding (pass the step explicitly)
      const isValid = validateCurrentStep(prevStep);
      
      if (isValid) {
        const nextStep = prevStep + 1;
        console.log(`Moving from step ${prevStep} to step ${nextStep} of ${totalSteps}`);
        return nextStep;
      } else {
        console.log(`Validation failed for step ${prevStep}, staying on current step`);
        return prevStep;
      }
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    // Only allow form submission if we're on the last step AND user explicitly clicked submit button
    const isOnLastStep = currentStep === totalSteps;
    const isSubmitButtonClick = isExplicitSubmitRef.current;
    
    if (!isOnLastStep) {
      // Not on last step - show error and prevent submission
      e.preventDefault();
      e.stopPropagation();
      console.log(`Prevented form submission: currentStep=${currentStep}, totalSteps=${totalSteps}`);
      toast.error(`Please complete all steps. You are currently on step ${currentStep} of ${totalSteps}.`);
      return false;
    }
    
    // On last step but not explicit submit - silently prevent (likely accidental Enter key press)
    if (!isSubmitButtonClick) {
      e.preventDefault();
      e.stopPropagation();
      console.log(`Prevented form submission: on last step but not explicit submit`);
      // Reset the flag
      isExplicitSubmitRef.current = false;
      return false;
    }
    
    // Reset the flag after allowing submission
    isExplicitSubmitRef.current = false;
    return true;
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
    
    // Validate image types (jpeg, png, gif, webp)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    files.forEach((file) => {
      // Check file type
      if (!allowedTypes.includes(file.type.toLowerCase())) {
        invalidFiles.push(`${file.name} (unsupported format)`);
        return;
      }
      
      // Check file size
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (file too large, max 5MB)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      toast.error(`Invalid files:\n${invalidFiles.join('\n')}\n\nSupported formats: JPEG, PNG, GIF, WebP (max 5MB each)`);
    }
    
    // Check total count limit
    if (validFiles.length + eventImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    if (validFiles.length > 0) {
      setEventImages([...eventImages, ...validFiles]);
    }
  };

  const removeImage = (index: number) => {
    setEventImages(eventImages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: EventFormData, saveAsDraft = false) => {
    setIsSubmitting(true);
    setIsDraft(saveAsDraft);

    try {
      // Validate required fields
      if (!data.title || !data.description || !data.startDate) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        setIsDraft(false);
        return;
      }

      // Validate registrationDeadline
      if (!data.registrationDeadline) {
        toast.error('Registration deadline is required');
        setIsSubmitting(false);
        setIsDraft(false);
        return;
      }

      // Validate location for non-virtual events
      if (!data.location.isVirtual) {
        if (!data.location.city) {
          toast.error('City is required for non-virtual events');
          setIsSubmitting(false);
          setIsDraft(false);
          return;
        }
        if (!data.location.address) {
          toast.error('Meeting location is required for non-virtual events');
          setIsSubmitting(false);
          setIsDraft(false);
          return;
        }
      }

      // Validate coordinates for non-virtual events (optional but recommended)
      if (!data.location.isVirtual && !data.location.coordinates) {
        // Show warning but allow submission (not blocking)
        console.warn('Event location coordinates not set. Location verification will not work.');
      }

      // Validate SDG selection
      if (selectedSDGs.length === 0) {
        toast.error('Please select at least one SDG');
        setIsSubmitting(false);
        setIsDraft(false);
        return;
      }

      // Prepare event data to match API schema
      const eventData = {
        title: data.title.trim(),
        description: data.description.trim(),
        startDate: data.startDate,
        endDate: data.endDate && data.endDate.trim() ? data.endDate : undefined,
        registrationDeadline: data.registrationDeadline && data.registrationDeadline.trim() ? data.registrationDeadline : undefined,
        location: {
          // If virtual, ensure address and city are empty strings
          address: data.location.isVirtual ? '' : (data.location.address ? data.location.address.trim() : ''),
          city: data.location.isVirtual ? '' : (data.location.city ? data.location.city.trim() : ''),
          coordinates: data.location.coordinates || undefined,
          isVirtual: data.location.isVirtual || false,
        },
        maxParticipants: data.maxParticipants && data.maxParticipants > 0 ? data.maxParticipants : undefined,
        sdgTags: selectedSDGs,
        skills: selectedSkills,
        intensity: data.intensity || 1.0,
        verificationType: data.verificationType || 'ORGANIZER',
        eventInstructions: data.eventInstructions ? data.eventInstructions.trim() : '',
        materialsNeeded: data.materialsNeeded || [],
        emergencyContact: data.emergencyContact || null,
        autoIssueCertificates: data.autoIssueCertificates !== undefined ? data.autoIssueCertificates : true,
        requiresApproval: data.requiresApproval || false,
        // Remove fields not expected by API
        // customFields, isPublic, organizationId, certificateTemplate
      };

      let response;
      
      // If we have images, use FormData; otherwise use JSON
      if (eventImages.length > 0) {
        console.log('Creating event with images:', eventImages.length);
        const formData = new FormData();
        
        // Stringify eventData and log it for debugging
        const eventDataJson = JSON.stringify(eventData);
        console.log('EventData JSON (first 200 chars):', eventDataJson.substring(0, 200));
        formData.append('eventData', eventDataJson);
        
        // Append all images
        eventImages.forEach((image, index) => {
          console.log(`Appending image ${index}:`, image.name, image.size, 'bytes');
          formData.append(`image_${index}`, image);
        });

        console.log('Sending FormData request...');
        response = await fetch(isEditMode ? `/api/organization/events/${editEventId}` : '/api/organization/events', {
          method: isEditMode ? 'PUT' : 'POST',
          body: formData,
          // Don't set Content-Type header - browser will set it with boundary
        });
      } else {
        console.log('Creating event without images (JSON)');
        response = await fetch(isEditMode ? `/api/organization/events/${editEventId}` : '/api/organization/events', {
          method: isEditMode ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON, try to get text
          const errorText = await response.text();
          console.error('API Error (non-JSON response):', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        console.error('API Error:', errorData);
        
        // Handle validation errors with detailed messages
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details.map((err: any) => `${err.field}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }
        
        // Handle image upload errors with detailed messages
        if (errorData.details && typeof errorData.details === 'string') {
          throw new Error(errorData.error ? `${errorData.error}: ${errorData.details}` : errorData.details);
        }
        
        throw new Error(errorData.error || (isEditMode ? 'Failed to update event' : 'Failed to create event'));
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse success response as JSON:', parseError);
        throw new Error('Server returned an invalid response format');
      }
      
      toast.success(isEditMode ? 'Event updated successfully!' : (saveAsDraft ? 'Event saved as draft' : 'Event created successfully!'));
      // Increment event notification count only for new events
      if (!isEditMode) {
        incrementCount(1);
      }
      router.push(`/organization/events`);
      
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error);
      const errorMessage = error instanceof Error ? error.message : (isEditMode ? 'Failed to update event. Please try again.' : 'Failed to create event. Please try again.');
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setIsDraft(false);
    }
  };

  // Validation Error Display Component
  const ValidationErrorDisplay = ({ step }: { step: number }) => {
    const errors = stepValidationErrors[step] || [];
    if (errors.length === 0) return null;

    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Please complete the following required fields:
              </h4>
              <ul className="space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <ValidationErrorDisplay step={1} />
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
                  <div className="relative">
                    <Input
                      id="title"
                      {...register('title', { required: 'Event title is required' })}
                      placeholder="e.g., Beach Cleanup Drive, Community Garden Project"
                      error={errors.title?.message}
                      onChange={(e) => {
                        register('title').onChange(e);
                        clearStepValidationErrors(1);
                      }}
                    />
                    {isLoadingRecommendations && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI will suggest relevant SDGs based on your event title and description
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register('description', { required: 'Description is required' })}
                    placeholder="Describe what participants will do, what impact they'll create, and what they'll gain from this experience..."
                    rows={4}
                    error={errors.description?.message}
                    onChange={(e) => {
                      register('description').onChange(e);
                      clearStepValidationErrors(1);
                    }}
                  />
                </div>


                {/* SDG AI Recommendations */}
                {showRecommendations && sdgRecommendations.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
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
                        Based on your event title and description, we recommend these SDGs:
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
                                rec.confidenceLevel.level === 'very-high' ? 'bg-green-100 text-green-800' :
                                rec.confidenceLevel.level === 'high' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {rec.confidenceLevel.label}
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
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {!selectedSDGs.includes(rec.sdgNumber) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applySDGRecommendation(rec.sdgNumber)}
                              disabled={selectedSDGs.length >= 5}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {sdgRecommendations.some(rec => !selectedSDGs.includes(rec.sdgNumber)) && (
                        <Button
                          onClick={applyAllRecommendations}
                          className="w-full mt-2"
                          variant="default"
                          disabled={selectedSDGs.length >= 5}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Apply All Recommendations
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {recommendationError && (
                  <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Could not load AI recommendations
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            {recommendationError}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* SDG Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>SDG Focus Areas *</Label>
                    {watch('title') && watch('title').length >= 3 && !isLoadingRecommendations && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchSDGRecommendations(watch('title'), watch('description'))}
                        className="text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Get AI Suggestions
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select up to 5 UN Sustainable Development Goals that this event supports
                  </p>
                  <div className="mt-4">
                    <SDGSelector
                      selectedSDGs={selectedSDGs}
                      onSelectionChange={(newSDGs) => {
                        setSelectedSDGs(newSDGs);
                        clearStepValidationErrors(1);
                      }}
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
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      multiple
                      onChange={handleImageUpload}
                      disabled={eventImages.length >= 5}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload up to 5 images (JPEG, PNG, GIF, WebP - max 5MB each). First image will be the cover photo.
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
            <ValidationErrorDisplay step={2} />
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
                      onChange={(e) => {
                        register('startDate').onChange(e);
                        clearStepValidationErrors(2);
                      }}
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
                    onChange={(e) => {
                      register('registrationDeadline').onChange(e);
                      clearStepValidationErrors(2);
                    }}
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
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isVirtual}
                    onClick={() => {
                      const newValue = !isVirtual;
                      setValue('location.isVirtual', newValue, { shouldValidate: true, shouldDirty: true });
                      // If switching to virtual, clear address and city
                      if (newValue) {
                        setValue('location.address', '', { shouldValidate: false, shouldDirty: true });
                        setValue('location.city', '', { shouldValidate: false, shouldDirty: true });
                      }
                      clearStepValidationErrors(2);
                    }}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-white border-2 border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                  >
                    <span
                      className={`${
                        isVirtual ? 'translate-x-6 bg-blue-500' : 'translate-x-1 bg-gray-300'
                      } inline-block h-4 w-4 transform rounded-full transition-transform`}
                    />
                  </button>
                  <Label className="text-sm font-medium cursor-pointer">
                    This is a virtual event
                  </Label>
                </div>

                {isVirtual && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Virtual event details (meeting links, access codes) can be shared with participants after they join.
                    </p>
                  </div>
                )}

                {!isVirtual && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        {...register('location.city', { 
                          required: !isVirtual ? 'City is required' : false 
                        })}
                        placeholder="e.g., Kuala Lumpur"
                        error={errors.location?.city?.message}
                        onChange={(e) => {
                          register('location.city').onChange(e);
                          clearStepValidationErrors(2);
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address">Meeting Location *</Label>
                      <Textarea
                        id="address"
                        {...register('location.address', { 
                          required: !isVirtual ? 'Meeting location is required' : false 
                        })}
                        placeholder="Street address, building name, specific meeting point..."
                        rows={2}
                        error={errors.location?.address?.message}
                        onChange={(e) => {
                          register('location.address').onChange(e);
                          clearStepValidationErrors(2);
                        }}
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
                            const city = watch('location.city')?.trim();
                            const address = watch('location.address')?.trim();

                            // Check if we have at least city or address
                            if (!city && !address) {
                              toast.error('Please enter a city and address first', { id: 'location' });
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
                        {watch('location.coordinates') ? 'Update Location Coordinates' : 'Get Location Coordinates'}
                      </Button>
                      {watch('location.coordinates') ? (
                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                            ✓ Coordinates saved: {watch('location.coordinates')?.lat.toFixed(6)}, {watch('location.coordinates')?.lng.toFixed(6)}
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
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={requiresApproval}
                      onClick={() => {
                        setValue('requiresApproval', !requiresApproval, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-white border-2 border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                    >
                      <span
                        className={`${
                          requiresApproval ? 'translate-x-6 bg-blue-500' : 'translate-x-1 bg-gray-300'
                        } inline-block h-4 w-4 transform rounded-full transition-transform`}
                      />
                    </button>
                    <Label className="text-sm font-medium cursor-pointer">
                      Require approval before joining
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isPublic}
                      onClick={() => {
                        setValue('isPublic', !isPublic, { shouldValidate: true, shouldDirty: true });
                      }}
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-white border-2 border-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                    >
                      <span
                        className={`${
                          isPublic ? 'translate-x-6 bg-blue-500' : 'translate-x-1 bg-gray-300'
                        } inline-block h-4 w-4 transform rounded-full transition-transform`}
                      />
                    </button>
                    <Label className="text-sm font-medium cursor-pointer">
                      Public event
                    </Label>
                  </div>
                  {!isPublic && (
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
            <ValidationErrorDisplay step={3} />
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
            <ValidationErrorDisplay step={4} />
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
                  <div><strong>Location:</strong> {isVirtual ? 'Virtual' : watch('location.city')}</div>
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

  if (isLoading || loadingEvent) {
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
              <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
              <p className="text-muted-foreground">
                {isEditMode ? 'Update your event details and settings' : 'Create an impactful volunteering opportunity for your community'}
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

        <form 
          onSubmit={(e) => {
            const canSubmit = handleFormSubmit(e);
            if (canSubmit && !e.defaultPrevented) {
              handleSubmit((data) => onSubmit(data, false))(e);
            }
          }}
          onKeyDown={(e) => {
            // Prevent form submission on Enter key unless user is on last step and explicitly clicking submit
            if (e.key === 'Enter' && (currentStep !== totalSteps || !isExplicitSubmitRef.current)) {
              e.preventDefault();
              e.stopPropagation();
              console.log('Prevented Enter key submission - not on last step or not explicit submit');
            }
          }}
        >
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

              {/* Debug info - can be removed later */}
              <span className="text-xs text-muted-foreground self-center">
                Step: {currentStep} / {totalSteps}
              </span>

              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isValidating || (stepValidationErrors[currentStep] && stepValidationErrors[currentStep].length > 0)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    `Continue to Step ${currentStep + 1}`
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onMouseDown={(e) => {
                    // Set flag before form submission is triggered (synchronous ref update)
                    isExplicitSubmitRef.current = true;
                    console.log('User explicitly clicked Create Event button');
                  }}
                  onClick={(e) => {
                    // Ensure flag is set (backup)
                    isExplicitSubmitRef.current = true;
                  }}
                  className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {isSubmitting ? (isEditMode ? 'Updating Event...' : 'Creating Event...') : (isEditMode ? 'Update Event' : 'Create Event')}
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
              organization: undefined,
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