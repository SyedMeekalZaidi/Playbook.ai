/**
 * EnhancedSidebar - Playbook selector and process tree navigation
 * Converted to Shadcn/Tailwind for consistent design
 */

import React, { useState, useEffect, useRef } from 'react';
import ProcessTree from './ProcessTree';
import { ProcessTreeProvider } from './ProcessTreeContext';
import { PlaybookAPI } from '@/services/api';
import { User, Users, Copy, Plus, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Playbook {
  id: string;
  name: string;
  shortDescription?: string;
}

interface UserType {
  id: string;
  email?: string;
  role?: string;
}

interface EnhancedSidebarProps {
  currentPlaybookId: string;
  currentProcessId?: string;
  loadingProcessId?: string;
  onSelectProcess?: (processId: string) => void;
  onCreateProcess?: (name: string) => Promise<void>;
  user: UserType;
  refreshTrigger?: number;
  onPlaybookChange?: (playbookId: string) => void;
  fetchMode?: 'mount-only' | 'default';
  disabled?: boolean; // Disable interactions during save/switch
}

// Helper to determine playbook type
function getPlaybookType(playbook: any, user: UserType) {
  if (playbook.type) return playbook.type;
  if (playbook.sourcePlaybook) return 'implementor';
  if (playbook.ownerId === user.id) return 'my';
  return 'collaboration';
}

function getPlaybookIcon(type: string) {
  if (type === 'implementor') return <Copy className="h-4 w-4 text-oxford-blue shrink-0" />;
  if (type === 'collaboration') return <Users className="h-4 w-4 text-oxford-blue shrink-0" />;
  return <User className="h-4 w-4 text-oxford-blue shrink-0" />;
}

function getDisplayName(playbook: any, type: string) {
  if (type === 'implementor' && playbook.sourcePlaybook?.name) return playbook.sourcePlaybook.name;
  let name = playbook.name;
  name = name.replace(/\s+[^\s]+@[^\s]+\s+Implementation$/, '');
  return name;
}

const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  currentPlaybookId,
  currentProcessId,
  loadingProcessId,
  onSelectProcess,
  onCreateProcess,
  user,
  refreshTrigger,
  onPlaybookChange,
  fetchMode = 'default',
  disabled = false,
}) => {
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Inline process creation
  const [showNewProcessInput, setShowNewProcessInput] = useState(false);
  const [newProcessName, setNewProcessName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPlaybookList = async () => {
      setLoading(true);
      setError(null);
      try {
        let myPlaybooks: any[] = [];
        let implementorPlaybooks: any[] = [];
        let collaborationPlaybooks: any[] = [];
        
        if (user.role === 'ADMIN') {
          myPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        } else {
          myPlaybooks = await PlaybookAPI.getAll({ ownerId: user.id, isCopy: false });
        }
        implementorPlaybooks = await PlaybookAPI.getImplementorPlaybooks();
        collaborationPlaybooks = await PlaybookAPI.getCollaborationPlaybooks();

        const my = (myPlaybooks || []).map(pb => ({ ...pb, type: 'my' }));
        const impl = (implementorPlaybooks || []).map(pb => ({ ...pb, type: 'implementor' }));
        const collab = (collaborationPlaybooks || []).map(pb => ({ ...pb, type: 'collaboration' }));

        const all = [...my, ...impl, ...collab];
        const uniqueMap = new Map();
        all.forEach(pb => uniqueMap.set(pb.id, pb));
        setPlaybooks(Array.from(uniqueMap.values()));
      } catch (err: any) {
        console.error('Error fetching playbooks:', err);
        setError(err instanceof Error ? err.message : '[Sidebar] Failed to load playbooks');
        setPlaybooks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaybookList();
  }, fetchMode === 'mount-only' ? [] : [user.id, user.role, refreshTrigger]);

  useEffect(() => {
    if (loading) return;
    if (typeof onPlaybookChange !== 'function') return;

    const currentSelectionValidInList = playbooks.some(pb => pb.id === currentPlaybookId);

    if (playbooks.length > 0) {
      if (!currentPlaybookId || !currentSelectionValidInList) {
        if (currentPlaybookId !== playbooks[0].id) {
          onPlaybookChange(playbooks[0].id);
        }
      }
    } else {
      if (currentPlaybookId !== '') {
        onPlaybookChange('');
      }
    }
  }, [currentPlaybookId, playbooks, onPlaybookChange, loading]);

  // Handle inline process creation
  const handleCreateProcess = async () => {
    if (!newProcessName.trim() || !onCreateProcess || isCreating) return;
    
    setIsCreating(true);
    try {
      await onCreateProcess(newProcessName.trim());
      setNewProcessName('');
      setShowNewProcessInput(false);
    } catch (err) {
      console.error('Failed to create process:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Show skeleton ONLY on initial mount (no cached playbooks yet)
  const showSkeleton = loading && playbooks.length === 0;

  if (showSkeleton) {
    return (
      <div className="h-full bg-surface-muted border-r border-border">
        {/* Skeleton: Playbook Selector */}
        <div className="p-4 border-b border-border">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full mt-3 rounded-md" />
        </div>

        {/* Skeleton: Process List */}
        <div className="p-4">
          <Skeleton className="h-10 w-full rounded-xl mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-full rounded-lg" />
            <Skeleton className="h-11 w-3/4 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-surface-muted border-r border-border">
      {/* Playbook Selector */}
      <div className="p-4 border-b border-border">
        <Label className="text-sm font-medium text-oxford-blue mb-2 block">
          Select Playbook
        </Label>
        
        <Select
          value={currentPlaybookId}
          onValueChange={(value) => {
            if (typeof onPlaybookChange === 'function') {
              onPlaybookChange(value);
            }
          }}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Choose a playbook..." />
          </SelectTrigger>
          <SelectContent>
            {playbooks.map(playbook => {
              const type = getPlaybookType(playbook, user);
              return (
                <SelectItem key={playbook.id} value={playbook.id}>
                  <div className="flex items-center gap-2">
                    {getPlaybookIcon(type)}
                    <span className="truncate">{getDisplayName(playbook, type)}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* New Process - Button or Inline Input */}
        {currentPlaybookId && onCreateProcess && (
          <div className="mt-3">
            {showNewProcessInput ? (
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Process name..."
                  value={newProcessName}
                  onChange={(e) => setNewProcessName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProcessName.trim()) {
                      handleCreateProcess();
                    }
                    if (e.key === 'Escape') {
                      setShowNewProcessInput(false);
                      setNewProcessName('');
                    }
                  }}
                  disabled={isCreating}
                  className="pr-20 bg-white"
                  autoFocus
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setShowNewProcessInput(false);
                      setNewProcessName('');
                    }}
                    disabled={isCreating}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-2 bg-oxford-blue hover:bg-oxford-blue/90"
                    onClick={handleCreateProcess}
                    disabled={!newProcessName.trim() || isCreating}
                  >
                    {isCreating ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full border-oxford-blue text-oxford-blue hover:bg-oxford-blue hover:text-white"
                onClick={() => {
                  setShowNewProcessInput(true);
                  setTimeout(() => inputRef.current?.focus(), 0);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Process
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Process Tree - Provider is self-contained */}
      <div className="flex-1 overflow-auto">
        {currentPlaybookId ? (
          <ProcessTreeProvider>
            <ProcessTree
              playbookId={currentPlaybookId}
              currentProcessId={currentProcessId}
              loadingProcessId={loadingProcessId}
              onSelectProcess={onSelectProcess}
              refreshTrigger={refreshTrigger}
              disabled={disabled}
            />
          </ProcessTreeProvider>
        ) : (
          <div className="p-4 text-center">
            {error ? (
              <p className="text-destructive text-sm">{error}</p>
            ) : (
              <p className="body-muted">Select a playbook to view its process tree</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSidebar;
