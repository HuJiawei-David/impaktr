'use client';

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface PreferencesData {
  isPublic?: boolean;
  showEmail?: boolean;
  notifications?: {
    email?: boolean;
    push?: boolean;
    marketing?: boolean;
  };
}

interface PreferencesStepProps {
  onDataChange?: (data: PreferencesData) => void;
}

export default function PreferencesStep({ onDataChange }: PreferencesStepProps) {
  const { register, watch, setValue, handleSubmit } = useForm<PreferencesData>({
    defaultValues: {
      isPublic: true,
      showEmail: false,
      notifications: {
        email: true,
        push: true,
        marketing: false,
      },
    },
  });

  // Watch form data and update parent component in real-time
  const watchedData = watch();
  
  useEffect(() => {
    if (onDataChange) {
      onDataChange(watchedData);
    }
  }, [watchedData, onDataChange]);

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Privacy Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Profile</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow others to find and view your profile
              </p>
            </div>
            <input
              type="checkbox"
              {...register('isPublic')}
              className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Email Address</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Display your email on your public profile
              </p>
            </div>
            <input
              type="checkbox"
              {...register('showEmail')}
              className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive important updates via email
              </p>
            </div>
            <input
              type="checkbox"
              {...register('notifications.email')}
              className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get notified about events and activities
              </p>
            </div>
            <input
              type="checkbox"
              {...register('notifications.push')}
              className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Marketing Communications</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive updates about new features and events
              </p>
            </div>
            <input
              type="checkbox"
              {...register('notifications.marketing')}
              className="w-5 h-5 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



