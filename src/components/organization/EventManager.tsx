// home/ubuntu/impaktrweb/src/components/organization/EventManager.tsx

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Users, Plus, Clock } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  startDate: string;
  currentParticipants: number;
}

interface EventManagerProps {
  events: Event[];
  organizationId: string;
}

export default function EventManager({ events, organizationId }: EventManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'cleanup',
    sdg: '',
    location: '',
    startDate: '',
    endDate: '',
    maxParticipants: '',
  });

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/organizations/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'cleanup',
        sdg: '',
        location: '',
        startDate: '',
        endDate: '',
        maxParticipants: '',
      });
      setShowCreateDialog(false);

      alert('Event created successfully!');
    } catch (error) {
      console.error('Create event error:', error);
      alert('Failed to create event. Please try again.');
    }
  };

  const sdgOptions = [
    { value: '13', label: 'SDG 13: Climate Action' },
    { value: '8', label: 'SDG 8: Decent Work' },
    { value: '11', label: 'SDG 11: Sustainable Cities' },
    { value: '12', label: 'SDG 12: Responsible Consumption' },
    { value: '17', label: 'SDG 17: Partnerships' },
  ];

  const eventTypes = [
    { value: 'cleanup', label: 'Community Cleanup' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'fundraiser', label: 'Fundraiser' },
    { value: 'volunteer', label: 'Volunteer Day' },
    { value: 'training', label: 'Training Session' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Corporate Events</CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Corporate Event</DialogTitle>
                <DialogDescription>
                  Organize an impact event for your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      placeholder="Team Beach Cleanup"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Join us for a meaningful day of environmental action..."
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Event Type</Label>
                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sdg">SDG Goal</Label>
                    <Select value={formData.sdg} onValueChange={(value) => setFormData({ ...formData, sdg: value })}>
                      <SelectTrigger id="sdg">
                        <SelectValue placeholder="Select SDG" />
                      </SelectTrigger>
                      <SelectContent>
                        {sdgOptions.map(sdg => (
                          <SelectItem key={sdg.value} value={sdg.value}>
                            {sdg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Santa Monica Beach, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="maxParticipants">Max Participants (Optional)</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      placeholder="50"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!formData.title || !formData.startDate}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No upcoming events</p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
            >
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(event.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{event.currentParticipants} participants</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}