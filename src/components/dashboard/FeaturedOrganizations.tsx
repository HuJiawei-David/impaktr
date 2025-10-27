'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2,
  Users,
  Star
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  members: string;
  focus: string;
  description?: string;
  isFollowing?: boolean;
  logo?: string;
  impactScore?: number;
  location?: string;
  followerCount?: number;
}

interface FeaturedOrganizationsProps {
  organizations?: Organization[];
}

export function FeaturedOrganizations({ organizations }: FeaturedOrganizationsProps) {
  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [loading, setLoading] = React.useState(true);

  const handleFollowToggle = async (orgId: string) => {
    // Find the current organization to determine action
    const currentOrg = orgs.find(org => org.id === orgId);
    const isCurrentlyFollowing = currentOrg?.isFollowing || false;
    const newFollowStatus = !isCurrentlyFollowing;

    try {
      // Toggle follow status locally first for immediate UI feedback
      setOrgs(prevOrgs => 
        prevOrgs.map(org => 
          org.id === orgId 
            ? { ...org, isFollowing: newFollowStatus }
            : org
        )
      );

      // Make API call to toggle follow status
      const response = await fetch(`/api/organizations/${orgId}/toggle-follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Log the error details for debugging
        const errorText = await response.text();
        console.error(`API Error (${response.status}):`, errorText);
        
        // Revert the change if API call failed
        setOrgs(prevOrgs => 
          prevOrgs.map(org => 
            org.id === orgId 
              ? { ...org, isFollowing: isCurrentlyFollowing }
              : org
          )
        );
        throw new Error(`Failed to toggle follow status: ${response.status} ${errorText}`);
      }

      // Get the actual follow status from the response
      const data = await response.json();
      const actualFollowStatus = data.isFollowing;
      
      // Update UI with the actual status from the server
      setOrgs(prevOrgs => 
        prevOrgs.map(org => 
          org.id === orgId 
            ? { ...org, isFollowing: actualFollowStatus }
            : org
        )
      );

      // Show success message (optional)
      console.log(`Successfully ${actualFollowStatus ? 'followed' : 'unfollowed'} organization`);
      
    } catch (error) {
      console.error('Error toggling follow status:', error);
      // Revert the change if API call failed
      setOrgs(prevOrgs => 
        prevOrgs.map(org => 
          org.id === orgId 
            ? { ...org, isFollowing: isCurrentlyFollowing }
            : org
        )
      );
      // Optionally show a toast notification here
      alert(`Failed to ${newFollowStatus ? 'follow' : 'unfollow'} organization. Please try again.`);
    }
  };

  React.useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations/featured?limit=4');
        if (response.ok) {
          const data = await response.json();
          setOrgs(data.organizations || []);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!organizations) {
      fetchOrganizations();
    } else {
      setOrgs(organizations);
      setLoading(false);
    }
  }, [organizations]);

  // Refresh data when component becomes visible (e.g., when navigating back from org page)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !organizations) {
        // Only refresh if we're fetching data ourselves (not using passed organizations)
        fetch('/api/organizations/featured?limit=4')
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data) {
              setOrgs(data.organizations || []);
            }
          })
          .catch(error => console.error('Error refreshing organizations:', error));
      }
    };

    const handleFocus = () => {
      if (!organizations) {
        // Only refresh if we're fetching data ourselves
        fetch('/api/organizations/featured?limit=4')
          .then(response => response.ok ? response.json() : null)
          .then(data => {
            if (data) {
              setOrgs(data.organizations || []);
            }
          })
          .catch(error => console.error('Error refreshing organizations:', error));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [organizations]);

  const displayOrgs = orgs;

  const getFocusColor = (focus: string) => {
    switch (focus.toLowerCase()) {
      case 'environment':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'children':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'healthcare':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'education':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white">Featured Organizations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Loading...
          </div>
        ) : displayOrgs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No organizations found
          </div>
        ) : (
          displayOrgs.map((org) => (
            <div key={org.id} className="p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all">
              <div className="flex items-start space-x-3">
                {/* Organization Avatar */}
                <Link href={`/organizations/${org.id}`} className="flex-shrink-0">
                  <Avatar className="w-12 h-12">
                    {org.logo ? (
                      <AvatarImage src={org.logo} alt={org.name} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                        {org.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'O'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>
                
                {/* Organization Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/organizations/${org.id}`}>
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {org.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-2">
                    {org.focus}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {org.followerCount || 0}
                    </span>
                    {org.impactScore && (
                      <span className="flex items-center font-medium text-blue-600 dark:text-blue-400">
                        <Star className="w-3 h-3 mr-1" />
                        {org.impactScore.toLocaleString()}
                      </span>
                    )}
                  </div>
                  
                  {/* Follow Button */}
                  <Button
                    variant={org.isFollowing ? "outline" : "default"}
                    size="sm"
                    className={`text-xs px-3 py-1 ${
                      org.isFollowing 
                        ? "border-green-500 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20" 
                        : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                    }`}
                    onClick={() => handleFollowToggle(org.id)}
                  >
                    {org.isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
        
        <div className="pt-2">
          <Link href="/leaderboards?type=organizations">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
            >
              Discover More
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
