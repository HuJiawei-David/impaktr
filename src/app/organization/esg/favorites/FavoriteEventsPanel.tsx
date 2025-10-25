'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Trash2, 
  Plus,
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getSDGColor } from '@/lib/utils';
import { useEventNotificationStore } from '@/store/eventNotificationStore';
import { useConfirmDialog } from '@/components/ui/simple-confirm-dialog';

// ESG Attribute explanations (same as in SuggestionPanel)
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

// Helper functions (same as in SuggestionPanel)
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

interface FavoriteEvent {
  id: string;
  userId: string;
  organizationId: string;
  templateId: string;
  eventName: string;
  participants: number;
  durationHours: number;
  sdgs: string[];
  predictedDelta: {
    E: number;
    H: number;
    Q: number;
    V: number;
    S: number;
    C: number;
    G: number;
    overall: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FavoriteEventsPanelProps {
  organizationId: string;
}

export default function FavoriteEventsPanel({ organizationId }: FavoriteEventsPanelProps) {
  const [favoriteEvents, setFavoriteEvents] = useState<FavoriteEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  
  // Event notification store
  const { incrementCount } = useEventNotificationStore();
  
  // Confirm dialog
  const { showConfirm, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    fetchFavoriteEvents();
  }, [organizationId]);

  const fetchFavoriteEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/esg/favorite-events?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.success) {
        setFavoriteEvents(data.data);
      } else {
        setError(data.error || 'Failed to fetch favorite events');
      }
    } catch (err) {
      setError('Error fetching favorite events');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (eventId: string, eventName: string) => {
    showConfirm({
      title: 'Remove from Favorites',
      message: `Are you sure you want to remove "${eventName}" from your favorites? You can always add it back later.`,
      confirmText: 'Remove',
      cancelText: 'Keep it',
      type: 'remove',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/esg/favorite-events?id=${eventId}`, {
            method: 'DELETE',
          });
          
          const data = await response.json();
          
          if (data.success) {
            // Remove from local state
            setFavoriteEvents(favoriteEvents.filter(e => e.id !== eventId));
            setSelectedEvents(prev => {
              const newSet = new Set(prev);
              newSet.delete(eventId);
              return newSet;
            });
            toast.success('Event removed from favorites');
          } else {
            throw new Error(data.message || 'Failed to remove from favorites');
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to remove from favorites');
        }
      }
    });
  };


  const handleCreateDrafts = async () => {
    if (selectedEvents.size === 0) {
      toast.error('Please select at least one event to create drafts');
      return;
    }

    try {
      const selectedEventsData = favoriteEvents.filter(event => 
        selectedEvents.has(event.id)
      );
      
      const drafts = selectedEventsData.map(event => ({
        templateId: event.templateId,
        participants: event.participants,
        durationHours: event.durationHours,
        sdgs: event.sdgs,
        notes: event.notes || `From favorite events`,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading favorite events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error:</span>
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-600" />
              Favorite Events
            </CardTitle>
            <CardDescription>
              Your saved event suggestions for quick access and planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            {favoriteEvents.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No favorite events selected yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Go to the Suggestion tab to add events to your favorites
                </p>
              </div>
            ) : (
              <>
                {selectedEvents.size > 0 && (
                  <div className="mb-6 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedEvents.size === favoriteEvents.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents(new Set(favoriteEvents.map(ev => ev.id)));
                          } else {
                            setSelectedEvents(new Set());
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {selectedEvents.size} event{selectedEvents.size > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <Button
                      onClick={handleCreateDrafts}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Draft Events
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {favoriteEvents.map((event) => (
                    <FavoriteEventCard
                      key={event.id}
                      event={event}
                      isSelected={selectedEvents.has(event.id)}
                      onToggle={(eventId) => {
                        const newSelected = new Set(selectedEvents);
                        if (newSelected.has(eventId)) {
                          newSelected.delete(eventId);
                        } else {
                          newSelected.add(eventId);
                        }
                        setSelectedEvents(newSelected);
                      }}
                      onRemove={() => handleRemoveFavorite(event.id, event.eventName)}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog />
    </TooltipProvider>
  );
}

function FavoriteEventCard({
  event,
  isSelected,
  onToggle,
  onRemove,
}: {
  event: FavoriteEvent;
  isSelected: boolean;
  onToggle: (eventId: string) => void;
  onRemove: () => void;
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
                onChange={() => onToggle(event.id)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <h4 className="font-semibold text-lg">{event.eventName}</h4>
              {esgBand && (
                <Badge className={`${getESGBandColor(esgBand)} border`}>
                  {getESGBandLabel(esgBand)}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
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
            {event.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Note: {event.notes}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Added {new Date(event.createdAt).toLocaleDateString()}
            </p>
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

        <div className="flex items-center justify-end">
          <Button
            onClick={onRemove}
            size="sm"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Remove from Favorites
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

