'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Target, 
  Users, 
  Clock, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download,
  X,
  HelpCircle,
  Heart,
  FileText,
  RotateCcw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SuggestionRequest, SuggestionResult, SuggestedEvent } from '@/lib/esg/suggestion/types';
import { getSDGOptions } from '@/lib/esg/suggestion/sdg-mapping';
import { getSDGColor } from '@/lib/utils';
import { useEventNotificationStore } from '@/store/eventNotificationStore';
import { useSuggestionStore } from '@/store/suggestionStore';

// ESG Attribute explanations
const ESG_ATTRIBUTES = {
  E: { name: 'ΔE - Environmental Impact', description: 'Measures environmental impact through carbon reduction, waste management, and resource conservation' },
  H: { name: 'ΔH - Hours Impact', description: 'Total volunteer hours contributed, reflecting time investment in social good' },
  Q: { name: 'ΔQ - Quality Impact', description: 'Quality and effectiveness of the event based on participant feedback and outcomes' },
  V: { name: 'ΔV - Verification Impact', description: 'Level of verification and validation for impact claims and participation' },
  S: { name: 'ΔS - Social Impact', description: 'Social benefits delivered including community engagement, education, and welfare' },
  C: { name: 'ΔC - Cause Impact', description: 'Alignment with specific causes and SDGs, measuring thematic impact' },
  G: { name: 'ΔG - Governance Impact', description: 'Governance quality including transparency, accountability, and ethical practices' },
  overall: { name: 'Overall Δ - Total Impact Score', description: 'Combined impact score calculated as: (ΔE + ΔH + ΔQ + ΔV + ΔS + ΔC) × (G_current + ΔG) × 100, where ΔG comes from governance improvements in suggested events' }
};

// Helper to determine primary ESG band from SDGs
function getEventESGBand(sdgs: string[]): 'E' | 'S' | 'G' | null {
  const envSDGs = ['SDG6', 'SDG7', 'SDG11', 'SDG12', 'SDG13', 'SDG14', 'SDG15'];
  const socialSDGs = ['SDG1', 'SDG2', 'SDG3', 'SDG4', 'SDG5', 'SDG8', 'SDG10'];
  const govSDGs = ['SDG16', 'SDG17'];
  
  const envCount = sdgs.filter(s => envSDGs.includes(s)).length;
  const socialCount = sdgs.filter(s => socialSDGs.includes(s)).length;
  const govCount = sdgs.filter(s => govSDGs.includes(s)).length;
  
  if (envCount > socialCount && envCount > govCount) return 'E';
  if (socialCount > envCount && socialCount > govCount) return 'S';
  if (govCount > envCount && govCount > socialCount) return 'G';
  return null;
}

function getESGBandColor(band: 'E' | 'S' | 'G' | null): string {
  switch (band) {
    case 'E': return 'bg-green-100 text-green-800 border-green-300';
    case 'S': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'G': return 'bg-purple-100 text-purple-800 border-purple-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getESGBandLabel(band: 'E' | 'S' | 'G' | null): string {
  switch (band) {
    case 'E': return 'Environmental';
    case 'S': return 'Social';
    case 'G': return 'Governance';
    default: return 'Mixed';
  }
}

interface SuggestionPanelProps {
  organizationId: string;
}

export default function SuggestionPanel({ organizationId }: SuggestionPanelProps) {
  // Suggestion store for persistence
  const {
    formData: storedFormData,
    selectedSDGs: storedSelectedSDGs,
    result: storedResult,
    selectedEvents: storedSelectedEvents,
    organizationId: storedOrgId,
    timestamp,
    setFormData: setStoredFormData,
    setSelectedSDGs: setStoredSelectedSDGs,
    setResult: setStoredResult,
    setSelectedEvents: setStoredSelectedEvents,
    setOrganizationId: setStoredOrganizationId,
    clearSuggestions,
    hasSettingsChanged,
  } = useSuggestionStore();

  // Local state for UI interactions
  const [formData, setFormData] = useState<SuggestionRequest>({
    focus: {},
    targets: {},
    constraints: {},
  });
  
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedSDGs, setSelectedSDGs] = useState<string[]>([]);
  
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Event notification store
  const { incrementCount, incrementFavoriteCount } = useEventNotificationStore();

  // Initialize state from store on mount
  useEffect(() => {
    console.log('Initializing suggestion component:', {
      storedOrgId,
      organizationId,
      hasStoredResult: !!storedResult,
      timestamp
    });

    // Check if we have stored data for this organization
    if (storedOrgId === organizationId && storedResult && timestamp) {
      // Check if data is not expired (24 hours)
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      if (now - timestamp < dayInMs) {
        // Restore stored state
        setFormData(storedFormData);
        setSelectedSDGs(storedSelectedSDGs);
        setResult(storedResult);
        setSelectedEvents(new Set(storedSelectedEvents));
        
        console.log('Restored suggestion state from storage:', {
          hasResult: !!storedResult,
          selectedSDGs: storedSelectedSDGs.length,
          selectedEvents: storedSelectedEvents.length
        });
      } else {
        // Data expired, clear it
        console.log('Stored suggestion data expired, clearing');
        clearSuggestions();
      }
    } else if (storedOrgId && storedOrgId !== organizationId) {
      // Different organization, clear stored data
      console.log('Organization changed, clearing stored suggestions');
      clearSuggestions();
    }
    
    // Update stored organization ID
    setStoredOrganizationId(organizationId);
    setIsInitialized(true);
  }, []);

  // Save data when component unmounts (navigation away)
  useEffect(() => {
    return () => {
      // Save current state when component unmounts
      if (isInitialized && (result || formData.focus.band || selectedSDGs.length > 0)) {
        console.log('Saving suggestion state on component unmount');
        setStoredFormData(formData);
        setStoredSelectedSDGs(selectedSDGs);
        setStoredResult(result);
        setStoredSelectedEvents(Array.from(selectedEvents));
      }
    };
  }, [isInitialized, formData, selectedSDGs, result, selectedEvents]);

  // Persist state changes to store (after initialization)
  useEffect(() => {
    if (isInitialized) {
      setStoredFormData(formData);
      console.log('Form data saved to store:', formData);
    }
  }, [formData, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setStoredSelectedSDGs(selectedSDGs);
      console.log('Selected SDGs saved to store:', selectedSDGs);
    }
  }, [selectedSDGs, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setStoredResult(result);
      console.log('Result saved to store:', result ? 'Has result' : 'No result');
    }
  }, [result, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setStoredSelectedEvents(Array.from(selectedEvents));
      console.log('Selected events saved to store:', Array.from(selectedEvents));
    }
  }, [selectedEvents, isInitialized]);

  // Force save all data periodically and on navigation
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const saveAllData = () => {
      setStoredFormData(formData);
      setStoredSelectedSDGs(selectedSDGs);
      setStoredResult(result);
      setStoredSelectedEvents(Array.from(selectedEvents));
      console.log('All suggestion data force-saved to store');
    };

    // Save every 5 seconds if there's any data
    const interval = setInterval(() => {
      if (result || formData.focus.band || selectedSDGs.length > 0) {
        saveAllData();
      }
    }, 5000);

    // Save on page visibility change (user switching tabs)
    const handleVisibilityChange = () => {
      if (document.hidden && (result || formData.focus.band || selectedSDGs.length > 0)) {
        saveAllData();
      }
    };

    // Save on beforeunload (user navigating away)
    const handleBeforeUnload = () => {
      if (result || formData.focus.band || selectedSDGs.length > 0) {
        saveAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final save on cleanup
      saveAllData();
    };
  }, [isInitialized, formData, selectedSDGs, result, selectedEvents]);

  // Handler to clear suggestions and reset state
  const handleClearSuggestions = () => {
    setFormData({
      focus: {},
      targets: {},
      constraints: {},
    });
    setSelectedSDGs([]);
    setResult(null);
    setSelectedEvents(new Set());
    setError(null);
    clearSuggestions(); // Clear from persistent store
    toast.success('Suggestions cleared successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null); // Clear previous results
    setSelectedEvents(new Set()); // Clear previous selections
    
    try {
      const response = await fetch('/api/esg/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          focus: {
            ...formData.focus,
            sdgs: selectedSDGs.length > 0 ? selectedSDGs : formData.focus.sdgs,
          },
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResult(data.data);
        // Immediately save all data to store
        setStoredFormData(formData);
        setStoredSelectedSDGs(selectedSDGs);
        setStoredResult(data.data);
        setStoredSelectedEvents([]); // Clear selected events for new results
        console.log('Suggestion result saved to store:', {
          hasResult: !!data.data,
          formData: formData,
          selectedSDGs: selectedSDGs.length
        });
        toast.success('Suggestions generated successfully!');
      } else {
        setError(data.error || 'Failed to generate suggestions');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDrafts = async () => {
    if (!result || selectedEvents.size === 0) {
      toast.error('Please select at least one event to create drafts');
      return;
    }
    
    try {
      const selectedEventIds = Array.from(selectedEvents);
      const selectedEventsData = result.plan.filter(event => 
        selectedEventIds.includes(event.templateId)
      );
      
      const drafts = selectedEventsData.map(event => ({
        templateId: event.templateId,
        participants: event.participants,
        durationHours: event.durationHours,
        sdgs: event.sdgs,
        notes: `Generated by suggestion engine`,
      }));
      
      const response = await fetch('/api/esg/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          drafts,
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully created ${data.data.count} draft events! These events have been created and are now available in the Event page.`);
        setSelectedEvents(new Set());
        // Increment event notification count
        incrementCount(data.data.count);
      } else {
        toast.error('Failed to create draft events');
      }
    } catch (err) {
      toast.error('Error creating draft events');
    }
  };

  const handleAddToFavorites = async () => {
    if (!result || selectedEvents.size === 0) {
      toast.error('Please select at least one event to add to favorites');
      return;
    }
    
    try {
      const selectedEventIds = Array.from(selectedEvents);
      const selectedEventsData = result.plan.filter(event => 
        selectedEventIds.includes(event.templateId)
      );
      
      const response = await fetch('/api/esg/favorite-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          events: selectedEventsData,
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully added ${selectedEventsData.length} event(s) to favorites! These events have been saved and are now available in the Favorite Events component.`);
        setSelectedEvents(new Set());
        // Increment favorite notification count
        incrementFavoriteCount(selectedEventsData.length);
      } else {
        toast.error(data.error || 'Failed to add events to favorites');
      }
    } catch (err) {
      toast.error('Error adding events to favorites');
    }
  };

  const handleCreateSingleEvent = async (event: SuggestedEvent) => {
    try {
      const response = await fetch('/api/esg/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          drafts: [{
            templateId: event.templateId,
            participants: event.participants,
            durationHours: event.durationHours,
            sdgs: event.sdgs,
            notes: `Generated by suggestion engine`,
          }],
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully created event: ${event.name}. This event has been created and is now available in the Event page.`);
        // Increment event notification count
        incrementCount(1);
      } else {
        toast.error('Failed to create event');
      }
    } catch (err) {
      toast.error('Error creating event');
    }
  };

  const handleAddSingleToFavorites = async (event: SuggestedEvent) => {
    try {
      const response = await fetch('/api/esg/favorite-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          events: [event],
          organizationId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully added "${event.name}" to favorites! This event has been saved and is now available in the Favorite Events component.`);
        // Increment favorite notification count
        incrementFavoriteCount(1);
      } else {
        toast.error(data.error || 'Failed to add event to favorites');
      }
    } catch (err) {
      toast.error('Error adding event to favorites');
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Suggestion Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                  Event Planning Suggestion Engine
                </CardTitle>
                <CardDescription>
                  Get AI-powered recommendations for events that will help you meet your ESG targets
                </CardDescription>
              </div>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSuggestions}
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Suggestions</span>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Focus Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Focus Area</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="band">Primary Focus Band</Label>
                    <Select
                      value={formData.focus.band || ''}
                      onValueChange={(value) => {
                        const newFormData = {
                          ...formData,
                          focus: { ...formData.focus, band: value as any }
                        };
                        setFormData(newFormData);
                        
                        // Auto-select all SDGs for the selected band
                        const sdgs = getSDGOptions(value as any).map(s => s.value);
                        setSelectedSDGs(sdgs);
                        
                        // Don't clear results - let user decide when to generate new suggestions
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select focus band" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="E">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span>Environmental (E)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="S">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span>Social (S)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="G">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span>Governance (G)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="SEG_overall">Overall ESG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SDG Selection - Redesigned to show below Primary Focus Band */}
                  {formData.focus.band && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">
                          SDGs for {formData.focus.band === 'E' ? 'Environmental' : formData.focus.band === 'S' ? 'Social' : formData.focus.band === 'G' ? 'Governance' : 'All'} Focus
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const allSDGs = getSDGOptions(formData.focus.band).map(s => s.value);
                            setSelectedSDGs(selectedSDGs.length === allSDGs.length ? [] : allSDGs);
                            
                            // Don't clear results - let user decide when to generate new suggestions
                          }}
                          className="text-xs"
                        >
                          {selectedSDGs.length === getSDGOptions(formData.focus.band).length ? 'Deselect All' : 'Select All'}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getSDGOptions(formData.focus.band).map(sdg => {
                          const sdgNumber = parseInt(sdg.value.replace('SDG', ''));
                          const isSelected = selectedSDGs.includes(sdg.value);
                          const bandColor = formData.focus.band === 'E' ? 'green' : formData.focus.band === 'S' ? 'blue' : 'purple';
                          
                          return (
                            <div
                              key={sdg.value}
                              className={`group inline-flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                                isSelected 
                                  ? 'text-white shadow-md' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                              style={isSelected ? { backgroundColor: getSDGColor(sdgNumber) } : {}}
                              onClick={() => {
                                setSelectedSDGs(isSelected 
                                  ? selectedSDGs.filter(s => s !== sdg.value)
                                  : [...selectedSDGs, sdg.value]
                                );
                                
                                // Don't clear results - let user decide when to generate new suggestions
                              }}
                            >
                              <div 
                                className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white bg-opacity-40' : 'bg-gray-400'}`}
                              />
                              <span>{sdg.label}</span>
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSDGs(selectedSDGs.filter(s => s !== sdg.value));
                                    
                                    // Don't clear results - let user decide when to generate new suggestions
                                  }}
                                  className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5 transition-colors duration-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {/* Targets Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="hours">Target Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    placeholder="e.g., 500"
                    value={formData.targets.hours || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        targets: { ...prev.targets, hours: e.target.value ? Number(e.target.value) : undefined }
                      }));
                      // Don't clear results on input change - let user decide when to generate new suggestions
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="participants">Target Participants</Label>
                  <Input
                    id="participants"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.targets.participants || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        targets: { ...prev.targets, participants: e.target.value ? Number(e.target.value) : undefined }
                      }));
                      // Don't clear results on input change
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="scoreDelta">Score Delta</Label>
                  <Input
                    id="scoreDelta"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.targets.orgScoreDelta || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        targets: { ...prev.targets, orgScoreDelta: e.target.value ? Number(e.target.value) : undefined }
                      }));
                      // Don't clear results on input change
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Constraints Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Constraints</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.constraints?.budget || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, budget: e.target.value ? Number(e.target.value) : undefined }
                      }));
                      // Don't clear results on input change
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="maxEvents">Max Events</Label>
                  <Input
                    id="maxEvents"
                    type="number"
                    placeholder="e.g., 5"
                    value={formData.constraints?.maxEvents || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        constraints: { ...prev.constraints, maxEvents: e.target.value ? Number(e.target.value) : undefined }
                      }));
                      // Don't clear results on input change
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select 
                    value={formData.constraints?.riskAllowed?.join(',') || ''} 
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        constraints: { 
                          ...prev.constraints, 
                          riskAllowed: value ? value.split(',') as any : undefined 
                        }
                      }));
                      // Don't clear results on input change
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk Only</SelectItem>
                      <SelectItem value="low,medium">Low & Medium</SelectItem>
                      <SelectItem value="low,medium,high">All Risk Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Generating Suggestions...' : 'Generate Suggestions'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Restoration Info Message */}
          {storedResult && storedOrgId === organizationId && timestamp && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">
                    Previous suggestions restored from {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-green-600" />
                Suggestion Summary
              </CardTitle>
              <CardDescription>
                Overall impact prediction from suggested events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Score Calculation Formula */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start space-x-2">
                  <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Score Calculation Formula</h4>
                    <div className="space-y-2">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Overall Δ = (ΔE + ΔH + ΔQ + ΔV + ΔS + ΔC) × G<sub>new</sub> × 100</strong>
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800/30 p-2 rounded">
                        <strong>Where:</strong><br/>
                        • G<sub>new</sub> = G<sub>current</sub> + ΔG<br/>
                        • ΔG = {result.predictedDelta.G.toFixed(3)} (governance improvements from suggested events)<br/>
                        • Each event contributes ΔG through policy and transparency enhancements<br/>
                        • <strong>Note:</strong> If G<sub>current</sub> = 0, the formula becomes (components) × ΔG × 100
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Hover over attributes below to learn more about each impact dimension.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.totals.hours}</div>
                  <div className="text-sm text-gray-600">Total Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.totals.participants}</div>
                  <div className="text-sm text-gray-600">Participants</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">${result.totals.cost}</div>
                  <div className="text-sm text-gray-600">Total Cost</div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-center cursor-help">
                      <div className="text-2xl font-bold text-orange-600">{result.predictedDelta.overall.toFixed(1)}</div>
                      <div className="text-sm text-gray-600 flex items-center justify-center">
                        Overall Δ
                        <HelpCircle className="w-3 h-3 ml-1" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{ESG_ATTRIBUTES.overall.description}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Impact Attributes with Tooltips */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Impact Attributes:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {Object.entries(result.predictedDelta).filter(([key]) => key !== 'overall').map(([key, value]) => (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-help hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Δ{key}</span>
                            <HelpCircle className="w-3 h-3 text-gray-400" />
                          </div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {typeof value === 'number' ? value.toFixed(2) : value}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-1">{ESG_ATTRIBUTES[key as keyof typeof ESG_ATTRIBUTES]?.name}</p>
                        <p className="text-xs">{ESG_ATTRIBUTES[key as keyof typeof ESG_ATTRIBUTES]?.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* SDGs Covered */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">SDGs Covered:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.sdgsCovered.map(sdg => {
                    const sdgNumber = parseInt(sdg.replace('SDG', ''));
                    return (
                      <Badge 
                        key={sdg} 
                        variant="secondary"
                        className="text-white"
                        style={{ backgroundColor: getSDGColor(sdgNumber) }}
                      >
                        {sdg}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Target Achievement */}
              <div className="space-y-2">
                <h4 className="font-semibold">Target Achievement:</h4>
                <div className="flex items-center space-x-2">
                  {result.meets.hours !== undefined && (
                    <div className="flex items-center space-x-1">
                      {result.meets.hours ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm">Hours Target</span>
                    </div>
                  )}
                  {result.meets.participants !== undefined && (
                    <div className="flex items-center space-x-1">
                      {result.meets.participants ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm">Participants Target</span>
                    </div>
                  )}
                  {result.meets.orgScoreDelta !== undefined && (
                    <div className="flex items-center space-x-1">
                      {result.meets.orgScoreDelta ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm">Score Delta Target</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">Warnings:</h4>
                  <ul className="space-y-1">
                    {result.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button 
                  onClick={handleCreateDrafts}
                  disabled={selectedEvents.size === 0}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Draft Events ({selectedEvents.size} selected)
                </Button>
                <Button 
                  onClick={handleAddToFavorites}
                  disabled={selectedEvents.size === 0}
                  variant="outline"
                  className="border-pink-300 text-pink-700 hover:bg-pink-50 disabled:opacity-50"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Add as Favorite Events ({selectedEvents.size} selected)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suggested Events */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Suggested Events</h3>
            {result.plan.map((event, index) => (
              <EventCard 
                key={index} 
                event={event} 
                isSelected={selectedEvents.has(event.templateId)}
                onToggle={(templateId) => {
                  const newSelected = new Set(selectedEvents);
                  if (newSelected.has(templateId)) {
                    newSelected.delete(templateId);
                  } else {
                    newSelected.add(templateId);
                  }
                  setSelectedEvents(newSelected);
                }}
                onCreateEvent={() => handleCreateSingleEvent(event)}
                onAddToFavorite={() => handleAddSingleToFavorites(event)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
}

function EventCard({ 
  event, 
  isSelected, 
  onToggle,
  onCreateEvent,
  onAddToFavorite
}: { 
  event: SuggestedEvent; 
  isSelected: boolean;
  onToggle: (templateId: string) => void;
  onCreateEvent: () => void;
  onAddToFavorite: () => void;
}) {
  const esgBand = getEventESGBand(event.sdgs);
  
  return (
    <Card className={isSelected ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(event.templateId)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <h4 className="font-semibold text-lg">{event.name}</h4>
              {/* ESG Band Badge */}
              {esgBand && (
                <Badge className={`${getESGBandColor(esgBand)} border`}>
                  {getESGBandLabel(esgBand)}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {getEventDescription(event.name)}
            </p>
            <div className="flex flex-wrap gap-2">
              {event.sdgs.map(sdg => {
                const sdgNumber = parseInt(sdg.replace('SDG', ''));
                return (
                  <Badge 
                    key={sdg} 
                    variant="outline" 
                    className="text-white border-0"
                    style={{ backgroundColor: getSDGColor(sdgNumber) }}
                  >
                    {sdg}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-blue-600">{event.participants}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">participants</div>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-base font-semibold text-gray-700 dark:text-gray-300">{event.durationHours}h</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-help">
                <div className="text-base font-semibold text-green-600">{event.predictedDelta.E.toFixed(2)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  ΔE <HelpCircle className="w-2.5 h-2.5 ml-0.5" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{ESG_ATTRIBUTES.E.name}</p>
              <p className="text-xs">{ESG_ATTRIBUTES.E.description}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-help">
                <div className="text-base font-semibold text-blue-600">{event.predictedDelta.H.toFixed(2)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  ΔH <HelpCircle className="w-2.5 h-2.5 ml-0.5" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{ESG_ATTRIBUTES.H.name}</p>
              <p className="text-xs">{ESG_ATTRIBUTES.H.description}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-help">
                <div className="text-base font-semibold text-purple-600">{event.predictedDelta.S.toFixed(2)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  ΔS <HelpCircle className="w-2.5 h-2.5 ml-0.5" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{ESG_ATTRIBUTES.S.name}</p>
              <p className="text-xs">{ESG_ATTRIBUTES.S.description}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-help">
                <div className="text-base font-semibold text-indigo-600">{event.predictedDelta.G.toFixed(2)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  ΔG <HelpCircle className="w-2.5 h-2.5 ml-0.5" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{ESG_ATTRIBUTES.G.name}</p>
              <p className="text-xs">{ESG_ATTRIBUTES.G.description}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-help border border-orange-200 dark:border-orange-800">
                <div className="text-base font-semibold text-orange-600">{event.predictedDelta.overall.toFixed(1)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center">
                  Overall Δ <HelpCircle className="w-2.5 h-2.5 ml-0.5" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{ESG_ATTRIBUTES.overall.name}</p>
              <p className="text-xs">{ESG_ATTRIBUTES.overall.description}</p>
            </TooltipContent>
          </Tooltip>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-base font-semibold text-gray-700 dark:text-gray-300">${(event.participants * 25).toFixed(0)}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Est. Cost</div>
          </div>
        </div>

        {/* Individual Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={onCreateEvent}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <FileText className="w-3 h-3 mr-1" />
            Create Event
          </Button>
          <Button
            onClick={onAddToFavorite}
            size="sm"
            variant="outline"
            className="border-pink-300 text-pink-700 hover:bg-pink-50"
          >
            <Heart className="w-3 h-3 mr-1" />
            Add as Favorite
          </Button>
        </div>

        {event.warnings && event.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Warnings:</div>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  {event.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getEventDescription(eventName: string): string {
  const descriptions: Record<string, string> = {
    'Community Wellness Day': 'A comprehensive health and wellness event focusing on physical and mental health awareness',
    'Skills for Schools Mentoring': 'Educational mentoring program connecting professionals with students',
    'Beach Cleanup Initiative': 'Environmental conservation event focusing on marine ecosystem protection',
    'Policy & Ethics Training': 'Corporate governance and ethical decision-making workshop',
    'Digital Literacy Workshop': 'Technology skills training for underserved communities',
    'Sustainable Agriculture Workshop': 'Training on sustainable farming practices and food security',
    'Mental Health Awareness Campaign': 'Community mental health support and awareness program',
    'Renewable Energy Education': 'Workshop on clean energy solutions and climate action',
  };
  
  return descriptions[eventName] || 'A community event focused on positive impact';
}
