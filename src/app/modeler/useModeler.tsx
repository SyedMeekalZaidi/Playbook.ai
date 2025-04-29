import { useRef, useState, useEffect } from 'react';
import { ProcessAPI, NodeAPI, PlaybookAPI } from '../../services/api';
import { DebugEntry, Playbook, Process, User } from './interfaces';

const DEFAULT_USER: User = {
  id: 'default-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'ADMIN',
};

export const useModeler = () => {
  const modelerRef = useRef<any>(null);
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

  useEffect(() => {
    setIsClient(true);
    fetchPlaybooks();
  }, []);

  useEffect(() => {
    if (playbookId) {
      fetchProcessesForPlaybook(playbookId);
    }
  }, [playbookId]);

  useEffect(() => {
    if (loadError) {
      console.error("BPMN Load Error:", loadError);
    }
  }, [loadError]);

  const fetchPlaybooks = async () => {
    setIsLoadingPlaybooks(true);
    try {
      const fetchedPlaybooks = await PlaybookAPI.getAll();
      console.log("Fetched playbooks:", fetchedPlaybooks);

      if (!fetchedPlaybooks || fetchedPlaybooks.length === 0) {
        console.log("No playbooks found, creating a default playbook");
        const defaultPlaybook = await PlaybookAPI.create({
          name: 'Default Playbook',
          ownerId: DEFAULT_USER.id,
          shortDescription: 'A default playbook created for demonstration',
        });
        setPlaybooks([defaultPlaybook]);
        setPlaybookId(defaultPlaybook.id);
      } else {
        setPlaybooks(fetchedPlaybooks);
        if (fetchedPlaybooks.length > 0) {
          setPlaybookId(fetchedPlaybooks[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      setLoadError("Failed to fetch playbooks. Creating a default one.");
      try {
        const defaultPlaybook = await PlaybookAPI.create({
          name: 'Default Playbook',
          ownerId: DEFAULT_USER.id,
          shortDescription: 'A default playbook created after fetch error',
        });
        setPlaybooks([defaultPlaybook]);
        setPlaybookId(defaultPlaybook.id);
      } catch (createError) {
        console.error("Error creating fallback playbook:", createError);
        setLoadError("Failed to create a default playbook. Please refresh the page or contact support.");
      }
    } finally {
      setIsLoadingPlaybooks(false);
    }
  };

  const fetchProcessesForPlaybook = async (playbookId: string) => {
    setIsLoadingProcesses(true);
    try {
      const fetchedProcesses = await ProcessAPI.getByPlaybook(playbookId);
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
    if (!processName.trim() || !playbookId) return;

    setIsLoading(true);
    try {
      console.log("Creating process with playbookId:", playbookId);
      const newProcess = await ProcessAPI.create({
        name: processName,
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

      addDebugEntry({
        action: 'LOAD',
        timestamp: new Date(),
        elementType: 'process',
        elementName: process.name,
        bpmnId: process.bpmnId || 'Process_1',
        dbId: process.id,
        details: `Loaded existing process from playbook: ${playbookId}`,
      });
    } catch (error) {
      console.error("Error loading process:", error);
      setLoadError("Failed to load process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleElementSelect = (element: any, databaseInfo: any) => {
    setSelectedElement({ element, databaseInfo });
    console.log("Selected element:", element.id, "Type:", element.type);
  };

  const handleSaveDiagram = async () => {
    if (!modelerRef.current) return;

    try {
      await modelerRef.current.saveDiagram();
      setSaveMessage(`Process "${processName}" saved successfully!`);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving diagram:", error);
      setLoadError("Failed to save diagram");
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
    } catch (error) {
      console.error("Error deleting process:", error);
      setLoadError("Failed to delete process");
    }
  };

  const handleElementCreate = async (data: any) => {
    console.log('Creating element:', data);
    try {
      if (data.type === 'process') {
        const newProcess = await ProcessAPI.create({
          name: data.data.name || 'New Process',
          playbookId: playbookId,
          bpmnId: data.data.bpmnId,
          bpmnXml: data.data.bpmnXml || null,
        });

        setProcesses(prev => [...prev, newProcess]);

        addDebugEntry({
          action: 'CREATE',
          timestamp: new Date(),
          elementType: 'process',
          elementName: data.data.name || 'New Process',
          bpmnId: data.data.bpmnId,
          dbId: newProcess.id,
        });

        return newProcess;
      } else {
        const newNode = await NodeAPI.create({
          name: data.data.name || 'New Node',
          type: data.data.type,
          processId: processId,
          bpmnId: data.data.bpmnId,
        });

        setNodes(prev => [...prev, newNode]);

        addDebugEntry({
          action: 'CREATE',
          timestamp: new Date(),
          elementType: data.data.type,
          elementName: data.data.name || 'New Node',
          bpmnId: data.data.bpmnId,
          dbId: newNode.id,
        });

        return newNode;
      }
    } catch (error) {
      console.error('Error creating element:', error);
      throw error;
    }
  };

  const handleElementUpdate = async (data: any) => {
    console.log('Updating element:', data);
    try {
      if (data.type === 'process') {
        const updatedProcess = await ProcessAPI.update({
          id: data.id,
          ...data.data,
        });

        setProcesses(prev =>
          prev.map(p => p.id === data.id ? { ...p, ...data.data } : p)
        );

        addDebugEntry({
          action: 'UPDATE',
          timestamp: new Date(),
          elementType: data.type,
          elementName: data.data.name || 'Unnamed Process',
          bpmnId: 'N/A',
          dbId: data.id,
          details: `Updated: ${Object.keys(data.data).join(', ')}`,
        });

        return updatedProcess;
      } else {
        const updatedNode = await NodeAPI.update({
          id: data.id,
          ...data.data,
        });

        setNodes(prev =>
          prev.map(n => n.id === data.id ? { ...n, ...data.data } : n)
        );

        addDebugEntry({
          action: 'UPDATE',
          timestamp: new Date(),
          elementType: data.type,
          elementName: data.data.name || 'Unnamed Element',
          bpmnId: 'N/A',
          dbId: data.id,
          details: `Updated: ${Object.keys(data.data).join(', ')}`,
        });

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
        setNodes(prev => prev.filter(n => n.id !== data.id));
      }

      addDebugEntry({
        action: 'DELETE',
        timestamp: new Date(),
        elementType: data.type,
        elementName: 'Deleted Element',
        bpmnId: 'N/A',
        dbId: data.id,
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting element:', error);
      throw error;
    }
  };

  const handleSaveSuccess = async (xml: string, databaseMappings: any[]) => {
    console.log('Saving diagram XML:', xml.substring(0, 100) + '...');
    try {
      if (processId) {
        const updatedProcess = await ProcessAPI.update({
          id: processId,
          bpmnXml: xml,
        });

        setProcesses(prev =>
          prev.map(p => p.id === processId ? { ...p, bpmnXml: xml } : p)
        );
      }

      for (const mapping of databaseMappings) {
        if (mapping.dbType === 'process') {
          await ProcessAPI.update({
            id: mapping.dbId,
            bpmnId: mapping.bpmnId,
          });
        } else {
          await NodeAPI.update({
            id: mapping.dbId,
            bpmnId: mapping.bpmnId,
          });
        }
      }

      addDebugEntry({
        action: 'SAVE',
        timestamp: new Date(),
        elementType: 'diagram',
        elementName: processName,
        bpmnId: 'Process_1',
        dbId: processId,
        details: `Saved diagram with ${databaseMappings.length} mapped elements`,
      });

      setSaveMessage(`Process "${processName}" saved successfully!`);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving diagram:', error);
      setLoadError('Failed to save diagram to database');
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
  };
};