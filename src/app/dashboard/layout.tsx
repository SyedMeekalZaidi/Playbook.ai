'use client';

/**
 * DashboardLayout - Shared layout for admin and user dashboard pages
 * Provides sidebar navigation and user context
 */

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import NavBar from "@/components/NavBar";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/ClientSessionProvider';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { User, UserProvider } from '@/components/UserContext';
import { DashboardProvider, useDashboardContext } from '@/components/DashboardContext';

// Inner component to consume context for EnhancedSidebar
const DashboardSidebarWithContext: React.FC<{ user: User }> = ({ user }) => {
  const { activePlaybookId, setActivePlaybookId } = useDashboardContext();
  return (
    <EnhancedSidebar
      user={user}
      currentPlaybookId={activePlaybookId}
      onPlaybookChange={setActivePlaybookId}
      fetchMode='mount-only'
    />
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: authUser, session: authSession } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authUser) {
      console.log('[Dashboard Layout] Auth user available:', authUser.email);

      const newUser = {
        id: authUser.id,
        email: authUser.email || '',
        role: 'ADMIN' as const
      };

      setUser(newUser);

      if (pathname === '/dashboard') {
        if (newUser.role === 'ADMIN') {
          router.replace('/dashboard/admin');
        } else if (newUser.role === 'USER') {
          router.replace('/dashboard/user');
        } else {
          router.replace('/login');
        }
      }
    }
  }, [authUser, pathname, router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <UserProvider user={user}>
      <DashboardProvider>
        <div className="min-h-screen bg-background">
          <NavBar />
          <div className="flex flex-col lg:flex-row pt-2">
            {/* Sidebar */}
            <aside className="w-full lg:w-72 shrink-0">
              <DashboardSidebarWithContext user={user} />
            </aside>
            {/* Main Content */}
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </UserProvider>
  );
}
