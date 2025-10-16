'use client';

import { useEffect } from 'react';
import { initializeWijmo } from '../config/wijmo.config';

interface WijmoProviderProps {
  children: React.ReactNode;
}

/**
 * WijmoProvider - Initializes Wijmo on app startup
 * This component should wrap your app to ensure Wijmo is properly initialized
 */
export default function WijmoProvider({ children }: WijmoProviderProps) {
  useEffect(() => {
    // Initialize Wijmo once on mount
    initializeWijmo();
  }, []);

  return <>{children}</>;
}

