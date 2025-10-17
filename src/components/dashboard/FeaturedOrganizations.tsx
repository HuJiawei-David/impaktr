'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2,
  Users,
  Eye,
  UserPlus
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  members: string;
  focus: string;
  description?: string;
  isFollowing?: boolean;
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
        const response = await fetch('/api/organizations/dashboard?featured=true&limit=4');
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
          <Link key={org.id} href={`/organizations/${org.id}`}>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-transparent hover:shadow-md cursor-pointer group transition-all">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {org.name.split(' ').map(word => word[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {org.name}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getFocusColor(org.focus)}`}>
                  {org.focus}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {org.members} members
                </span>
              </div>
            </div>
            <div className="flex space-x-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <Eye className="w-3 h-3" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`h-6 w-6 p-0 ${
                  org.isFollowing 
                    ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900' 
                    : 'hover:bg-blue-100 dark:hover:bg-blue-900'
                }`}
              >
                <UserPlus className={`w-3 h-3 ${org.isFollowing ? 'fill-current' : ''}`} />
              </Button>
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
