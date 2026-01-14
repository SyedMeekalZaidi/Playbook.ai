'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
// Import the production build which includes all necessary modules
import BpmnModeler from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import DatabaseIntegrationModule from '../modules/DatabaseIntegration';

// Define types for database entities
interface Process {
  id: string;
  name: string;
  bpmnXml?: string | null;
  bpmnId?: string | null;
}

interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
  bpmnId?: string;
}

interface BpmnModelerProps {
  xml?: string;
  onSave?: (xml: string, databaseMappings: any) => void;
  onElementSelect?: (element: any, databaseInfo: any) => void;
  onElementCreate?: (elementData: any) => Promise<any>;
  onElementUpdate?: (elementData: any) => Promise<any>;
  onElementDelete?: (elementData: any) => Promise<any>;
  onError?: (error: string) => void;
  processes?: Process[];
  nodes?: Node[];
  playbookId?: string;
  processId?: string;
}

interface BpmnModelerRef {
  getModeler: () => any;
  saveDiagram: () => Promise<void>;
  getSelectedElementInfo: () => { element: any; databaseInfo: any } | null;
  getXml: () => Promise<string>;
  getDiagramElements: () => any[];
}

const BpmnModelerComponent = forwardRef<BpmnModelerRef, BpmnModelerProps>((props, ref) => {
  const {
    xml,
    onSave,
    onElementSelect,
    onElementCreate,
    onElementUpdate,
    onElementDelete,
    onError,
    processes = [],
    nodes = [],
    playbookId,
    processId,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [modeler, setModeler] = useState<any>(null);
  const [databaseIntegration, setDatabaseIntegration] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedElementDbInfo, setSelectedElementDbInfo] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Refs for callbacks - ensures we always call the latest version (fixes stale closure bug)
  const onSaveRef = useRef(onSave);
  const onErrorRef = useRef(onError);
  
  // Keep refs in sync with props (runs on every render, but refs don't cause re-renders)
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  
  // Debug flag
  const [debug, setDebug] = useState(true);
  
  const debugLog = (message: string, data?: any) => {
    if (debug) {
      if (data) {
        console.log(`[BpmnModeler] ${message}`, data);
      } else {
        console.log(`[BpmnModeler] ${message}`);
      }
    }
  };

  // Initialize modeler when component mounts
  useEffect(() => {
    if (!containerRef.current) return;
    
    debugLog('Initializing BPMN modeler');
    
    try {
      // Create a new modeler instance with database integration module
      const bpmnModeler = new BpmnModeler({
        container: containerRef.current,
        additionalModules: [
          DatabaseIntegrationModule
        ]
      });
      
      setModeler(bpmnModeler);
      
      // Get the database integration module instance
      const dbIntegration = bpmnModeler.get('databaseIntegration');
      setDatabaseIntegration(dbIntegration);
      
      debugLog('BPMN modeler initialized successfully');
      
      // Clean up on unmount
      return () => {
        debugLog('Destroying BPMN modeler');
        if (bpmnModeler) {
          bpmnModeler.destroy();
        }
      };
    } catch (err: any) {
      console.error('Error initializing BPMN modeler:', err);
      if (onError) {
        onError(`Failed to initialize modeler: ${err.message || 'Unknown error'}`);
      }
    }
  }, []);

  // Set up database integration when modeler and dependencies are ready
  useEffect(() => {
    if (!modeler || !databaseIntegration || !processId) return;
    
    debugLog('Setting up database integration');
    
    // Set database entities
    databaseIntegration.setDatabaseEntities(processes, nodes);
    
    // Set context
    databaseIntegration.setContext(playbookId || null, processId);
    
    // Set callbacks
    databaseIntegration.setDatabaseCallbacks({
      onElementCreate,
      onElementUpdate,
      onElementDelete
    });
    
    // Listen for element selection
    const eventBus = modeler.get('eventBus');
    eventBus.on('database.element.selected', (event: any) => {
      setSelectedElement(event.element);
      setSelectedElementDbInfo(event.databaseInfo);
      
      if (onElementSelect) {
        onElementSelect(event.element, event.databaseInfo);
      }
    });
    
  }, [modeler, databaseIntegration, processes, nodes, playbookId, processId]);

  // Create a new diagram when modeler is ready or load existing XML
  useEffect(() => {
    if (!modeler || !databaseIntegration || !processId) return;
    
    debugLog('Effect: Checking for existing BPMN diagram to load or create new.');
    debugLog('[DEBUG LOAD] Effect triggered with:', { 
      processId, 
      processesCount: processes.length, 
      nodesCount: nodes.length,
      nodesArray: nodes.map(n => ({ id: n.id, bpmnId: n.bpmnId, name: n.name }))
    });
    
    const process = processes.find(p => p.id === processId);
    
    if (process && process.bpmnXml && process.bpmnXml.trim() !== '') {
      debugLog('Effect: Loading existing BPMN diagram from XML', { processId, xmlLength: process.bpmnXml.length });
      debugLog('[DEBUG LOAD] About to import XML. Nodes available:', nodes.length);
      
      modeler.importXML(process.bpmnXml)
        .then(() => {
          debugLog('Effect: Existing diagram loaded successfully');
          debugLog('[DEBUG LOAD] XML imported. Nodes in state:', nodes.length);
          const canvas = modeler.get('canvas');
          canvas.zoom('fit-viewport');
          
          if (databaseIntegration) {
            debugLog('Effect: Syncing database elements with diagram after import');
            debugLog('[DEBUG LOAD] Calling syncDatabaseElements with nodes.length:', nodes.length);
            if (typeof databaseIntegration.syncDatabaseElements === 'function') {
              databaseIntegration.syncDatabaseElements();
            } else {
              console.warn('[BpmnModeler] databaseIntegration.syncDatabaseElements is not a function.');
            }
          }
        })
        .catch((err: any) => {
          console.error('Effect: Error importing existing diagram, attempting to create new as fallback:', err);
          // Fallback to new diagram, but don't call props.onError for this specific failure path
          // as it might be a post-save refresh that failed to load.
          createNewDiagram(true); // Pass true to indicate it's a fallback from import error
        });
    } else {
      debugLog('Effect: No existing XML found for current processId or process not found, creating new diagram');
      // This is an initial creation or when process has no XML. Errors here are more critical.
      createNewDiagram(false); 
    }
  }, [modeler, databaseIntegration, processId, processes]);
  
  // Create a new diagram
  const createNewDiagram = async (isFallbackFromImportError: boolean) => {
    if (!modeler) return;
    
    debugLog(`Effect: Creating new BPMN diagram. Is fallback from import error: ${isFallbackFromImportError}`);
    
    try {
      await modeler.createDiagram();
      const canvas = modeler.get('canvas');
      canvas.zoom('fit-viewport');
      debugLog('Effect: New diagram created successfully');
    } catch (err: any) {
      console.error('Effect: Error creating new BPMN diagram:', err);
      if (onError && !isFallbackFromImportError) { // Only call onError if not a fallback from an import error
        onError(`Failed to create new diagram: ${err.message || 'Unknown error'}`);
      }
    }
  };
  
  // Save the diagram - uses refs to ensure latest callbacks are called
  const saveDiagram = async () => {
    if (!modeler || !databaseIntegration) {
      debugLog('Cannot save: modeler not initialized');
      throw new Error('Modeler not initialized');
    }
    
    debugLog('Saving diagram');
    setIsSaving(true);
    
    try {
      const { xml } = await modeler.saveXML({ format: true });
      const diagramElementsInfo = databaseIntegration.getDiagramElementsInfo();
      
      debugLog('Diagram elements info collected:', { 
        xmlLength: xml.length,
        mappingsCount: diagramElementsInfo.length
      });
      
      // Use ref to call latest onSave callback (fixes stale closure bug)
      if (onSaveRef.current) {
        await onSaveRef.current(xml, diagramElementsInfo);
      }
      
      return xml;
    } catch (err: any) {
      console.error('Error saving diagram in BpmnModelerComponent:', err);
      // Use ref to call latest onError callback
      if (onErrorRef.current) {
        onErrorRef.current(`Failed to save diagram: ${err.message || 'Unknown error'}`);
      }
      throw err;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get selected element info
  const getSelectedElementInfo = () => {
    if (!selectedElement) return null;
    
    return {
      element: selectedElement,
      databaseInfo: selectedElementDbInfo
    };
  };
  
  // Get XML only (for quick saves during process switching)
  const getXml = async (): Promise<string> => {
    if (!modeler) {
      throw new Error('Modeler not initialized');
    }
    const { xml } = await modeler.saveXML({ format: true });
    return xml;
  };
  
  // Get diagram elements info (for background sync)
  const getDiagramElements = () => {
    if (!databaseIntegration) {
      return [];
    }
    return databaseIntegration.getDiagramElementsInfo();
  };
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getModeler: () => modeler,
    saveDiagram,
    getSelectedElementInfo,
    getXml,
    getDiagramElements,
  }), [modeler, databaseIntegration, selectedElement, selectedElementDbInfo]);
  
  return (
    <div className="bpmn-modeler-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
});

// Set display name for easier debugging
BpmnModelerComponent.displayName = 'BpmnModelerComponent';

export default BpmnModelerComponent;