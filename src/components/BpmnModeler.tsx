// components/BpmnModeler.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import DatabaseIntegration from '../modules/DatabaseIntegration';

// Define types for database entities
interface Process {
  id: string;
  name: string;
  bpmnXml?: string;
  bpmnId?: string; // ID in the BPMN diagram
}

interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
  bpmnId?: string; // ID in the BPMN diagram
}

interface BpmnModelerProps {
  xml?: string;
  onSave?: (xml: string, databaseMappings: any) => void;
  onElementSelect?: (element: any, databaseInfo: any) => void;
  processes?: Process[];
  nodes?: Node[];
  readOnly?: boolean;
}

const BpmnModelerComponent: React.FC<BpmnModelerProps> = ({
  xml,
  onSave,
  onElementSelect,
  processes = [],
  nodes = [],
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);

  // Initialize modeler
  useEffect(() => {
    if (!containerRef.current) return;

    // Create modeler instance with custom modules
    const modeler = new BpmnModeler({
      container: containerRef.current,
      additionalModules: [
        DatabaseIntegration
      ],
      keyboard: {
        bindTo: window
      },
      // Set read-only mode if needed
      ...(readOnly && { 
        keyboard: { bindTo: document },
        textRenderer: { style: { fontFamily: 'Arial' } },
      })
    });

    modelerRef.current = modeler;

    // Import initial diagram
    if (xml) {
      try {
        modeler.importXML(xml);
      } catch (err) {
        console.error('Error importing BPMN diagram:', err);
      }
    }

    // Clean up
    return () => {
      modeler.destroy();
    };
  }, []);

  // Handle database entities updates
  useEffect(() => {
    if (!modelerRef.current) return;

    // Get the database integration module instance
    const databaseIntegration = modelerRef.current.get('databaseIntegration');
    if (databaseIntegration) {
      // Update the module with current database entities
      databaseIntegration.setDatabaseEntities(processes, nodes);
    }

    // Attach database IDs to BPMN elements if they exist
    mapDatabaseIdsToBpmnElements();
  }, [processes, nodes]);

  // Add event listeners
  useEffect(() => {
    if (!modelerRef.current) return;

    const eventBus = modelerRef.current.get('eventBus');
    
    // Listen for element selection
    const onElementSelectHandler = (event: any) => {
      const { element, databaseInfo } = event;
      setSelectedElement(element);
      if (onElementSelect) {
        onElementSelect(element, databaseInfo);
      }
    };

    // Register for the custom event from our module
    eventBus.on('database.element.selected', onElementSelectHandler);

    // Clean up
    return () => {
      eventBus.off('database.element.selected', onElementSelectHandler);
    };
  }, [onElementSelect]);

  // Map database IDs to BPMN elements
  const mapDatabaseIdsToBpmnElements = () => {
    if (!modelerRef.current) return;

    const databaseIntegration = modelerRef.current.get('databaseIntegration');
    const elementRegistry = modelerRef.current.get('elementRegistry');
    
    if (!databaseIntegration || !elementRegistry) return;

    // Map process IDs
    processes.forEach(process => {
      if (process.bpmnId) {
        databaseIntegration.setDatabaseId(process.bpmnId, process.id, 'process');
      }
    });

    // Map node IDs
    nodes.forEach(node => {
      if (node.bpmnId) {
        databaseIntegration.setDatabaseId(node.bpmnId, node.id, 'node');
      }
    });
  };

  // Save diagram with database mappings
  const saveDiagram = async () => {
    if (!modelerRef.current || !onSave) return;

    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      
      // Collect database mappings
      const databaseIntegration = modelerRef.current.get('databaseIntegration');
      const elementsWithDbIds = databaseIntegration 
        ? databaseIntegration.getElementsWithDatabaseIds()
        : [];
      
      const databaseMappings = elementsWithDbIds.map((el: any) => ({
        bpmnId: el.id,
        dbId: el.businessObject.dbId,
        dbType: el.businessObject.dbType,
      }));

      onSave(xml, databaseMappings);
    } catch (err) {
      console.error('Error saving diagram:', err);
    }
  };

  // Method to add a database ID to a BPMN element
  const addDatabaseIdToElement = (elementId: string, databaseId: string, type: 'process' | 'node' = 'node') => {
    if (!modelerRef.current) return false;

    const databaseIntegration = modelerRef.current.get('databaseIntegration');
    if (databaseIntegration) {
      return databaseIntegration.setDatabaseId(elementId, databaseId, type);
    }
    return false;
  };

  // Method to get selected element info
  const getSelectedElementInfo = () => {
    if (!selectedElement) return null;
    
    const databaseIntegration = modelerRef.current.get('databaseIntegration');
    if (databaseIntegration) {
      return {
        element: selectedElement,
        databaseInfo: databaseIntegration.getDatabaseInfo(selectedElement)
      };
    }
    
    return { element: selectedElement, databaseInfo: null };
  };

  // Expose methods to parent components
  React.useImperativeHandle(
    ref,
    () => ({
      getModeler: () => modelerRef.current,
      saveDiagram,
      addDatabaseIdToElement,
      getSelectedElementInfo
    }),
    [selectedElement]
  );

  return (
    <div className="bpmn-modeler-container" style={{ width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}></div>
      {!readOnly && (
        <div className="bpmn-modeler-actions">
          <button onClick={saveDiagram}>Save</button>
        </div>
      )}
    </div>
  );
};

export default React.forwardRef(BpmnModelerComponent);