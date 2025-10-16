'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationSocialPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/organization/dashboard');
  }, [router]);
  return null;
}
