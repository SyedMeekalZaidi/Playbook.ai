'use client';

/**
 * ModalComponents.tsx
 * Fixed-size modals for the BPMN modeler
 * Uses standardized sizes: sm (400px), md (560px)
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Playbook, Process } from './interfaces';
import { Loader2, AlertCircle } from 'lucide-react';

interface ModalComponentsProps {
  isClient: boolean;
  showNameDialog: boolean;
  setShowNameDialog: (show: boolean) => void;
  showDeleteConfirm: boolean;
  isLoadingPlaybooks: boolean;
  playbooks: Playbook[];
  playbookId: string;
  setPlaybookId: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  processName: string;
  setProcessName: (name: string) => void;
  isLoading: boolean;
  handleStartNewDiagram: () => void;
  isLoadingProcesses: boolean;
  playbookProcesses: Process[];
  selectedExistingProcess: string;
  setSelectedExistingProcess: (id: string) => void;
  handleLoadExistingProcess: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  handleDeleteProcess: () => void;
  processNameForDelete: string;
}

export const ModalComponents: React.FC<ModalComponentsProps> = ({
  isClient,
  showNameDialog,
  setShowNameDialog,
  showDeleteConfirm,
  isLoadingPlaybooks,
  playbooks,
  playbookId,
  setPlaybookId,
  activeTab,
  setActiveTab,
  processName,
  setProcessName,
  isLoading,
  handleStartNewDiagram,
  isLoadingProcesses,
  playbookProcesses,
  selectedExistingProcess,
  setSelectedExistingProcess,
  handleLoadExistingProcess,
  setShowDeleteConfirm,
  handleDeleteProcess,
  processNameForDelete,
}) => {
  if (!isClient) return null;

  return (
    <>
      {/* Process Setup Dialog - Size: md (560px) */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="text-oxford-blue">
              Process Modeler Setup
            </DialogTitle>
            <DialogDescription>
              Select a playbook and create a new process or load an existing one.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            {isLoadingPlaybooks ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-3/4" />
              </div>
            ) : playbooks.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No playbooks found. Please{' '}
                  <a href="/dashboard" className="font-medium underline">
                    create a playbook
                  </a>{' '}
                  first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {/* Playbook Selection */}
                <div className="space-y-2">
                  <Label htmlFor="playbook-select">Select Playbook</Label>
                  <Select
                    value={playbookId}
                    onValueChange={setPlaybookId}
                    disabled={isLoadingPlaybooks}
                  >
                    <SelectTrigger id="playbook-select">
                      <SelectValue placeholder="-- Select a Playbook --" />
                    </SelectTrigger>
                    <SelectContent>
                      {playbooks.map((pb) => (
                        <SelectItem key={pb.id} value={pb.id}>
                          {pb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabs for New/Load Process */}
                {playbookId && (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="new">Create New</TabsTrigger>
                      <TabsTrigger value="load">Load Existing</TabsTrigger>
                    </TabsList>

                    {/* New Process Tab */}
                    <TabsContent value="new" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="process-name">Process Name</Label>
                        <Input
                          id="process-name"
                          type="text"
                          placeholder="Enter name for the new process"
                          value={processName}
                          onChange={(e) => setProcessName(e.target.value)}
                        />
                      </div>
                      <Button
                        onClick={handleStartNewDiagram}
                        disabled={isLoading || !processName.trim() || !playbookId}
                        className="w-full bg-oxford-blue hover:bg-oxford-blue/90"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Start Modeling'
                        )}
                      </Button>
                    </TabsContent>

                    {/* Load Existing Tab */}
                    <TabsContent value="load" className="space-y-4 pt-4">
                      {isLoadingProcesses ? (
                        <div className="space-y-3">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : playbookProcesses.length === 0 ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            No existing processes in this playbook. Create a new one!
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="existing-process">Select Process</Label>
                            <Select
                              value={selectedExistingProcess}
                              onValueChange={setSelectedExistingProcess}
                            >
                              <SelectTrigger id="existing-process">
                                <SelectValue placeholder="-- Select a Process --" />
                              </SelectTrigger>
                              <SelectContent>
                                {playbookProcesses.map((proc) => (
                                  <SelectItem key={proc.id} value={proc.id}>
                                    {proc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={handleLoadExistingProcess}
                            disabled={isLoading || !selectedExistingProcess}
                            className="w-full bg-oxford-blue hover:bg-oxford-blue/90"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Load Process'
                            )}
                          </Button>
                        </>
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Size: sm (400px) */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the process{' '}
              <span className="font-semibold text-foreground">"{processNameForDelete}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProcess}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Process'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
