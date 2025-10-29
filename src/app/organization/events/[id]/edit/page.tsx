'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function EditEventPage() {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  useEffect(() => {
    if (!isLoading && eventId) {
      // Redirect to create page with eventId as query param
      // The create page will handle loading the event data
      router.push(`/organization/events/create?edit=${eventId}`);
    }
  }, [isLoading, eventId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return null;
}
