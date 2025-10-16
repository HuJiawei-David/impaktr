// home/ubuntu/impaktrweb/src/app/organization/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizationDashboard() {
  const router = useRouter();
  
  // Redirect to the actual organization dashboard
  useEffect(() => {
    router.replace('/organization/dashboard');
  }, [router]);

  return null;
}
