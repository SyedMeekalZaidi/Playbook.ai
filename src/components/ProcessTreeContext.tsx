/**
 * ProcessTreeContext - State management for sidebar process list
 * Provides processes for the selected playbook with smart caching
 */

import React, { createContext, useState, useContext, useCallback, useRef } from 'react';

interface Process {
  id: string;
  name: string;
  parentId: string | null;
}

interface ProcessTreeContextType {
  processes: Process[];
  loading: boolean;
  error: string | null;
  activeProcessId: string | null;
  currentPlaybookId: string | null;
  fetchProcesses: (playbookId: string, forceRefresh?: boolean) => Promise<void>;
  setActiveProcess: (id: string | null) => void;
}

const ProcessTreeContext = createContext<ProcessTreeContextType | undefined>(undefined);

export const useProcessTree = () => {
  const context = useContext(ProcessTreeContext);
  if (!context) {
    throw new Error('useProcessTree must be used within a ProcessTreeProvider');
  }
  return context;
};

export const ProcessTreeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeProcessId, setActiveProcessId] = useState<string | null>(null);
  const [currentPlaybookId, setCurrentPlaybookId] = useState<string | null>(null);
  
  // Track in-flight request to prevent duplicate fetches
  const fetchingRef = useRef<string | null>(null);

  const fetchProcesses = useCallback(async (playbookId: string, forceRefresh = false) => {
    // Skip if no playbookId
    if (!playbookId) {
      setProcesses([]);
      setCurrentPlaybookId(null);
      return;
    }
    
    // Skip if already have data for this playbook (unless forced)
    if (!forceRefresh && playbookId === currentPlaybookId && processes.length > 0) {
      return;
    }
    
    // Skip if already fetching this playbook
    if (fetchingRef.current === playbookId) {
      return;
    }
    
    fetchingRef.current = playbookId;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/playbooks/${playbookId}/processes`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch processes: ${response.status}`);
      }
      
      const processData = await response.json();
      
      // Only update if this is still the relevant fetch
      if (fetchingRef.current === playbookId) {
        setProcesses(processData);
        setCurrentPlaybookId(playbookId);
      }
    } catch (err) {
      console.error('[ProcessTreeContext] Error fetching processes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load processes');
    } finally {
      if (fetchingRef.current === playbookId) {
        setLoading(false);
        fetchingRef.current = null;
      }
    }
  }, [currentPlaybookId, processes.length]);

  const setActiveProcess = useCallback((id: string | null) => {
    setActiveProcessId(id);
  }, []);

  return (
    <ProcessTreeContext.Provider value={{
      processes,
      loading,
      error,
      activeProcessId,
      currentPlaybookId,
      fetchProcesses,
      setActiveProcess,
    }}>
      {children}
    </ProcessTreeContext.Provider>
  );
};

export default ProcessTreeContext;
