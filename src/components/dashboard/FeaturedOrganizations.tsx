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
}

interface FeaturedOrganizationsProps {
  organizations?: Organization[];
}

export function FeaturedOrganizations({ organizations }: FeaturedOrganizationsProps) {
  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [loading, setLoading] = React.useState(true);

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
          <Link key={org.id} href={`/organizations/${org.id}`} className="block">
            <div className="p-4 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {org.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${getFocusColor(org.focus)}`}>
                  {org.focus}
                </span>
              </div>
              
              {org.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {org.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {org.members}
                  </span>
                  {org.impactScore && (
                    <span className="flex items-center font-medium text-blue-600 dark:text-blue-400">
                      <Star className="w-3 h-3 mr-1" />
                      {org.impactScore.toLocaleString()}
                    </span>
                  )}
                </div>
                {org.isFollowing && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Following
                  </span>
                )}
              </div>
            </div>
          </Link>
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
