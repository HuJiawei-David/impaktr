'use client';

import React from 'react';
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
  // Mock data - in real app, this would come from props or API
  const mockOrganizations: Organization[] = [
    { 
      id: '1', 
      name: "WWF Malaysia", 
      members: "1.2K", 
      focus: "Environment",
      description: "Conserving nature and reducing threats to biodiversity",
      isFollowing: false
    },
    { 
      id: '2', 
      name: "UNICEF", 
      members: "890", 
      focus: "Children",
      description: "Protecting children's rights and wellbeing worldwide",
      isFollowing: true
    },
    { 
      id: '3', 
      name: "Red Crescent", 
      members: "2.1K", 
      focus: "Healthcare",
      description: "Providing humanitarian aid and emergency response",
      isFollowing: false
    },
    { 
      id: '4', 
      name: "Greenpeace", 
      members: "1.5K", 
      focus: "Environment",
      description: "Campaigning for environmental protection and peace",
      isFollowing: false
    }
  ];

  const displayOrgs = organizations || mockOrganizations;

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
          <Building2 className="w-5 h-5 text-purple-600" />
          <span>Featured Organizations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayOrgs.map((org) => (
          <div key={org.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group transition-colors">
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
        ))}
        
        <div className="pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-3"
          >
            Discover More
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
