/**
 * ProcessTree - Flat list of processes in a playbook
 * Click to load process into modeler, active state shows current selection
 */

import React, { useEffect, useRef } from 'react';
import { useProcessTree } from './ProcessTreeContext';
import { FileText, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import './SideBar.css';

interface ProcessTreeProps {
  playbookId: string;
  currentProcessId?: string;
  loadingProcessId?: string;
  onSelectProcess?: (processId: string) => void;
  refreshTrigger?: number;
  disabled?: boolean; // Disable clicks during save/switch operations
}

const ProcessTree: React.FC<ProcessTreeProps> = ({ 
  playbookId, 
  currentProcessId,
  loadingProcessId,
  onSelectProcess, 
  refreshTrigger,
  disabled = false,
}) => {
  const { 
    processes,
    loading,
    error,
    activeProcessId,
    fetchProcesses,
    setActiveProcess,
  } = useProcessTree();

  // Track previous refresh trigger to detect actual refresh requests
  const prevRefreshRef = useRef(refreshTrigger);

  // Fetch processes when playbook changes
  useEffect(() => {
    if (playbookId) {
      fetchProcesses(playbookId, false);
    }
  }, [playbookId, fetchProcesses]);

  // Force refresh only when refreshTrigger actually increments
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger !== prevRefreshRef.current) {
      prevRefreshRef.current = refreshTrigger;
      if (playbookId) {
        fetchProcesses(playbookId, true);
      }
    }
  }, [refreshTrigger, playbookId, fetchProcesses]);

  // Sync active state with currentProcessId prop
  useEffect(() => {
    if (currentProcessId && currentProcessId !== activeProcessId) {
      setActiveProcess(currentProcessId);
    }
  }, [currentProcessId, activeProcessId, setActiveProcess]);

  const handleProcessClick = (processId: string) => {
    if (disabled) return; // Ignore clicks during save/switch
    setActiveProcess(processId);
    onSelectProcess?.(processId);
  };

  // Show loading only on initial load (not when we have cached data)
  const showFullLoading = loading && processes.length === 0;

  if (error) {
    return (
      <div className="sidebar">
        <h5>Processes</h5>
        <div className="p-4 text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <h5>
        Processes
        {/* Subtle loading indicator for background refresh */}
        {loading && processes.length > 0 && (
          <Loader2 className="inline-block h-3 w-3 animate-spin text-gold ml-2 align-middle" />
        )}
      </h5>
      
      {showFullLoading ? (
        <div className="space-y-2 px-3 py-2">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-3/4 rounded-lg" />
        </div>
      ) : processes.length > 0 ? (
        <ul className={`sidebar-list ${disabled ? 'disabled' : ''}`}>
          {processes.map(process => {
            const isActive = activeProcessId === process.id || currentProcessId === process.id;
            const isLoading = loadingProcessId === process.id;
            
            return (
              <li 
                key={process.id} 
                className={`sidebar-item ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
                onClick={() => handleProcessClick(process.id)}
                style={disabled ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
              >
                <FileText className="h-4 w-4 text-oxford-blue shrink-0" />
                <span className="item-name">{process.name}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state">
          No processes yet. Create one to get started.
        </div>
      )}
    </div>
  );
};

export default ProcessTree;
