'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from "@/components/NavBar";
import EnhancedSidebar from '@/components/EnhancedSidebar';
import {User, UserProvider} from '@/components/UserContext';
import { useAuth } from '@/components/ClientSessionProvider';


export default function PlaybookLayout (
    {children,}: {children: React.ReactNode;}){

        const { user: authUser, session: authSession } = useAuth(); // Use the auth context instead of local state
        const [user, setUser] = useState<User | null>(null);

        const router = useRouter();
        const pathname = usePathname();

        useEffect(() => {
          if (authUser) {
              console.log('[Playbook Layout] Auth user available:', authUser.email);

              const newUser = {
                id: authUser.id,
                email: authUser.email || '',
                // role: authUser.user_metadata?.role || 'USER'
                role:'ADMIN'
              }

              setUser(newUser);

          }
        }, [authUser, pathname, router]);

        if (!user) {
          return <div>Loading...</div>
        }

    return (
        <UserProvider user={user}>
        <div className="page-container bg-gray-50 min-h-screen">
          <NavBar />
          {/* Sidebar */}
          <div className="d-flex flex-column flex-lg-row pt-2">
              <EnhancedSidebar user={user}/>
              {children}
          </div>
        </div>
      </UserProvider>
    )
}
