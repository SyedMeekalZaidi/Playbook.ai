'use client';

/**
 * ModelerPage - Main BPMN diagram editor page
 * Uses Shadcn components for modern UI
 */

import React from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Trash2, Eye, EyeOff, AlertCircle, CheckCircle2, Check, Loader2 } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useModeler } from './useModeler';
import { DebugPanel } from './DebugPanel';
import { ModalComponents } from './ModalComponents';
import EnhancedSidebar from '@/components/EnhancedSidebar';
import NodeDetailsPanel from '@/components/modeler/NodeDetailsPanel';
import styles from './page.module.css';

// Dynamically import BpmnModelerComponent to avoid SSR issues
const BpmnModelerComponent = dynamic(() => import('@/components/BpmnModeler'), {
  ssr: false,
  loading: () => (
    <div className={styles.modelerLoading}>
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent" />
        <span className="text-muted-foreground">Loading Modeler...</span>
      </div>
    </div>
  ),
});

export default function ModelerPage() {
  const {
    modelerRef,
    processName,
    setProcessName,
    processId,
    playbookId,
    setPlaybookId,
    playbooks,
    processes, // This is the current process being modeled (usually an array of 1)
    playbookProcesses, // Processes available in the selected playbook
    selectedExistingProcess,
    setSelectedExistingProcess,
    nodes,
    debugEntries,
    selectedElement,
    loadError,
    setLoadError,
    showNameDialog,
    setShowNameDialog,
    showSaveSuccess,
    showDeleteConfirm,
    setShowDeleteConfirm,
    saveMessage,
    isClient,
    isLoading,
    isLoadingPlaybooks,
    isLoadingProcesses,
    activeTab,
    setActiveTab,
    handleStartNewDiagram,
    handleLoadExistingProcess,
    handleElementSelect,
    handleSaveDiagram,
    handleDeleteProcess,
    handleElementCreate,
    handleElementUpdate,
    handleElementDelete,
    handleSaveSuccess,
    currentUserId,
    currentUser,
    sidebarRefreshNonce,
    setSidebarRefreshNonce,
    showSavedIndicator,
    isSavingBeforeSwitch,
    timedAutoSave,
    loadingProcessId,
    handleSidebarProcessSelect,
    handleCreateProcessFromSidebar,
  } = useModeler();

  // Hide debug by default in production
  const [showDebug, setShowDebug] = React.useState(false);

  const openSetupModal = () => {
    setShowNameDialog(true);
  };

  // Handle process created from Magic Map AI
  const handleMagicMapProcessCreated = React.useCallback((processId: string) => {
    console.log('[MagicMap] Process created, loading:', processId);
    // Refresh sidebar to show new process
    setSidebarRefreshNonce(n => n + 1);
    // Load the new process into the modeler
    handleSidebarProcessSelect(processId);
  }, [setSidebarRefreshNonce, handleSidebarProcessSelect]);

  // 15-second interval auto-save
  React.useEffect(() => {
    if (!processId) return;
    
    const intervalId = setInterval(() => {
      timedAutoSave();
    }, 15000); // Save every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [processId, timedAutoSave]);

  // Browser exit warning when editing
  React.useEffect(() => {
    if (!processId) return;
    
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [processId]);

  // Keyboard shortcut for debug panel (Ctrl+Shift+D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <NavBar onModelerClick={openSetupModal} />
      <div className={styles.modelerPageContainer}>
        <ModalComponents
          isClient={isClient}
          showNameDialog={showNameDialog}
          setShowNameDialog={setShowNameDialog}
          showDeleteConfirm={showDeleteConfirm}
          isLoadingPlaybooks={isLoadingPlaybooks}
          playbooks={playbooks}
          playbookId={playbookId}
          setPlaybookId={setPlaybookId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          processName={processName}
          setProcessName={setProcessName}
          isLoading={isLoading}
          handleStartNewDiagram={handleStartNewDiagram}
          isLoadingProcesses={isLoadingProcesses}
          playbookProcesses={playbookProcesses}
          selectedExistingProcess={selectedExistingProcess}
          setSelectedExistingProcess={setSelectedExistingProcess}
          handleLoadExistingProcess={handleLoadExistingProcess}
          setShowDeleteConfirm={setShowDeleteConfirm}
          handleDeleteProcess={handleDeleteProcess}
          processNameForDelete={processes.find(p=>p.id === processId)?.name || "this process"}
        />

        {/* Error Alert */}
        {loadError && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              {loadError}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLoadError(null)}
                className="h-auto p-1"
              >
                ✕
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Toast */}
        {showSaveSuccess && (
          <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <Alert className="bg-green-50 border-green-200 text-green-800 shadow-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>{saveMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content */}
        {!showNameDialog && processId && (
          <div className={styles.modelerLayoutRow}>
            {/* Sidebar */}
            <div className={styles.sidebarColumn}>
              {isClient && currentUser && (
                <EnhancedSidebar
                  user={currentUser}
                  currentPlaybookId={playbookId}
                  currentProcessId={processId}
                  loadingProcessId={loadingProcessId || undefined}
                  onPlaybookChange={setPlaybookId}
                  onSelectProcess={handleSidebarProcessSelect}
                  onCreateProcess={handleCreateProcessFromSidebar}
                  refreshTrigger={sidebarRefreshNonce}
                  disabled={isSavingBeforeSwitch || !!loadingProcessId}
                />
              )}
            </div>

            {/* Main Editor Area */}
            <div className={`${styles.mainContentColumn} flex flex-col`}>
              <div className="flex flex-grow">
                {/* Modeler Column */}
                <div className={`${styles.modelerColumn} ${showDebug ? 'w-2/3' : 'w-full'}`}>
                  {/* Header */}
                  <div className={styles.modelerHeader}>
                    <h3 className="text-xl font-semibold text-oxford-blue">
                      {processes.find(p => p.id === processId)?.name || 'BPMN Modeler'}
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDebug(!showDebug)}
                        className="hidden" // Hidden by default, accessible via Ctrl+Shift+D
                      >
                        {showDebug ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showDebug ? 'Hide Debug' : 'Debug'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={!processId || isLoading}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveDiagram}
                        disabled={!processId || isLoading || isSavingBeforeSwitch}
                        className={
                          showSavedIndicator 
                            ? "bg-green-600 hover:bg-green-600 text-white transition-colors" 
                            : isSavingBeforeSwitch
                              ? "bg-gold hover:bg-gold text-oxford-blue transition-colors"
                              : "bg-oxford-blue hover:bg-oxford-blue/90"
                        }
                      >
                        {isSavingBeforeSwitch ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : showSavedIndicator ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* BPMN Canvas */}
                  <div className={styles.modelerWrapper}>
                    {isClient && processId ? (
                      <BpmnModelerComponent
                        ref={modelerRef}
                        onSave={handleSaveSuccess}
                        onElementSelect={handleElementSelect}
                        onElementCreate={handleElementCreate}
                        onElementUpdate={handleElementUpdate}
                        onElementDelete={handleElementDelete}
                        onError={(err) => setLoadError(err)}
                        processes={processes}
                        nodes={nodes}
                        playbookId={playbookId}
                        processId={processId}
                      />
                    ) : (
                      !isClient && (
                        <div className={styles.modelerLoading}>
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-oxford-blue border-t-transparent" />
                            <span className="text-muted-foreground">Initializing...</span>
                          </div>
                        </div>
                      )
                    )}
                    
                    {/* Saving overlay - light frost shimmer during save/switch */}
                    {isSavingBeforeSwitch && (
                      <div className={styles.savingOverlay} />
                    )}
                  </div>
                </div>

                {/* Debug Panel (hidden by default) */}
                {showDebug && (
                  <div className={`${styles.debugColumn} w-1/3`}>
                    <DebugPanel
                      selectedElement={selectedElement}
                      debugEntries={debugEntries}
                      processes={processes}
                      nodes={nodes}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Node Details Panel */}
            <div className={styles.rightSidebarColumn}>
              <NodeDetailsPanel 
                selectedElement={selectedElement}
                playbookId={playbookId}
                onProcessCreated={handleMagicMapProcessCreated}
              />
            </div>
          </div>
        )}

        {/* Fallback when no process selected */}
        {!showNameDialog && !processId && isClient && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="bg-muted/50 rounded-lg p-8 max-w-md">
              <h2 className="text-xl font-semibold text-oxford-blue mb-2">
                No Process Selected
              </h2>
              <p className="text-muted-foreground mb-4">
                Please select or create a process to start modeling.
              </p>
              <Button
                onClick={() => setShowNameDialog(true)}
                className="bg-oxford-blue hover:bg-oxford-blue/90"
              >
                Open Setup
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}