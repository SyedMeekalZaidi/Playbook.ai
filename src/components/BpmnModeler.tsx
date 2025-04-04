'use client';

import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
// Import the production build which includes all necessary modules
import BpmnModeler from 'bpmn-js/dist/bpmn-modeler.production.min.js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';

// Define types for database entities
interface Process {
  id: string;
  name: string;
  bpmnXml?: string;
  bpmnId?: string;
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
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedElementDbInfo, setSelectedElementDbInfo] = useState<any>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
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
      // Create a new modeler instance
      const bpmnModeler = new BpmnModeler({
        container: containerRef.current
      });
      
      setModeler(bpmnModeler);
      
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

  // Create a new diagram when modeler is ready or load existing XML
  useEffect(() => {
    if (!modeler) return;
    
    // Check if there's an existing diagram to load
    const process = processes.find(p => p.id === processId);
    if (process && process.bpmnXml) {
      debugLog('Loading existing BPMN diagram');
      
      try {
        modeler.importXML(process.bpmnXml).then(() => {
          debugLog('Existing diagram loaded successfully');
          const canvas = modeler.get('canvas');
          canvas.zoom('fit-viewport');
          
          // Set up event listeners
          setupEventListeners();
          
          // Update DB IDs in diagram
          mapDatabaseNodesToBpmnElements();
        }).catch((err: any) => {
          console.error('Error importing existing diagram:', err);
          createNewDiagram();
        });
      } catch (error) {
        console.error('Error importing XML:', error);
        createNewDiagram();
      }
    } else {
      createNewDiagram();
    }
  }, [modeler, processes, processId]);
  
  // Create a new diagram
  const createNewDiagram = async () => {
    if (!modeler) return;
    
    debugLog('Creating new BPMN diagram');
    
    try {
      // Create empty diagram
      await modeler.createDiagram();
      
      // Set up event listeners
      setupEventListeners();
      
      // Zoom to fit the canvas
      const canvas = modeler.get('canvas');
      canvas.zoom('fit-viewport');
      
      debugLog('New diagram created successfully');
    } catch (err: any) {
      console.error('Error creating new BPMN diagram:', err);
      if (onError) {
        onError(`Failed to create new diagram: ${err.message || 'Unknown error'}`);
      }
    }
  };

  // Map database nodes to BPMN elements
  const mapDatabaseNodesToBpmnElements = () => {
    if (!modeler) return;
    
    debugLog('Mapping database nodes to BPMN elements');
    
    const elementRegistry = modeler.get('elementRegistry');
    const modeling = modeler.get('modeling');
    
    // Connect all nodes that have BPMN IDs
    nodes.forEach(node => {
      if (node.bpmnId) {
        const element = elementRegistry.get(node.bpmnId);
        if (element) {
          modeling.updateProperties(element, {
            dbId: node.id,
            dbType: 'node'
          });
          debugLog(`Mapped node ${node.id} to BPMN element ${node.bpmnId}`);
        }
      }
    });
    
    // Connect process if it has a BPMN ID
    processes.forEach(process => {
      if (process.bpmnId) {
        const element = elementRegistry.get(process.bpmnId);
        if (element) {
          modeling.updateProperties(element, {
            dbId: process.id,
            dbType: 'process'
          });
          debugLog(`Mapped process ${process.id} to BPMN element ${process.bpmnId}`);
        }
      }
    });
  };

  // Set up event listeners
  const setupEventListeners = () => {
    if (!modeler) return;
    
    debugLog('Setting up event listeners');
    
    const eventBus = modeler.get('eventBus');
    
    // Listen for selection changes
    eventBus.on('selection.changed', (e: any) => {
      const { newSelection } = e;
      
      if (newSelection.length === 1) {
        const selectedShape = newSelection[0];
        setSelectedElement(selectedShape);
        
        // Get database info for this element
        const dbInfo = getDatabaseInfoForElement(selectedShape);
        setSelectedElementDbInfo(dbInfo);
        
        if (onElementSelect) {
          onElementSelect(selectedShape, dbInfo);
        }
        
        debugLog('Element selected:', { id: selectedShape.id, type: selectedShape.type });
      } else {
        setSelectedElement(null);
        setSelectedElementDbInfo(null);
      }
    });
    
    // Listen for element creation
    eventBus.on('shape.added', (e: any) => {
      const element = e.element;
      
      // Skip if this is a connection
      if (element.type === 'bpmn:SequenceFlow') return;
      
      // Wait a bit to ensure business object is fully created
      setTimeout(() => {
        handleElementCreated(element);
      }, 50);
    });
    
    // Listen for connection creation
    eventBus.on('connection.added', (e: any) => {
      const element = e.element;
      
      // Wait a bit to ensure business object is fully created
      setTimeout(() => {
        handleElementCreated(element);
      }, 50);
    });
    
    // Listen for element updates
    eventBus.on('element.changed', (e: any) => {
      const element = e.element;
      handleElementUpdated(element);
    });
    
    // Listen for element deletion
    eventBus.on('shape.remove', (e: any) => {
      const element = e.element;
      handleElementRemoved(element);
    });
    
    // Listen for connection deletion
    eventBus.on('connection.remove', (e: any) => {
      const element = e.element;
      handleElementRemoved(element);
    });
    
    debugLog('Event listeners registered');
  };
  
  // Handler for element creation
  const handleElementCreated = async (element: any) => {
    // Skip if we're in the process of importing a diagram
    if (isSaving) return;
    
    if (!element || !element.type || !element.businessObject || !onElementCreate) return;
    
    // Skip process elements for now
    if (element.type === 'bpmn:Process') return;
    
    // Skip if element already has a database ID (happens during XML import)
    if (element.businessObject.dbId) return;
    
    // Get element details
    const elementType = getElementType(element);
    const elementName = element.businessObject.name || getDefaultNameForType(elementType);
    
    debugLog(`Creating ${elementType} element:`, { id: element.id, name: elementName });
    
    try {
      // Prepare data based on element type
      const data = {
        type: elementType === 'process' ? 'process' : 'node',
        data: {
          name: elementName,
          type: elementType,
          processId: processId,
          bpmnId: element.id
        }
      };
      
      // Call parent handler
      const result = await onElementCreate(data);
      
      // Store database ID in element if available
      if (result && result.id) {
        const modeling = modeler.get('modeling');
        modeling.updateProperties(element, {
          dbId: result.id,
          dbType: data.type
        });
        
        debugLog('Element created in database:', { bpmnId: element.id, dbId: result.id });
      }
    } catch (err) {
      console.error('Error creating element in database:', err);
    }
  };
  
  // Handler for element updates
  const handleElementUpdated = async (element: any) => {
    // Skip if we're in the process of importing a diagram
    if (isSaving) return;
    
    if (!element || !element.businessObject || !element.businessObject.dbId || !onElementUpdate) return;
    
    // Get element details
    const dbId = element.businessObject.dbId;
    const dbType = element.businessObject.dbType || 'node';
    const elementName = element.businessObject.name || '';
    
    debugLog(`Updating element:`, { id: element.id, dbId, name: elementName });
    
    try {
      // Call parent handler
      await onElementUpdate({
        id: dbId,
        type: dbType,
        data: {
          name: elementName
        }
      });
    } catch (err) {
      console.error('Error updating element in database:', err);
    }
  };
  
  // Handler for element removal
  const handleElementRemoved = async (element: any) => {
    // Skip if we're in the process of importing a diagram
    if (isSaving) return;
    
    if (!element || !element.businessObject || !element.businessObject.dbId || !onElementDelete) return;
    
    // Get element details
    const dbId = element.businessObject.dbId;
    const dbType = element.businessObject.dbType || 'node';
    
    debugLog(`Removing element:`, { id: element.id, dbId });
    
    try {
      // Call parent handler
      await onElementDelete({
        id: dbId,
        type: dbType
      });
    } catch (err) {
      console.error('Error removing element from database:', err);
    }
  };
  
  // Get element type
  const getElementType = (element: any): string => {
    if (!element || !element.type) return 'unknown';
    
    // Map BPMN types to our simplified types
    const typeMap: Record<string, string> = {
      'bpmn:Process': 'process',
      'bpmn:Participant': 'participant',
      'bpmn:Task': 'task',
      'bpmn:UserTask': 'userTask',
      'bpmn:ServiceTask': 'serviceTask',
      'bpmn:StartEvent': 'startEvent',
      'bpmn:EndEvent': 'endEvent',
      'bpmn:ExclusiveGateway': 'exclusiveGateway',
      'bpmn:ParallelGateway': 'parallelGateway',
      'bpmn:SequenceFlow': 'sequenceFlow'
    };
    
    return typeMap[element.type] || element.type.replace('bpmn:', '').toLowerCase();
  };
  
  // Get default name for type
  const getDefaultNameForType = (type: string): string => {
    const nameMap: Record<string, string> = {
      'task': 'Task',
      'userTask': 'User Task',
      'serviceTask': 'Service Task',
      'startEvent': 'Start Event',
      'endEvent': 'End Event',
      'exclusiveGateway': 'Gateway',
      'parallelGateway': 'Parallel Gateway',
      'sequenceFlow': 'Flow'
    };
    
    return nameMap[type] || `New ${type}`;
  };
  
  // Get database info for element
  const getDatabaseInfoForElement = (element: any) => {
    if (!element || !element.businessObject) return null;
    
    const dbId = element.businessObject.dbId;
    if (!dbId) return null;
    
    const type = element.businessObject.dbType || 'node';
    
    if (type === 'process') {
      const process = processes.find(p => p.id === dbId);
      return process || { id: dbId, type };
    } else {
      const node = nodes.find(n => n.id === dbId);
      return node || { id: dbId, type };
    }
  };
  
  // Save the diagram
  const saveDiagram = async () => {
    if (!modeler) {
      debugLog('Cannot save: modeler not initialized');
      return;
    }
    
    debugLog('Saving diagram');
    setIsSaving(true);
    
    try {
      // Export as XML
      const { xml } = await modeler.saveXML({ format: true });
      
      // Collect database mappings
      const elementRegistry = modeler.get('elementRegistry');
      const elementsWithDbIds = elementRegistry.filter((element: any) => 
        element.businessObject && element.businessObject.dbId
      );
      
      const databaseMappings = elementsWithDbIds.map((element: any) => ({
        bpmnId: element.id,
        dbId: element.businessObject.dbId,
        dbType: element.businessObject.dbType || 'node'
      }));
      
      debugLog('Diagram saved:', { 
        xmlLength: xml.length,
        mappingsCount: databaseMappings.length
      });
      
      // Call parent save handler
      if (onSave) {
        await onSave(xml, databaseMappings);
      }
      
      return xml;
    } catch (err: any) {
      console.error('Error saving diagram:', err);
      if (onError) {
        onError(`Failed to save diagram: ${err.message || 'Unknown error'}`);
      }
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
  
  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getModeler: () => modeler,
    saveDiagram,
    getSelectedElementInfo
  }), [modeler, selectedElement, selectedElementDbInfo]);
  
  return (
    <div className="bpmn-modeler-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
    </div>
  );
});

// Set display name for easier debugging
BpmnModelerComponent.displayName = 'BpmnModelerComponent';

export default BpmnModelerComponent;