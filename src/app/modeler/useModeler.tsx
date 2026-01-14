import { useRef, useState, useEffect } from 'react';
import { PlaybookAPI, ProcessAPI, NodeAPI } from '@/services/api'; // Import API services
import { Playbook, Process, User as AppUser } from '@/types/api'; // Import types
import { DebugEntry } from './interfaces'; // Removed User import as DEFAULT_USER is removed
import { createClient } from '@/lib/supabase'; // Use new browser client

// Type for pending background sync
interface PendingSync {
  processId: string;
  timeoutId: ReturnType<typeof setTimeout>;
  cancel: () => void;
}

export const useModeler = () => {
  const modelerRef = useRef<any>(null);
  const isSwitchingRef = useRef<boolean>(false); // Mutex to prevent concurrent switches
  const pendingSyncRef = useRef<PendingSync | null>(null); // Track background sync for cancellation
  const [processName, setProcessName] = useState<string>('');
  const [processId, setProcessId] = useState<string>('');
  const [playbookId, setPlaybookId] = useState<string>('');
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [playbookProcesses, setPlaybookProcesses] = useState<Process[]>([]);
  const [selectedExistingProcess, setSelectedExistingProcess] = useState<string>('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState<boolean>(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPlaybooks, setIsLoadingPlaybooks] = useState(false);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('new');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null); // Added currentUser state
  const [sidebarRefreshNonce, setSidebarRefreshNonce] = useState<number>(0); // Added for sidebar refresh
  const [isSavingDiagram, setIsSavingDiagram] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState<boolean>(false);
  const [isSavingBeforeSwitch, setIsSavingBeforeSwitch] = useState<boolean>(false); // Save before process switch
  const [loadingProcessId, setLoadingProcessId] = useState<string | null>(null); // Track which process is loading
  const supabase = createClient();

  useEffect(() => {
    setIsClient(true);
    const fetchUserAndPlaybooks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setCurrentUser({ id: user.id, email: user.email || '', role: 'USER' }); // Mock role as 'USER'
        fetchPlaybooks(user.id);
      } else {
        setCurrentUserId(null);
        setCurrentUser(null); // Clear current user
        setPlaybooks([]); // Clear playbooks if no user
        setLoadError("Please log in to manage your playbooks.");
        setIsLoadingPlaybooks(false); // Ensure loading state is false
      }
    };
    fetchUserAndPlaybooks();
  }, [supabase]);

  useEffect(() => {
    if (playbookId) {
      fetchProcessesForPlaybook(playbookId);
    } else {
      setPlaybookProcesses([]);
    }
  }, [playbookId]);

  // Cleanup: Cancel any pending background sync on unmount
  useEffect(() => {
    return () => {
      if (pendingSyncRef.current) {
        console.log('[BACKGROUND-SYNC] 🧹 Cleanup: Cancelling pending sync on unmount');
        pendingSyncRef.current.cancel();
        pendingSyncRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (loadError) {
      console.error("BPMN Load Error:", loadError);
    }
  }, [loadError]);

  const fetchPlaybooks = async (ownerId: string | null) => {
    if (!ownerId) {
      setPlaybooks([]);
      setPlaybookId('');
      setLoadError("User not authenticated. Cannot fetch playbooks.");
      setIsLoadingPlaybooks(false);
      return;
    }
    setIsLoadingPlaybooks(true);
    setLoadError(null);
    try {
      const fetchedPlaybooks = await PlaybookAPI.getAll({ ownerId });
      console.log("Fetched playbooks for owner:", ownerId, fetchedPlaybooks);

      if (!fetchedPlaybooks || fetchedPlaybooks.length === 0) {
        console.log("No playbooks found for this user.");
        setPlaybooks([]);
        setPlaybookId('');
      } else {
        setPlaybooks(fetchedPlaybooks);
        setPlaybookId(fetchedPlaybooks[0]?.id || '');
      }
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      setLoadError("Failed to fetch playbooks. Please ensure you are logged in and have access, or try again later.");
      setPlaybooks([]);
      setPlaybookId('');
    } finally {
      setIsLoadingPlaybooks(false);
    }
  };

  const fetchProcessesForPlaybook = async (playbookId: string) => {
    setIsLoadingProcesses(true);
    try {
      const fetchedProcesses = await ProcessAPI.getAll({ playbookId: playbookId });
      console.log("Fetched processes for playbook:", fetchedProcesses);
      setPlaybookProcesses(fetchedProcesses);
    } catch (error) {
      console.error("Error fetching processes for playbook:", error);
      setPlaybookProcesses([]);
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  const addDebugEntry = (entry: DebugEntry) => {
    setDebugEntries(prevEntries => [entry, ...prevEntries].slice(0, 50));
  };

  const handleStartNewDiagram = async () => {
    if (!processName.trim() || !playbookId || !currentUserId) {
      setLoadError("Cannot create process: Missing process name, playbook selection, or user authentication.");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Creating process with playbookId:", playbookId);
      const newProcess = await ProcessAPI.create({
        processName: processName,
        playbookId: playbookId,
      });

      setProcessId(newProcess.id);
      setProcesses([newProcess]);
      setShowNameDialog(false);

      addDebugEntry({
        action: 'CREATE',
        timestamp: new Date(),
        elementType: 'process',
        elementName: processName,
        bpmnId: 'Process_1',
        dbId: newProcess.id,
        details: `Created initial process in playbook: ${playbookId}`,
      });
      setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
    } catch (error) {
      console.error("Error creating process:", error);
      setLoadError("Failed to create process. Please check if the playbook exists.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadExistingProcess = async () => {
    if (!selectedExistingProcess) return;

    setIsLoading(true);
    try {
      const process = await ProcessAPI.getById(selectedExistingProcess);

      setProcessId(process.id);
      setProcessName(process.name);
      setProcesses([process]);
      setShowNameDialog(false);

      const processNodes = await NodeAPI.getByProcess(process.id);
      setNodes(processNodes);

      // === SYNC-TEST: Process Loaded ===
      console.log('[SYNC-TEST] 📂 PROCESS LOADED', {
        processId: process.id,
        processName: process.name,
        hasXml: !!process.bpmnXml,
        xmlLength: process.bpmnXml?.length || 0,
        dbNodeCount: processNodes.length,
        dbNodes: processNodes.map((n: any) => ({ dbId: n.id, bpmnId: n.bpmnId, name: n.name }))
      });

      addDebugEntry({
        action: 'LOAD',
        timestamp: new Date(),
        elementType: 'process',
        elementName: process.name,
        bpmnId: process.bpmnId || 'Process_1',
        dbId: process.id,
        details: `Loaded existing process from playbook: ${playbookId}`,
      });
    } catch (error: any) {
      console.error("[SYNC-TEST] ❌ LOAD FAILED:", error.message || error);
      setLoadError("Failed to load process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sidebar: Load process by clicking in sidebar (uses quick save + background sync)
  const handleSidebarProcessSelect = async (selectedProcessId: string) => {
    // Guard: Skip if same process or invalid
    if (!selectedProcessId || selectedProcessId === processId) return;

    // MUTEX: Prevent concurrent switch operations (race condition fix)
    if (isSwitchingRef.current) {
      console.log('[SWITCH] ⏭️ BLOCKED - Already switching processes');
      return;
    }
    
    // Acquire the mutex
    isSwitchingRef.current = true;
    setSelectedElement(null); // Clear node selection when switching processes
    const targetProcessId = selectedProcessId; // Capture the target we want to load
    const previousProcessId = processId; // Capture for background sync

    console.log('[SWITCH] 🔄 SWITCH START', {
      from: previousProcessId,
      to: targetProcessId,
    });

    // Cancel any pending background sync if returning to the same process
    if (pendingSyncRef.current?.processId === targetProcessId) {
      cancelPendingSync('returning to same process');
    }

    try {
      // PHASE 1: Quick save current diagram (XML only, ~100ms)
      let diagramElements: any[] = [];
      if (modelerRef.current && previousProcessId) {
        setIsSavingBeforeSwitch(true);
        
        try {
          // Get XML and elements without triggering full save
          const xml = await modelerRef.current.getXml();
          diagramElements = modelerRef.current.getDiagramElements();
          
          // Quick save - XML only (fast!)
          await saveXmlOnly(previousProcessId, xml);
        } catch (error) {
          console.error('[SWITCH] ❌ Quick save failed:', error);
          // Continue anyway - don't block navigation
        }
        // Note: Keep overlay visible - don't set false here
      }

      // PHASE 2: Load the target process
      setLoadingProcessId(targetProcessId);
      console.log('[SWITCH] 📂 Loading process:', targetProcessId);
      
      const process = await ProcessAPI.getById(targetProcessId);
      console.log('[SWITCH] 📥 Process fetched:', {
        id: process.id,
        name: process.name,
        hasBpmnXml: !!process.bpmnXml,
        xmlLength: process.bpmnXml?.length || 0
      });

      // PHASE 3: Update state with the new process
      setProcessId(process.id);
      setProcessName(process.name);
      setProcesses([process]);
      setShowNameDialog(false);

      const processNodes = await NodeAPI.getByProcess(process.id);
      console.log('[SWITCH] 📥 Nodes fetched:', {
        processId: process.id,
        nodeCount: processNodes.length,
      });
      setNodes(processNodes);

      console.log('[SWITCH] ✅ SWITCH COMPLETE', {
        newProcessId: process.id,
        newProcessName: process.name,
      });

      // PHASE 4: Queue background sync for the previous process (non-blocking)
      if (previousProcessId && diagramElements.length > 0) {
        syncNodesInBackground(previousProcessId, diagramElements);
      }

      // All phases complete - hide overlay
      setIsSavingBeforeSwitch(false);

    } catch (error: any) {
      console.error("[SWITCH] ❌ LOAD FAILED:", error);
      setLoadError("Failed to load process. Please try again.");
      setIsSavingBeforeSwitch(false); // Hide overlay on error
    } finally {
      // Always release the mutex and clear loading state
      setLoadingProcessId(null);
      isSwitchingRef.current = false;
    }
  };

  // Sidebar: Create process inline (optimistic)
  const handleCreateProcessFromSidebar = async (name: string) => {
    if (!name.trim() || !playbookId || !currentUserId) {
      throw new Error("Missing process name, playbook, or user auth");
    }

    setLoadingProcessId('creating'); // Show creating state
    try {
      const newProcess = await ProcessAPI.create({
        processName: name.trim(),
        playbookId: playbookId,
      });

      setProcessId(newProcess.id);
      setProcessName(newProcess.name);
      setProcesses([newProcess]);
      setNodes([]);
      setShowNameDialog(false);

      addDebugEntry({
        action: 'CREATE',
        timestamp: new Date(),
        elementType: 'process',
        elementName: name,
        bpmnId: 'Process_1',
        dbId: newProcess.id,
        details: `Created process from sidebar`,
      });
      setSidebarRefreshNonce(n => n + 1);
    } finally {
      setLoadingProcessId(null);
    }
  };

  const handleElementSelect = (element: any, databaseInfo: any) => {
    setSelectedElement({ element, databaseInfo });
    console.log("Selected element:", element.id, "Type:", element.type);
  };

  // Manual save - called by Save button
  const handleSaveDiagram = async () => {
    if (!modelerRef.current || !processId) return;

    setLoadError(null);

    try {
      await modelerRef.current.saveDiagram();
      setLastSavedAt(new Date());
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
    } catch (error) {
      console.error("Error during manual save:", error);
    }
  };

  // Timed auto-save - called every 15 seconds by interval
  const timedAutoSave = async () => {
    if (!modelerRef.current || !processId) return;

    try {
      await modelerRef.current.saveDiagram();
      setLastSavedAt(new Date());
      setShowSavedIndicator(true);
      setTimeout(() => setShowSavedIndicator(false), 2000);
    } catch (error) {
      // Silent fail for auto-save - don't disturb user
      console.error("Auto-save failed:", error);
    }
  };

  const handleDeleteProcess = async () => {
    if (!processId) return;

    try {
      await ProcessAPI.delete(processId);
      setSaveMessage(`Process "${processName}" deleted successfully!`);
      setShowSaveSuccess(true);
      setShowDeleteConfirm(false);

      setProcessId('');
      setProcessName('');
      setProcesses([]);
      setNodes([]);
      setShowNameDialog(true);

      if (playbookId) {
        fetchProcessesForPlaybook(playbookId);
      }

      addDebugEntry({
        action: 'DELETE',
        timestamp: new Date(),
        elementType: 'process',
        elementName: processName,
        bpmnId: 'N/A',
        dbId: processId,
        details: `Deleted process from playbook: ${playbookId}`,
      });
      setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
    } catch (error) {
      console.error("Error deleting process:", error);
      setLoadError("Failed to delete process");
    }
  };

  const handleElementCreate = async (data: any) => {
    try {
      if (data.type === 'process') {
        console.warn('Process creation in useModeler.handleElementCreate needs implementation.');
        return { id: `temp-process-${Date.now()}`, ...data.data }; // Placeholder
      } else {
        const createNodePayload: import('@/types/api').CreateNodePayload = {
          name: data.data.name || 'New Node',
          type: data.data.type, // This is elementType e.g. 'startEvent'
          processId: processId,
          bpmnId: data.data.bpmnId,
          shortDescription: data.data.shortDescription || null,
        };
        const newNodeOrExisting = await NodeAPI.create(createNodePayload);

        setNodes(prevNodes => {
          const existingNodeIndex = prevNodes.findIndex(n => n.id === newNodeOrExisting.id);
          if (existingNodeIndex !== -1) {
            const updatedNodes = [...prevNodes];
            updatedNodes[existingNodeIndex] = newNodeOrExisting;
            return updatedNodes;
          }
          return [...prevNodes, newNodeOrExisting];
        });
        addDebugEntry({
          action: 'CREATE_OR_FETCH',
          timestamp: new Date(),
          elementType: newNodeOrExisting.type,
          elementName: newNodeOrExisting.name,
          bpmnId: newNodeOrExisting.bpmnId,
          dbId: newNodeOrExisting.id,
        });
        setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
        return newNodeOrExisting;
      }
    } catch (error) {
      console.error('Error creating element:', error);
      throw error;
    }
  };

  const handleElementUpdate = async (data: any) => {
    console.log('Updating element (useModeler):', data);
    try {
      if (data.type === 'process') {
        console.warn('Process update in useModeler.handleElementUpdate needs implementation.');
        return { ...data.data }; // Placeholder
      } else {
        const dbId = data.dbId;
        if (!dbId) {
          console.error('DB ID missing for node update in useModeler');
          throw new Error('DB ID missing for node update');
        }

        const updateNodePayload: import('@/types/api').UpdateNodePayload = {
          id: dbId,
        };
        if (data.data.name !== undefined) updateNodePayload.name = data.data.name;
        if (data.data.type !== undefined) updateNodePayload.type = data.data.type;
        if (data.data.bpmnId !== undefined) updateNodePayload.bpmnId = data.data.bpmnId;
        if (data.data.shortDescription !== undefined) updateNodePayload.shortDescription = data.data.shortDescription;

        let updatedNode;
        try {
          updatedNode = await NodeAPI.update(updateNodePayload);
        } catch (updateError: any) {
          console.warn(`Failed to update node by dbId ${dbId}, attempting fallback. Error: ${updateError.message}`);
          const nodesInDb = await NodeAPI.getByProcess(processId);
          const nodeByBpmnId = nodesInDb.find((n: { bpmnId?: string }) => n.bpmnId === data.data.bpmnId);
          if (nodeByBpmnId) {
            updateNodePayload.id = nodeByBpmnId.id;
            updatedNode = await NodeAPI.update(updateNodePayload);
          } else {
            console.warn(`Node not found by bpmnId ${data.data.bpmnId} either. Re-creating.`);
            updatedNode = await NodeAPI.create({
              name: data.data.name || 'New Node',
              type: data.data.type,
              processId: processId,
              bpmnId: data.data.bpmnId,
              shortDescription: data.data.shortDescription || null,
            });
            if (modelerRef.current && updatedNode) {
              const modeler = modelerRef.current.getModeler();
              const elementRegistry = modeler.get('elementRegistry');
              const modeling = modeler.get('modeling');
              const diagramElement = elementRegistry.get(data.data.bpmnId);
              if (diagramElement && modeling) {
                modeling.updateProperties(diagramElement, { dbId: updatedNode.id, dbType: 'node' });
              }
            }
          }
        }

        const refreshedNodes = await NodeAPI.getByProcess(processId);
        setNodes(refreshedNodes);
        addDebugEntry({
          action: 'UPDATE',
          timestamp: new Date(),
          elementType: updatedNode.type,
          elementName: updatedNode.name,
          bpmnId: updatedNode.bpmnId,
          dbId: updatedNode.id,
        });
        if (!isSavingDiagram) { // Only refresh if not part of a save operation
          setSidebarRefreshNonce(n => n + 1);
        }
        return updatedNode;
      }
    } catch (error) {
      console.error('Error updating element:', error);
      throw error;
    }
  };

  const handleElementDelete = async (data: any) => {
    console.log('Deleting element:', data);
    try {
      if (data.type === 'process') {
        await ProcessAPI.delete(data.id);
        setProcesses(prev => prev.filter(p => p.id !== data.id));
      } else {
        await NodeAPI.delete(data.id);
        const latestNodes = await NodeAPI.getByProcess(processId);
        setNodes(latestNodes);
      }
      addDebugEntry({
        action: 'DELETE',
        timestamp: new Date(),
        elementType: data.type,
        elementName: 'Deleted Element',
        bpmnId: 'N/A',
        dbId: data.id,
      });
      setSidebarRefreshNonce(n => n + 1); // Refresh sidebar
      return { success: true };
    } catch (error) {
      console.error('Error deleting element:', error);
      throw error;
    }
  };

  // Quick save - XML only (for process switching)
  // Fast: Single API call, no node syncing, no sidebar refresh
  const saveXmlOnly = async (targetProcessId: string, xml: string): Promise<void> => {
    if (!targetProcessId || !xml) {
      console.warn('[QUICK-SAVE] ⚠️ Missing processId or xml');
      return;
    }
    
    const startTime = Date.now();
    console.log('[QUICK-SAVE] 💾 Saving XML for:', targetProcessId, `(${xml.length} bytes)`);
    
    try {
      await ProcessAPI.patch(targetProcessId, { bpmnXml: xml });
      
      // Update local state
      setProcesses(prev =>
        prev.map(p => (p.id === targetProcessId ? { ...p, bpmnXml: xml } : p))
      );
      
      const duration = Date.now() - startTime;
      console.log('[QUICK-SAVE] ✅ XML saved in', `${duration}ms`);
    } catch (error) {
      console.error('[QUICK-SAVE] ❌ Failed:', error);
      throw error; // Re-throw so caller can handle
    }
  };

  // Cancel any pending background sync (called when switching processes)
  const cancelPendingSync = (reason: string) => {
    if (pendingSyncRef.current) {
      console.log('[BACKGROUND-SYNC] 🚫 Cancelling pending sync for:', pendingSyncRef.current.processId, `(${reason})`);
      pendingSyncRef.current.cancel();
      pendingSyncRef.current = null;
    }
  };

  // Background sync - syncs nodes after a delay (non-blocking, cancellable)
  const syncNodesInBackground = (targetProcessId: string, diagramElements: any[]) => {
    // Cancel any existing pending sync first
    cancelPendingSync('new sync queued');
    
    console.log('[BACKGROUND-SYNC] 🔄 Queued sync for:', targetProcessId, '(2s delay)');
    
    let isCancelled = false;
    
    const timeoutId = setTimeout(async () => {
      if (isCancelled) {
        console.log('[BACKGROUND-SYNC] ⏭️ Sync was cancelled, skipping:', targetProcessId);
        return;
      }
      
      console.log('[BACKGROUND-SYNC] 🚀 Starting sync for:', targetProcessId);
      const startTime = Date.now();
      
      try {
        // Filter to only node elements
        const nodeElements = diagramElements.filter(e => e.dbType !== 'process');
        
        if (nodeElements.length === 0) {
          console.log('[BACKGROUND-SYNC] ⏭️ No nodes to sync');
          return;
        }
        
        // Fetch existing nodes
        const existingNodesInDb = await NodeAPI.getByProcess(targetProcessId);
        const existingNodesByBpmnId = new Map<string, { id: string; bpmnId: string; name: string }>(
          existingNodesInDb.map((n: { id: string; bpmnId: string; name: string }) => [n.bpmnId, n])
        );
        
        const currentDiagramBpmnIds = new Set<string>();
        const syncPromises: Promise<void>[] = [];
        
        // Sync each element
        for (const elementInfo of nodeElements) {
          if (isCancelled) break; // Check cancellation during loop
          
          currentDiagramBpmnIds.add(elementInfo.bpmnId);
          
          const promise = (async () => {
            const dbNode = existingNodesByBpmnId.get(elementInfo.bpmnId);
            
            if (dbNode) {
              // Update existing node
              await NodeAPI.update({
                id: dbNode.id,
                name: elementInfo.elementName,
                type: elementInfo.elementType,
                bpmnId: elementInfo.bpmnId,
                shortDescription: elementInfo.shortDescription || null,
              });
            } else {
              // Create new node
              await NodeAPI.create({
                name: elementInfo.elementName || 'New Node',
                type: elementInfo.elementType || 'Task',
                processId: targetProcessId,
                bpmnId: elementInfo.bpmnId,
                shortDescription: elementInfo.shortDescription || null,
              });
            }
          })();
          syncPromises.push(promise);
        }
        
        if (isCancelled) {
          console.log('[BACKGROUND-SYNC] ⏭️ Cancelled during sync');
          return;
        }
        
        await Promise.all(syncPromises);
        
        // Delete orphan nodes (nodes in DB but not in diagram)
        const finalDbNodes = await NodeAPI.getByProcess(targetProcessId);
        const nodesToDelete = finalDbNodes.filter(
          (dbNode: any) => dbNode.bpmnId && !currentDiagramBpmnIds.has(dbNode.bpmnId)
        );
        
        if (nodesToDelete.length > 0 && !isCancelled) {
          const deletePromises = nodesToDelete.map((node: any) => NodeAPI.delete(node.id));
          await Promise.all(deletePromises);
        }
        
        const duration = Date.now() - startTime;
        console.log('[BACKGROUND-SYNC] ✅ Sync complete for:', targetProcessId, `(${duration}ms)`);
        
      } catch (error) {
        // Silent failure - just log, don't affect UI
        console.error('[BACKGROUND-SYNC] ❌ Sync failed for:', targetProcessId, error);
      } finally {
        // Clear the ref if this was the pending sync
        if (pendingSyncRef.current?.processId === targetProcessId) {
          pendingSyncRef.current = null;
        }
      }
    }, 2000); // 2-second delay
    
    // Store the pending sync for cancellation
    pendingSyncRef.current = {
      processId: targetProcessId,
      timeoutId,
      cancel: () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      },
    };
  };

  // Full save - XML + node sync (for manual save button)
  const handleSaveSuccess = async (xml: string, diagramElementsInfo: any[]) => {
    console.log('[SAVE-SUCCESS] 🎯 handleSaveSuccess called', {
      currentProcessIdState: processId,
      xmlLength: xml?.length || 0,
      elementsCount: diagramElementsInfo?.length || 0
    });

    if (!processId) {
      console.error("[SAVE-SUCCESS] ❌ SAVE FAILED: ProcessId is missing");
      setLoadError("Process ID is missing. Cannot save.");
      setShowSaveSuccess(false);
      return;
    }

    // === SYNC-TEST: Save Start ===
    const nodeElements = diagramElementsInfo.filter(e => e.dbType !== 'process');
    console.log('[SAVE-SUCCESS] 💾 SAVE START', {
      processId,
      canvasNodeCount: nodeElements.length,
      nodes: nodeElements.map(e => ({ bpmnId: e.bpmnId, dbId: e.dbId, name: e.elementName }))
    });

    setIsSavingDiagram(true);

    try {
      // Step 1: Save the XML
      await ProcessAPI.patch(processId, { bpmnXml: xml });
      setProcesses(prev =>
        prev.map(p => (p.id === processId ? { ...p, bpmnXml: xml } : p))
      );
      console.log('[SAVE-SUCCESS] ✅ Process XML saved to DB');

      // Step 2: Fetch existing nodes ONCE (fix N+1 query issue!)
      const existingNodesInDb = await NodeAPI.getByProcess(processId);
      const existingNodesByBpmnId = new Map<string, { id: string; bpmnId: string; name: string }>(
        existingNodesInDb.map((n: { id: string; bpmnId: string; name: string }) => [n.bpmnId, n])
      );
      console.log('[SAVE-SUCCESS] 📋 Existing nodes fetched', {
        count: existingNodesInDb.length,
        bpmnIds: Array.from(existingNodesByBpmnId.keys())
      });

      const currentDiagramBpmnIds = new Set<string>();
      const syncPromises = [];

      const modelerInstance = modelerRef.current?.getModeler();
      const elementRegistry = modelerInstance?.get('elementRegistry');
      const modeling = modelerInstance?.get('modeling');

      // Step 3: Sync each element (using the pre-fetched map)
      for (const elementInfo of diagramElementsInfo) {
        if (elementInfo.dbType === 'process') {
          continue; // Skip process elements
        }

        currentDiagramBpmnIds.add(elementInfo.bpmnId);

        const promise = (async () => {
          // Use the pre-fetched map instead of making an API call!
          const dbNode = existingNodesByBpmnId.get(elementInfo.bpmnId);

          if (dbNode) {
            // Update existing node
            const payload: import('@/types/api').UpdateNodePayload = {
              id: dbNode.id,
              name: elementInfo.elementName,
              type: elementInfo.elementType,
              bpmnId: elementInfo.bpmnId,
              shortDescription: elementInfo.shortDescription || null,
            };
            await NodeAPI.update(payload);
            if (elementRegistry && modeling && elementInfo.bpmnId && dbNode.id) {
              const diagramElement = elementRegistry.get(elementInfo.bpmnId);
              if (diagramElement && diagramElement.businessObject.dbId !== dbNode.id) {
                modeling.updateProperties(diagramElement, { dbId: dbNode.id, dbType: 'node' });
              }
            }
          } else {
            // Create new node
            const payload: import('@/types/api').CreateNodePayload = {
              name: elementInfo.elementName || 'New Node',
              type: elementInfo.elementType || 'Task',
              processId: processId,
              bpmnId: elementInfo.bpmnId,
              shortDescription: elementInfo.shortDescription || null,
            };
            const newNode = await NodeAPI.create(payload);
            if (elementRegistry && modeling && elementInfo.bpmnId && newNode.id) {
              const diagramElement = elementRegistry.get(elementInfo.bpmnId);
              if (diagramElement) {
                modeling.updateProperties(diagramElement, { dbId: newNode.id, dbType: 'node' });
              } else {
                console.warn(`Diagram element ${elementInfo.bpmnId} not found in registry after create.`);
              }
            }
          }
        })();
        syncPromises.push(promise);
      }

      await Promise.all(syncPromises);
      console.log('[SAVE-SUCCESS] ✅ All nodes synced');

      const finalDbNodesForProcess = await NodeAPI.getByProcess(processId);
      const nodesToDelete = finalDbNodesForProcess.filter(
        (dbNode: any) => dbNode.bpmnId && !currentDiagramBpmnIds.has(dbNode.bpmnId)
      );

      if (nodesToDelete.length > 0) {
        // === SYNC-TEST: Orphan Nodes to Delete ===
        console.log('[SYNC-TEST] 🗑️ DELETING ORPHAN NODES', {
          count: nodesToDelete.length,
          nodes: nodesToDelete.map((n: any) => ({ dbId: n.id, bpmnId: n.bpmnId, name: n.name }))
        });
        const deletePromises = nodesToDelete.map((node: any) => NodeAPI.delete(node.id));
        await Promise.all(deletePromises);
      }

      const refreshedNodes = await NodeAPI.getByProcess(processId);
      setNodes(refreshedNodes);

      // === SYNC-TEST: Save Complete with Sanity Check ===
      const canvasCount = nodeElements.length;
      const dbCount = refreshedNodes.length;
      const sanityPass = canvasCount === dbCount;
      
      console.log('[SYNC-TEST] 💾 SAVE COMPLETE', {
        canvasNodeCount: canvasCount,
        dbNodeCount: dbCount,
        nodesCreatedOrUpdated: syncPromises.length,
        nodesDeleted: nodesToDelete.length,
        sanityCheck: sanityPass ? '✅ PASS (counts match)' : `❌ FAIL (canvas: ${canvasCount}, db: ${dbCount})`,
        dbNodes: refreshedNodes.map((n: any) => ({ dbId: n.id, bpmnId: n.bpmnId, name: n.name }))
      });
      
      if (!sanityPass) {
        console.warn('[SYNC-TEST] ⚠️ SANITY CHECK FAILED: Canvas and DB node counts do not match!');
      }

      addDebugEntry({
        action: 'SAVE_SYNC',
        timestamp: new Date(),
        elementType: 'diagram',
        elementName: processName,
        bpmnId: diagramElementsInfo.find(e => e.dbType === 'process')?.bpmnId || 'Process_Unknown',
        dbId: processId,
        details: `Saved. Canvas: ${canvasCount}, DB: ${dbCount}. Deleted: ${nodesToDelete.length}.`,
      });
      
      setLoadError(null);
      setSaveMessage(`Process "${processName}" saved successfully!`);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
      setSidebarRefreshNonce(n => n + 1);

    } catch (error: any) {
      console.error('[SYNC-TEST] ❌ SAVE FAILED:', error.message || error);
      setLoadError('Failed to save diagram to database. Please check console for details.');
      setShowSaveSuccess(false);
    } finally {
      setIsSavingDiagram(false);
    }
  };

  return {
    modelerRef,
    processName,
    setProcessName,
    processId,
    setProcessId,
    playbookId,
    setPlaybookId,
    playbooks,
    processes,
    playbookProcesses,
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
    lastSavedAt,
    showSavedIndicator,
    isSavingBeforeSwitch,
    timedAutoSave,
    loadingProcessId,
    handleSidebarProcessSelect,
    handleCreateProcessFromSidebar,
    saveXmlOnly,
    syncNodesInBackground,
    cancelPendingSync,
  };
};