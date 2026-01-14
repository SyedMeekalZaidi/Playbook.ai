'use client';

/**
 * PlaybookLayout - Shared layout for playbook detail pages
 * Provides sidebar navigation, user context, and share button
 */

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import NavBar from "@/components/NavBar";
import EnhancedSidebar from '@/components/EnhancedSidebar';
import { User, UserProvider } from '@/components/UserContext';
import { useAuth } from '@/components/ClientSessionProvider';
import { Button } from '@/components/ui/button';

export default function PlaybookLayout({
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
      console.log('[Playbook Layout] Auth user available:', authUser.email);

      const newUser = {
        id: authUser.id,
        email: authUser.email || '',
        role: 'ADMIN' as const
      };

      setUser(newUser);
    }
  }, [authUser, pathname, router]);

  const handleShareCurrentPlaybook = () => {
    const playbookIdMatch = pathname.match(/\/playbook\/([a-zA-Z0-9-]+)/);
    if (playbookIdMatch && playbookIdMatch[1]) {
      const playbookId = playbookIdMatch[1];
      console.log(`Share button clicked for playbook ID: ${playbookId}`);
      alert(`Share functionality for playbook ${playbookId} would open a modal here.`);
    } else {
      console.warn('Could not determine playbook ID from pathname:', pathname);
      alert('Could not determine the playbook to share.');
    }
  };

  // Extract playbook ID from URL for sidebar
  const playbookIdFromUrl = pathname.match(/\/playbook\/([a-zA-Z0-9-]+)/)?.[1] || '';

  // Show if on a specific playbook page (not new-playbook)
  const showShareButton = pathname.startsWith('/playbook/') && 
    pathname.split('/').length > 2 && 
    !pathname.endsWith('/new-playbook');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <UserProvider user={user}>
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex flex-col lg:flex-row pt-2">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <EnhancedSidebar 
              user={user} 
              currentPlaybookId={playbookIdFromUrl}
              fetchMode="mount-only"
            />
          </aside>
          {/* Main Content */}
          <main className="flex-1 p-4 relative">
            {/* Share button */}
            {showShareButton && (
              <Button
                onClick={handleShareCurrentPlaybook}
                className="absolute top-4 right-4 z-10 bg-oxford-blue hover:bg-oxford-blue/90"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            )}
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
