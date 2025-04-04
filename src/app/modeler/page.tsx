'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './page.module.css';
import NavBar from '../../components/NavBar';
import { Modal, Button, Form } from 'react-bootstrap';
import BpmnModelerComponent from '../../components/BpmnModeler';
import { ProcessAPI, NodeAPI } from '../../services/api';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

// Define debugging entry interface
interface DebugEntry {
  timestamp: Date;
  elementType: string;
  elementName: string;
  bpmnId: string;
  dbId?: string;
  details?: string;
}

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
  const [playbookId, setPlaybookId] = useState<string>('demo-playbook-id');
  const [processes, setProcesses] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [debugEntries, setDebugEntries] = useState<DebugEntry[]>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState<boolean>(true);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after mounting on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
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
  const handleStartNewDiagram = () => {
    if (!processName.trim()) return;
    
    const newProcessId = `process-${Date.now()}`; // Generate stable ID
    console.log("Starting new diagram with process ID:", newProcessId);
    
    // Create initial process
    const initialProcess = {
      id: newProcessId,
      name: processName,
      playbookId: playbookId,
      bpmnXml: null
    };
    
    setProcessId(newProcessId);
    setProcesses([initialProcess]);
    setShowNameDialog(false);
    
    // Add debug entry
    addDebugEntry({
      action: 'CREATE',
      timestamp: new Date(),
      elementType: 'process',
      elementName: processName,
      bpmnId: 'Process_1',
      dbId: newProcessId,
      details: 'Created initial process'
    });
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
  
  // Handle element creation
  const handleElementCreate = async (data: any) => {
    console.log('Creating element:', data);
    
    try {
      // Generate a new ID as if it came from the database
      const newId = `db-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      if (data.type === 'process') {
        // Add to processes state
        const newProcess = {
          id: newId,
          name: data.data.name || 'New Process',
          playbookId: playbookId,
          bpmnId: data.data.bpmnId,
          bpmnXml: data.data.bpmnXml
        };
        
        setProcesses(prev => [...prev, newProcess]);
        
        addDebugEntry({
          action: 'CREATE',
          timestamp: new Date(),
          elementType: 'process',
          elementName: data.data.name || 'New Process',
          bpmnId: data.data.bpmnId,
          dbId: newId
        });
        
        return {
          ...data.data,
          id: newId,
          bpmnId: data.data.bpmnId
        };
      } else {
        // Add to nodes state
        const newNode = { 
          id: newId,
          name: data.data.name || 'New Node',
          type: data.data.type,
          processId: processId,
          bpmnId: data.data.bpmnId 
        };
        
        setNodes(prev => [...prev, newNode]);
        
        addDebugEntry({
          action: 'CREATE',
          timestamp: new Date(),
          elementType: data.data.type,
          elementName: data.data.name || 'New Node',
          bpmnId: data.data.bpmnId,
          dbId: newId
        });
        
        return {
          ...data.data,
          id: newId,
          bpmnId: data.data.bpmnId
        };
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
        setProcesses(prev => 
          prev.map(p => p.id === data.id ? { ...p, ...data.data } : p)
        );
      } else {
        setNodes(prev => 
          prev.map(n => n.id === data.id ? { ...n, ...data.data } : n)
        );
      }
      
      addDebugEntry({
        action: 'UPDATE',
        timestamp: new Date(),
        elementType: data.type,
        elementName: data.data.name || 'Unnamed Element',
        bpmnId: 'N/A', // We don't always have this in updates
        dbId: data.id,
        details: `Updated: ${Object.keys(data.data).join(', ')}`
      });
      
      return {
        success: true,
        id: data.id
      };
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
        setProcesses(prev => 
          prev.filter(p => p.id !== data.id)
        );
      } else {
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
  const handleSaveSuccess = (xml: string, databaseMappings: any[]) => {
    console.log('Saving diagram XML:', xml.substring(0, 100) + '...');
    
    // Update the process with the latest BPMN XML
    setProcesses(prev => 
      prev.map(p => p.id === processId ? { ...p, bpmnXml: xml } : p)
    );
    
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
      default: return '';
    }
  };

  return (
    <div>
      <NavBar />
      <main className={styles.main}>
        <h1 className={styles.title}>BPMN Process Modeler</h1>
        <p className={styles.description}>
          Create and edit BPMN diagrams with database integration
        </p>
        
        {/* Process Name Dialog */}
        {isClient && (
          <ClientOnlyModal show={showNameDialog} backdrop="static" keyboard={false}>
            <Modal.Header>
              <Modal.Title>New BPMN Diagram</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Enter a name for your process:</Form.Label>
                <Form.Control
                  type="text"
                  value={processName}
                  onChange={(e) => setProcessName(e.target.value)}
                  placeholder="My Business Process"
                  autoFocus
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={handleStartNewDiagram} disabled={!processName.trim()}>
                Create Diagram
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

