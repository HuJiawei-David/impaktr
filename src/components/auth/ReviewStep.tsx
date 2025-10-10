'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, User, Mail, MapPin, Globe, Calendar } from 'lucide-react';

interface BasicInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  country?: string;
  languages?: string[];
  bio?: string;
}

interface Preferences {
  isPublic?: boolean;
  showEmail?: boolean;
  notifications?: {
    email?: boolean;
    push?: boolean;
    marketing?: boolean;
  };
}

interface FormData {
  basicInfo?: BasicInfo;
  preferences?: Preferences;
}

interface ReviewStepProps {
  formData?: FormData;
}

export default function ReviewStep({ formData }: ReviewStepProps) {
  const basicInfo = formData?.basicInfo || {};
  const preferences = formData?.preferences || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Your Information</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please review your details before completing your profile setup
        </p>
      </div>

      {/* Basic Information Review */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {basicInfo.firstName && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</label>
                <p className="text-gray-900 dark:text-white">{basicInfo.firstName}</p>
              </div>
            )}
            
            {basicInfo.lastName && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Name</label>
                <p className="text-gray-900 dark:text-white">{basicInfo.lastName}</p>
              </div>
            )}
            
            {basicInfo.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{basicInfo.email}</p>
                </div>
              </div>
            )}
            
            {basicInfo.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                  <p className="text-gray-900 dark:text-white">{basicInfo.dateOfBirth}</p>
                </div>
              </div>
            )}
            
            {basicInfo.gender && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                <p className="text-gray-900 dark:text-white">{basicInfo.gender}</p>
              </div>
            )}
            
            {basicInfo.nationality && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nationality</label>
                  <p className="text-gray-900 dark:text-white">{basicInfo.nationality}</p>
                </div>
              </div>
            )}
            
            {basicInfo.country && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Country</label>
                  <p className="text-gray-900 dark:text-white">{basicInfo.country}</p>
                </div>
              </div>
            )}
          </div>
          
          {basicInfo.languages && basicInfo.languages.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Languages</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {basicInfo.languages.map((lang: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {basicInfo.bio && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</label>
              <p className="text-gray-900 dark:text-white mt-1">{basicInfo.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Preferences Review */}
      <Card className="bg-white dark:bg-gray-800 shadow-lg dark:shadow-xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Privacy & Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Profile Visibility</label>
              <p className="text-gray-900 dark:text-white">
                {preferences.isPublic ? 'Public' : 'Private'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Visibility</label>
              <p className="text-gray-900 dark:text-white">
                {preferences.showEmail ? 'Visible' : 'Hidden'}
              </p>
            </div>
          </div>
          
          {preferences.notifications && (
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notifications</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {preferences.notifications.email && (
                  <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                    Email ✓
                  </Badge>
                )}
                {preferences.notifications.push && (
                  <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                    Push ✓
                  </Badge>
                )}
                {preferences.notifications.marketing && (
                  <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                    Marketing ✓
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Message */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Ready to Complete Your Profile!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Click &quot;Complete Setup&quot; to finish creating your impaktr profile and start making an impact.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



