'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './page.module.css';
import NavBar from '../../components/NavBar';
import { Modal, Button, Form, Tab, Tabs } from 'react-bootstrap';
import BpmnModelerComponent from '../../components/BpmnModeler';
import { ProcessAPI, NodeAPI, PlaybookAPI } from '../../services/api';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

// Define debugging entry interface
interface DebugEntry {
  action: string;
  timestamp: Date;
  elementType: string;
  elementName: string;
  bpmnId: string;
  dbId?: string;
  details?: string;
}

// Define Playbook interface
interface Playbook {
  id: string;
  name: string;
}

// Define Process interface
interface Process {
  id: string;
  name: string;
  bpmnXml?: string;
  bpmnId?: string;
}

// Define mock user for demo purposes
const DEFAULT_USER = {
  id: 'default-user-id',
  name: 'Demo User',
  email: 'demo@example.com',
  role: 'ADMIN'
};

// Create a client-only modal component to fix hydration issues
const ClientOnlyModal = ({ children, ...props }: React.ComponentProps<typeof Modal>) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null; // Return null on server-side rendering
  }
  
  return <Modal {...props}>{children}</Modal>;
};

export default function ModelerPage() {
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
  
  // Set isClient to true after mounting on the client
  useEffect(() => {
    setIsClient(true);
    
    // Fetch playbooks when component mounts
    fetchPlaybooks();
  }, []);
  
  // Fetch processes when playbook changes
  useEffect(() => {
    if (playbookId) {
      fetchProcessesForPlaybook(playbookId);
    }
  }, [playbookId]);
  
  // Fetch available playbooks
  const fetchPlaybooks = async () => {
    setIsLoadingPlaybooks(true);
    try {
      const fetchedPlaybooks = await PlaybookAPI.getAll();
      console.log("Fetched playbooks:", fetchedPlaybooks);
      
      // Add a default playbook if none exists (for demo purposes)
      if (!fetchedPlaybooks || fetchedPlaybooks.length === 0) {
        try {
          console.log("No playbooks found, creating a default playbook");
          const defaultPlaybook = await PlaybookAPI.create({
            name: 'Default Playbook',
            ownerId: DEFAULT_USER.id,
            shortDescription: 'A default playbook created for demonstration'
          });
          setPlaybooks([defaultPlaybook]);
          setPlaybookId(defaultPlaybook.id);
        } catch (createError) {
          console.error("Error creating default playbook:", createError);
        }
      } else {
        setPlaybooks(fetchedPlaybooks);
        // If there are playbooks, set the first one as default
        if (fetchedPlaybooks.length > 0) {
          setPlaybookId(fetchedPlaybooks[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching playbooks:", error);
      setLoadError("Failed to fetch playbooks. Creating a default one.");
      
      // Try to create a default playbook as fallback
      try {
        const defaultPlaybook = await PlaybookAPI.create({
          name: 'Default Playbook',
          ownerId: DEFAULT_USER.id,
          shortDescription: 'A default playbook created after fetch error'
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

  // Fetch processes for a specific playbook
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
  
  // Helper to add debug entries
  const addDebugEntry = (entry: DebugEntry) => {
    setDebugEntries(prevEntries => [entry, ...prevEntries].slice(0, 50));
  };
  
  // Log any load errors
  useEffect(() => {
    if (loadError) {
      console.error("BPMN Load Error:", loadError);
    }
  }, [loadError]);
  
  // Handle starting a new diagram with a name
  const handleStartNewDiagram = async () => {
    if (!processName.trim() || !playbookId) return;
    
    setIsLoading(true);
    
    try {
      // Check if the selected playbook exists
      console.log("Creating process with playbookId:", playbookId);
      
      // Create process with the selected playbookId
      const newProcess = await ProcessAPI.create({
        name: processName,
        playbookId: playbookId,
      });
      
      setProcessId(newProcess.id);
      setProcesses([newProcess]);
      setShowNameDialog(false);
      
      // Add debug entry
      addDebugEntry({
        action: 'CREATE',
        timestamp: new Date(),
        elementType: 'process',
        elementName: processName,
        bpmnId: 'Process_1',
        dbId: newProcess.id,
        details: `Created initial process in playbook: ${playbookId}`
      });
    } catch (error) {
      console.error("Error creating process:", error);
      setLoadError("Failed to create process. Please check if the playbook exists.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle loading an existing process
  const handleLoadExistingProcess = async () => {
    if (!selectedExistingProcess) return;
    
    setIsLoading(true);
    
    try {
      // Fetch the full process details
      const process = await ProcessAPI.getById(selectedExistingProcess);
      
      setProcessId(process.id);
      setProcessName(process.name);
      setProcesses([process]);
      setShowNameDialog(false);
      
      // Fetch nodes for this process
      const processNodes = await NodeAPI.getByProcess(process.id);
      setNodes(processNodes);
      
      // Add debug entry
      addDebugEntry({
        action: 'LOAD',
        timestamp: new Date(),
        elementType: 'process',
        elementName: process.name,
        bpmnId: process.bpmnId || 'Process_1',
        dbId: process.id,
        details: `Loaded existing process from playbook: ${playbookId}`
      });
    } catch (error) {
      console.error("Error loading process:", error);
      setLoadError("Failed to load process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle element selection
  const handleElementSelect = (element: any, databaseInfo: any) => {
    setSelectedElement({ element, databaseInfo });
    console.log("Selected element:", element.id, "Type:", element.type);
  };
  
  // Save the diagram
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

  // Delete the current process
  const handleDeleteProcess = async () => {
    if (!processId) return;
    
    try {
      await ProcessAPI.delete(processId);
      
      // Reset state and show success message
      setSaveMessage(`Process "${processName}" deleted successfully!`);
      setShowSaveSuccess(true);
      setShowDeleteConfirm(false);
      
      // Reset the process state and show the new process dialog
      setProcessId('');
      setProcessName('');
      setProcesses([]);
      setNodes([]);
      setShowNameDialog(true);
      
      // Refresh processes for the playbook
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
        details: `Deleted process from playbook: ${playbookId}`
      });
    } catch (error) {
      console.error("Error deleting process:", error);
      setLoadError("Failed to delete process");
    }
  };
  
  // Handle element creation
  const handleElementCreate = async (data: any) => {
    console.log('Creating element:', data);
    
    try {
      if (data.type === 'process') {
        // Create process in the database
        const newProcess = await ProcessAPI.create({
          name: data.data.name || 'New Process',
          playbookId: playbookId,
          bpmnId: data.data.bpmnId,
          bpmnXml: data.data.bpmnXml || null
        });
        
        // Add to processes state
        setProcesses(prev => [...prev, newProcess]);
        
        addDebugEntry({
          action: 'CREATE',
          timestamp: new Date(),
          elementType: 'process',
          elementName: data.data.name || 'New Process',
          bpmnId: data.data.bpmnId,
          dbId: newProcess.id
        });
        
        return newProcess;
      } else {
        // Create node in the database
        const newNode = await NodeAPI.create({
          name: data.data.name || 'New Node',
          type: data.data.type,
          processId: processId,
          bpmnId: data.data.bpmnId
        });
        
        // Add to nodes state
        setNodes(prev => [...prev, newNode]);
        
        addDebugEntry({
          action: 'CREATE',
          timestamp: new Date(),
          elementType: data.data.type,
          elementName: data.data.name || 'New Node',
          bpmnId: data.data.bpmnId,
          dbId: newNode.id
        });
        
        return newNode;
      }
    } catch (error) {
      console.error('Error creating element:', error);
      throw error;
    }
  };
  
  // Handle element update
  const handleElementUpdate = async (data: any) => {
    console.log('Updating element:', data);
    
    try {
      if (data.type === 'process') {
        // Update process in database
        const updatedProcess = await ProcessAPI.update({
          id: data.id,
          ...data.data
        });
        
        // Update processes state
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
          details: `Updated: ${Object.keys(data.data).join(', ')}`
        });
        
        return updatedProcess;
      } else {
        // Update node in database
        const updatedNode = await NodeAPI.update({
          id: data.id,
          ...data.data
        });
        
        // Update nodes state
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
          details: `Updated: ${Object.keys(data.data).join(', ')}`
        });
        
        return updatedNode;
      }
    } catch (error) {
      console.error('Error updating element:', error);
      throw error;
    }
  };
  
  // Handle element deletion
  const handleElementDelete = async (data: any) => {
    console.log('Deleting element:', data);
    
    try {
      if (data.type === 'process') {
        // Delete process from database
        await ProcessAPI.delete(data.id);
        
        // Update processes state
        setProcesses(prev => 
          prev.filter(p => p.id !== data.id)
        );
      } else {
        // Delete node from database
        await NodeAPI.delete(data.id);
        
        // Update nodes state
        setNodes(prev => 
          prev.filter(n => n.id !== data.id)
        );
      }
      
      addDebugEntry({
        action: 'DELETE',
        timestamp: new Date(),
        elementType: data.type,
        elementName: 'Deleted Element',
        bpmnId: 'N/A',
        dbId: data.id
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting element:', error);
      throw error;
    }
  };
  
  // Handle diagram save success
  const handleSaveSuccess = async (xml: string, databaseMappings: any[]) => {
    console.log('Saving diagram XML:', xml.substring(0, 100) + '...');
    
    try {
      // Update the process with the latest BPMN XML
      if (processId) {
        const updatedProcess = await ProcessAPI.update({
          id: processId,
          bpmnXml: xml
        });
        
        // Update process in state
        setProcesses(prev => 
          prev.map(p => p.id === processId ? { ...p, bpmnXml: xml } : p)
        );
      }
      
      // Update any changed BPMN IDs in database
      for (const mapping of databaseMappings) {
        if (mapping.dbType === 'process') {
          await ProcessAPI.update({
            id: mapping.dbId,
            bpmnId: mapping.bpmnId
          });
        } else {
          await NodeAPI.update({
            id: mapping.dbId,
            bpmnId: mapping.bpmnId
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
        details: `Saved diagram with ${databaseMappings.length} mapped elements`
      });
      
      setSaveMessage(`Process "${processName}" saved successfully!`);
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving diagram:', error);
      setLoadError('Failed to save diagram to database');
    }
  };
  
  // Format timestamp for display
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };
  
  // Get status badge class based on action
  const getStatusBadgeClass = (action: string) => {
    switch (action) {
      case 'CREATE': return styles.createBadge;
      case 'UPDATE': return styles.updateBadge;
      case 'DELETE': return styles.deleteBadge;
      case 'SAVE': return styles.saveBadge;
      case 'LOAD': return styles.loadBadge;
      default: return '';
    }
  };

  return (
    <div className="page-container">
      <NavBar />
      <main className={`${styles.main} pt-4`}>
        <h1 className={styles.title}>BPMN Process Modeler</h1>
        <p className={styles.description}>
          Create and edit BPMN diagrams with database integration
        </p>
        
        {/* Process Selection Dialog */}
        {isClient && (
          <ClientOnlyModal show={showNameDialog} backdrop="static" keyboard={false}>
            <Modal.Header>
              <Modal.Title>BPMN Process Modeler</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {isLoadingPlaybooks ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading playbooks...</p>
                </div>
              ) : (
                <>
                  {playbooks.length > 0 ? (
                    <Form.Group className="mb-3">
                      <Form.Label>Select a playbook:</Form.Label>
                      <Form.Select
                        value={playbookId}
                        onChange={(e) => setPlaybookId(e.target.value)}
                      >
                        {playbooks.map(pb => (
                          <option key={pb.id} value={pb.id}>{pb.name}</option>
                        ))}
                      </Form.Select>
                      <div className="text-muted small mt-1">
                        Total playbooks: {playbooks.length}
                      </div>
                    </Form.Group>
                  ) : (
                    <div className="alert alert-warning">
                      No playbooks available. Creating a default playbook...
                    </div>
                  )}
                  
                  <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => k && setActiveTab(k)}
                    className="mb-3"
                  >
                    <Tab eventKey="new" title="Create New Process">
                      <Form.Group className="mb-3">
                        <Form.Label>Enter a name for your new process:</Form.Label>
                        <Form.Control
                          type="text"
                          value={processName}
                          onChange={(e) => setProcessName(e.target.value)}
                          placeholder="My Business Process"
                          autoFocus
                          disabled={!playbookId}
                        />
                      </Form.Group>
                      <Button 
                        variant="primary" 
                        className="w-100"
                        onClick={handleStartNewDiagram} 
                        disabled={!processName.trim() || !playbookId || isLoading || isLoadingPlaybooks}
                      >
                        {isLoading ? 'Creating...' : 'Create New Process'}
                      </Button>
                    </Tab>
                    <Tab eventKey="load" title="Load Existing Process">
                      {isLoadingProcesses ? (
                        <div className="text-center my-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="mt-2">Loading processes...</p>
                        </div>
                      ) : playbookProcesses.length > 0 ? (
                        <>
                          <Form.Group className="mb-3">
                            <Form.Label>Select an existing process:</Form.Label>
                            <Form.Select
                              value={selectedExistingProcess}
                              onChange={(e) => setSelectedExistingProcess(e.target.value)}
                            >
                              <option value="">-- Select a process --</option>
                              {playbookProcesses.map(proc => (
                                <option key={proc.id} value={proc.id}>{proc.name}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                          <Button 
                            variant="primary" 
                            className="w-100"
                            onClick={handleLoadExistingProcess} 
                            disabled={!selectedExistingProcess || isLoading}
                          >
                            {isLoading ? 'Loading...' : 'Load Process'}
                          </Button>
                        </>
                      ) : (
                        <div className="alert alert-info">
                          No processes available in this playbook. Create a new one instead.
                        </div>
                      )}
                    </Tab>
                  </Tabs>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
              <div className="text-muted small">
                {activeTab === 'new' ? 'Creating a new process...' : 'Loading an existing process...'}
              </div>
            </Modal.Footer>
          </ClientOnlyModal>
        )}
        
        {/* Delete Confirmation Modal */}
        {isClient && (
          <ClientOnlyModal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="alert alert-danger">
                <p>Are you sure you want to delete the process "{processName}"?</p>
                <p>This action cannot be undone and all associated data will be permanently removed.</p>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteProcess}>
                Delete Process
              </Button>
            </Modal.Footer>
          </ClientOnlyModal>
        )}
        
        {/* Save Success Alert */}
        {showSaveSuccess && (
          <div className={styles.successAlert}>
            <span>{saveMessage}</span>
          </div>
        )}
        
        {/* Error Panel */}
        {loadError && (
          <div className={styles.errorPanel}>
            <h3>Error Loading Diagram</h3>
            <p>{loadError}</p>
          </div>
        )}
        
        {/* Process Viewer and Debug Panel */}
        {processId && !showNameDialog && (
          <>
            <div className={styles.processHeader}>
              <h2>{processName}</h2>
              <div className={styles.processInfo}>
                <span>Process ID: {processId}</span>
                <span>Playbook: {playbooks.find(p => p.id === playbookId)?.name || playbookId}</span>
                <span>Nodes: {nodes.length}</span>
              </div>
            </div>
            
            <div className={styles.modelerWrapper}>
              {/* BPMN Modeler Component */}
              <BpmnModelerComponent
                ref={modelerRef}
                processes={processes}
                nodes={nodes}
                onElementSelect={handleElementSelect}
                onElementCreate={handleElementCreate}
                onElementUpdate={handleElementUpdate}
                onElementDelete={handleElementDelete}
                onSave={handleSaveSuccess}
                onError={(error) => setLoadError(error)}
                playbookId={playbookId}
                processId={processId}
              />
              
              <div className={styles.actionsBar}>
                <button 
                  className={styles.saveButton} 
                  onClick={handleSaveDiagram}
                >
                  Save Diagram
                </button>
                <button 
                  className={styles.deleteButton} 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Process
                </button>
              </div>
            </div>
            
            <div className={styles.debugSection}>
              <div className={styles.debugHeader}>
                <h2>Database Operations Log</h2>
                <p>Track changes to BPMN elements in the database</p>
              </div>
              
              {/* Selected Element Panel */}
              {selectedElement && (
                <div className={styles.selectedElement}>
                  <h3>Selected Element</h3>
                  <div className={styles.elementDetails}>
                    <div><strong>Type:</strong> {selectedElement.element.type}</div>
                    <div><strong>BPMN ID:</strong> {selectedElement.element.id}</div>
                    <div>
                      <strong>Name:</strong> {
                        selectedElement.element.businessObject?.name || 'Unnamed'
                      }
                    </div>
                    {selectedElement.databaseInfo && (
                      <div>
                        <strong>Database ID:</strong> {selectedElement.databaseInfo.id}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Operations Log Table */}
              <div className={styles.debugTable}>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>Type</th>
                      <th>Element Name</th>
                      <th>BPMN ID</th>
                      <th>Database ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debugEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={styles.emptyState}>
                          No database operations yet. Try adding or modifying elements.
                        </td>
                      </tr>
                    ) : (
                      debugEntries.map((entry, index) => (
                        <tr key={index}>
                          <td>{formatTimestamp(entry.timestamp)}</td>
                          <td>
                            <span className={`${styles.badge} ${getStatusBadgeClass(entry.action)}`}>
                              {entry.action}
                            </span>
                          </td>
                          <td>{entry.elementType}</td>
                          <td>{entry.elementName}</td>
                          <td>{entry.bpmnId !== 'N/A' ? entry.bpmnId.substring(0, 8) + '...' : 'N/A'}</td>
                          <td>{entry.dbId || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Database Stats */}
              <div className={styles.databaseStats}>
                <div className={styles.statCard}>
                  <h4>Processes</h4>
                  <div className={styles.statValue}>{processes.length}</div>
                </div>
                <div className={styles.statCard}>
                  <h4>Nodes</h4>
                  <div className={styles.statValue}>{nodes.length}</div>
                </div>
                <div className={styles.statCard}>
                  <h4>Database Operations</h4>
                  <div className={styles.statValue}>{debugEntries.length}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

