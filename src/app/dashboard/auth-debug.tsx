'use client';

import { useEffect } from 'react';
import { setupAuthDebug } from '@/lib/auth-debug';

export default function AuthDebugComponent() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setupAuthDebug();
    }
  }, []);
  
  // This is an invisible component, just for setting up debug
  return null;
}
