// home/ubuntu/impaktrweb/src/app/settings/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard,
  Key,
  Globe,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';

interface UserSettings {
  // Profile Settings
  displayName: string;
  email: string;
  bio: string;
  website: string;
  isPublic: boolean;
  showEmail: boolean;
  
  // Notification Settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  badgeNotifications: boolean;
  eventReminders: boolean;
  verificationRequests: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  
  // Privacy Settings
  profileVisibility: 'public' | 'friends' | 'private';
  showProgress: boolean;
  showLocation: boolean;
  allowRecommendations: boolean;
  allowMessaging: boolean;
  
  // Security Settings
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  
  // Subscription Settings
  subscriptionPlan: string;
  billingEmail: string;
  autoRenew: boolean;
  
  // Data Settings
  downloadData: boolean;
  deleteAccount: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
      return;
    }

    if (session) {
      fetchSettings();
    }
  }, [session, status]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/users/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        toast.success('Settings updated successfully');
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      const response = await fetch('/api/users/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Account deletion initiated');
        // Redirect to sign out
        window.location.href = '/api/auth/signout';
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const downloadUserData = async () => {
    try {
      const response = await fetch('/api/users/download-data');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `impaktr-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Data download started');
      }
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error('Failed to download data');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and privacy settings
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Data
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={settings.displayName}
                        onChange={(e) => setSettings({...settings, displayName: e.target.value})}
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={settings.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact support to change your email address
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      value={settings.bio}
                      onChange={(e) => setSettings({...settings, bio: e.target.value})}
                      placeholder="Tell others about yourself..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={settings.website}
                      onChange={(e) => setSettings({...settings, website: e.target.value})}
                      placeholder="https://your-website.com"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Public Profile</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow others to find and view your profile
                      </p>
                    </div>
                    <Switch
                      checked={settings.isPublic}
                      onCheckedChange={(checked) => setSettings({...settings, isPublic: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Email Address</Label>
                      <p className="text-sm text-muted-foreground">
                        Display your email on your public profile
                      </p>
                    </div>
                    <Switch
                      checked={settings.showEmail}
                      onCheckedChange={(checked) => setSettings({...settings, showEmail: checked})}
                    />
                  </div>

                  <Button onClick={() => updateSettings(settings)} disabled={isSaving}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>

              {/* Appearance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            Light
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center gap-2">
                            <Moon className="w-4 h-4" />
                            Dark
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            System
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    key: 'emailNotifications',
                    title: 'Email Notifications',
                    description: 'Receive notifications via email',
                    icon: <Mail className="w-4 h-4" />
                  },
                  {
                    key: 'pushNotifications',
                    title: 'Push Notifications',
                    description: 'Receive push notifications on your device',
                    icon: <Smartphone className="w-4 h-4" />
                  },
                  {
                    key: 'badgeNotifications',
                    title: 'Badge & Achievement Alerts',
                    description: 'Get notified when you earn new badges',
                    icon: <Badge className="w-4 h-4" />
                  },
                  {
                    key: 'eventReminders',
                    title: 'Event Reminders',
                    description: 'Reminders for upcoming events you\'ve joined',
                    icon: <Bell className="w-4 h-4" />
                  },
                  {
                    key: 'verificationRequests',
                    title: 'Verification Requests',
                    description: 'When others need your verification for their activities',
                    icon: <Shield className="w-4 h-4" />
                  },
                  {
                    key: 'weeklyDigest',
                    title: 'Weekly Digest',
                    description: 'Weekly summary of your impact and new opportunities',
                    icon: <Mail className="w-4 h-4" />
                  },
                  {
                    key: 'marketingEmails',
                    title: 'Marketing Emails',
                    description: 'Product updates and promotional content',
                    icon: <Globe className="w-4 h-4" />
                  }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-muted rounded-md">
                        {item.icon}
                      </div>
                      <div>
                        <Label className="text-base">{item.title}</Label>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[item.key as keyof UserSettings] as boolean}
                      onCheckedChange={(checked) => {
                        const updated = { ...settings, [item.key]: checked };
                        setSettings(updated);
                        updateSettings({ [item.key]: checked });
                      }}
                    />
                  </div>
                ))}

                <Separator />

                <div className="pt-4">
                  <h4 className="font-medium mb-4">Notification Frequency</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email frequency</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Profile Visibility
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Who can see your profile?</Label>
                    <Select 
                      value={settings.profileVisibility} 
                      onValueChange={(value) => {
                        const updated = { ...settings, profileVisibility: value as 'public' | 'friends' | 'private' };
                        setSettings(updated);
                        updateSettings({ profileVisibility: value as 'public' | 'friends' | 'private' });
                      }}
                    >
                      <SelectTrigger className="w-48 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public - Anyone can see</SelectItem>
                        <SelectItem value="friends">Friends only</SelectItem>
                        <SelectItem value="private">Private - Only you</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {[
                    {
                      key: 'showProgress',
                      title: 'Show Impact Progress',
                      description: 'Display your impact score and achievements publicly'
                    },
                    {
                      key: 'showLocation',
                      title: 'Show Location',
                      description: 'Display your city and country on your profile'
                    },
                    {
                      key: 'allowRecommendations',
                      title: 'Smart Recommendations',
                      description: 'Allow us to suggest events and opportunities based on your interests'
                    },
                    {
                      key: 'allowMessaging',
                      title: 'Allow Messages',
                      description: 'Let other users send you direct messages'
                    }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <Label className="text-base">{item.title}</Label>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch
                        checked={settings[item.key as keyof UserSettings] as boolean}
                        onCheckedChange={(checked) => {
                          const updated = { ...settings, [item.key]: checked };
                          setSettings(updated);
                          updateSettings({ [item.key]: checked });
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Account Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {settings.twoFactorEnabled && (
                        <Badge variant="secondary" className="text-green-600">Enabled</Badge>
                      )}
                      <Button variant="outline" size="sm">
                        {settings.twoFactorEnabled ? 'Manage' : 'Enable'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new logins to your account
                      </p>
                    </div>
                    <Switch
                      checked={settings.loginAlerts}
                      onCheckedChange={(checked) => {
                        const updated = { ...settings, loginAlerts: checked };
                        setSettings(updated);
                        updateSettings({ loginAlerts: checked });
                      }}
                    />
                  </div>

                  <div>
                    <Label>Session Timeout</Label>
                    <Select 
                      value={settings.sessionTimeout.toString()} 
                      onValueChange={(value) => {
                        const updated = { ...settings, sessionTimeout: parseInt(value) };
                        setSettings(updated);
                        updateSettings({ sessionTimeout: parseInt(value) });
                      }}
                    >
                      <SelectTrigger className="w-48 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="720">12 hours</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Manage Connected Devices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Subscription & Billing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">{settings.subscriptionPlan || 'Free Tier'}</p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>

                  <div>
                    <Label htmlFor="billingEmail">Billing Email</Label>
                    <Input
                      id="billingEmail"
                      type="email"
                      value={settings.billingEmail}
                      onChange={(e) => setSettings({...settings, billingEmail: e.target.value})}
                      placeholder="billing@example.com"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Auto-renewal</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically renew your subscription
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoRenew}
                      onCheckedChange={(checked) => {
                        const updated = { ...settings, autoRenew: checked };
                        setSettings(updated);
                        updateSettings({ autoRenew: checked });
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Payment Methods
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      View Billing History
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Upgrade Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Tab */}
          <TabsContent value="data">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Export Your Data
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                      Download a copy of all your data including profile information, activity history, and achievements.
                    </p>
                    <Button onClick={downloadUserData} variant="outline" size="sm">
                      Download Data
                    </Button>
                  </div>

                  <Separator />

                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-800 dark:text-red-200 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    
                    {!showDeleteConfirm ? (
                      <Button 
                        onClick={() => setShowDeleteConfirm(true)} 
                        variant="destructive" 
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                            Type <code className="bg-muted px-1 rounded">DELETE</code> to confirm:
                          </Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleDeleteAccount}
                            variant="destructive" 
                            size="sm"
                            disabled={deleteConfirmText !== 'DELETE'}
                          >
                            Confirm Delete
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText('');
                            }}
                            variant="outline" 
                            size="sm"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}