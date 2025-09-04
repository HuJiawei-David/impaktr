// home/ubuntu/impaktrweb/src/components/events/ParticipationDialog.tsx

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  MapPin, 
  Users, 
  Calendar,
  Award,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { formatDate, formatHours } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: {
    address?: string;
    city: string;
    isVirtual: boolean;
  };
  maxParticipants?: number;
  currentParticipants: number;
  sdgTags: number[];
  intensity: number;
  verificationType: string;
  creator: {
    name: string;
  };
  organization?: {
    name: string;
  };
}

interface ParticipationDialogProps {
  event: Event;
  trigger?: React.ReactNode;
  onParticipationUpdate?: () => void;
}

export function ParticipationDialog({ 
  event, 
  trigger, 
  onParticipationUpdate 
}: ParticipationDialogProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    hoursCommitted: '',
    notes: '',
    skills: [] as string[],
    motivation: '',
    expectations: ''
  });

  const isFull = event.maxParticipants && event.currentParticipants >= event.maxParticipants;
  const isUpcoming = new Date(event.startDate) > new Date();
  const progressPercentage = event.maxParticipants 
    ? (event.currentParticipants / event.maxParticipants) * 100 
    : 0;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.hoursCommitted && parseFloat(formData.hoursCommitted) > 0;
      case 2:
        return formData.motivation.trim().length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      toast.error('Please sign in to participate');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/events/${event.id}/participate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hoursCommitted: parseFloat(formData.hoursCommitted),
          notes: formData.notes,
          skills: formData.skills,
          motivation: formData.motivation,
          expectations: formData.expectations
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join event');
      }

      toast.success('Successfully joined the event!');
      setIsOpen(false);
      setStep(1);
      setFormData({
        hoursCommitted: '',
        notes: '',
        skills: [],
        motivation: '',
        expectations: ''
      });
      
      if (onParticipationUpdate) {
        onParticipationUpdate();
      }
      
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join event');
    } finally {
      setIsLoading(false);
    }
  };

  const availableSkills = [
    'Leadership', 'Teaching', 'Communication', 'Organization',
    'Technical Skills', 'Creative', 'Physical Labor', 'Research',
    'Social Media', 'Photography', 'Writing', 'Translation'
  ];

  const getVerificationDescription = () => {
    switch (event.verificationType.toLowerCase()) {
      case 'organizer':
        return 'Event organizer will verify your participation';
      case 'peer':
        return 'Other participants will verify your attendance';
      case 'gps':
        return 'GPS check-in will verify your presence';
      case 'self':
        return 'Self-reported with proof of participation';
      default:
        return 'Participation will be verified';
    }
  };

  const getIntensityInfo = () => {
    if (event.intensity <= 0.8) return { label: 'Light', color: 'text-green-600', description: 'Relaxed pace, suitable for beginners' };
    if (event.intensity <= 1.0) return { label: 'Medium', color: 'text-yellow-600', description: 'Moderate effort required' };
    return { label: 'High', color: 'text-red-600', description: 'Intensive work, physical or mental demands' };
  };

  const intensityInfo = getIntensityInfo();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            disabled={isFull || !isUpcoming}
            className="w-full"
          >
            {isFull ? 'Event Full' : 'Join Event'}
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Join Event</span>
          </DialogTitle>
          <DialogDescription>
            Complete your participation details for "{event.title}"
          </DialogDescription>
        </DialogHeader>

        {/* Event Summary Card */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{event.title}</h3>
            <Badge variant="outline">
              {event.organization?.name || event.creator.name}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{event.location.isVirtual ? 'Virtual' : event.location.city}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>
                {event.currentParticipants}
                {event.maxParticipants && `/${event.maxParticipants}`} participants
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Award className={`w-4 h-4 ${intensityInfo.color}`} />
              <span className={intensityInfo.color}>{intensityInfo.label} intensity</span>
            </div>
          </div>

          {/* Progress Bar */}
          {event.maxParticipants && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Spots filled</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {/* SDG Tags */}
          <div className="flex flex-wrap gap-1">
            {event.sdgTags.slice(0, 4).map((sdg) => (
              <Badge key={sdg} variant="sdg" sdgNumber={sdg} className="text-xs">
                SDG {sdg}
              </Badge>
            ))}
          </div>
        </div>

        {/* Multi-step Form */}
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum < step ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-1 mx-2 rounded ${
                    stepNum < step ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Commitment Details</h3>
                <p className="text-muted-foreground text-sm">
                  Tell us about your planned participation
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hoursCommitted">
                    Hours you plan to contribute *
                  </Label>
                  <Input
                    id="hoursCommitted"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 4"
                    value={formData.hoursCommitted}
                    onChange={(e) => handleInputChange('hoursCommitted', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum 0.5 hours required
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Additional notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements, questions, or information you'd like to share..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Verification Info */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Verification Method
                      </p>
                      <p className="text-blue-800 dark:text-blue-200">
                        {getVerificationDescription()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Skills & Motivation</h3>
                <p className="text-muted-foreground text-sm">
                  Help us understand your background and motivation
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Skills you can contribute (optional)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {availableSkills.map((skill) => (
                      <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.skills.includes(skill)}
                          onChange={() => handleSkillToggle(skill)}
                          className="rounded border-input"
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="motivation">
                    Why do you want to participate? *
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="Share your motivation for joining this event..."
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Final Details</h3>
                <p className="text-muted-foreground text-sm">
                  Almost there! Just a few more details
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="expectations">
                    What do you hope to achieve? (optional)
                  </Label>
                  <Textarea
                    id="expectations"
                    placeholder="What do you hope to learn or achieve from this experience?"
                    value={formData.expectations}
                    onChange={(e) => handleInputChange('expectations', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Summary */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Participation Summary
                  </h4>
                  <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                    <p><strong>Hours committed:</strong> {formData.hoursCommitted}</p>
                    {formData.skills.length > 0 && (
                      <p><strong>Skills:</strong> {formData.skills.join(', ')}</p>
                    )}
                    <p><strong>Intensity:</strong> {intensityInfo.label} - {intensityInfo.description}</p>
                  </div>
                </div>

                {/* Terms */}
                <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  <p>
                    By participating, you agree to attend the event as scheduled and 
                    contribute the committed hours. You understand that your participation 
                    will be verified and contribute to your Impaktr Score™.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            
            <div className="flex space-x-2 ml-auto">
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!validateStep() || isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="min-w-[100px]"
                >
                  {isLoading ? 'Joining...' : 'Join Event'}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}