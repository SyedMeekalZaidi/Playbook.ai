'use client';

/**
 * Dashboard Router - Redirects to admin/user dashboard based on role
 */

import { usePathname, useRouter } from 'next/navigation';
import { useUser } from "@/components/UserContext";
import { useEffect } from 'react';

export default function Dashboard() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        router.replace('/dashboard/admin');
      } else {
        router.replace('/dashboard/user');
      }
    }
  }, [user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent mb-4" />
      <p className="text-muted-foreground">Loading dashboard...</p>
    </div>
  );
}
