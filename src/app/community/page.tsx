'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CommunityDiscovery } from '@/components/community/CommunityDiscovery';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  sdgFocus: number[];
  privacy: string;
  memberCount: number;
  postCount: number;
  recentActivity: string;
  isPublic: boolean;
  isJoined: boolean;
  userRole: string | null;
  bannerImage?: string;
  avatar?: string;
  tags: string[];
  createdByUser: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/signin');
      return;
    }
    fetchCommunities();
  }, [session, status, router]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/communities');
      if (!response.ok) {
        throw new Error('Failed to fetch communities');
      }
      const data = await response.json();
      console.log('Fetched communities from API:', data.communities);
      setCommunities(data.communities || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      const response = await fetch('/api/communities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId })
      });

      if (!response.ok) {
        throw new Error('Failed to join community');
      }

      // Refresh communities
      await fetchCommunities();
    } catch (err) {
      console.error('Error joining community:', err);
      alert('Failed to join community');
    }
  };

  const handleViewCommunity = (communityId: string) => {
    router.push(`/community/${communityId}`);
  };

  const handleShareCommunity = (communityId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/community/${communityId}`);
    alert('Community link copied to clipboard!');
  };

  const handleCreateCommunity = () => {
    router.push('/community/create');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading communities..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Error Loading Communities</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button 
            onClick={fetchCommunities}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Community Discovery */}
        <CommunityDiscovery
          communities={communities}
          onJoin={handleJoinCommunity}
          onView={handleViewCommunity}
          onShare={handleShareCommunity}
          onCreateCommunity={handleCreateCommunity}
        />
      </div>
    </div>
  );
}