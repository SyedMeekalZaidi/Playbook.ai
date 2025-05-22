// Database Integration Module for BPMN.js
// This module handles database operations for BPMN elements

// Define types for database entities
export interface Process {
  id: string;
  name: string;
  playbookId: string;
  bpmnId?: string;
  bpmnXml?: string | null;
}

export interface Node {
  id: string;
  name: string;
  type: string;
  processId: string;
  bpmnId?: string;
}

// Define database callback types
export interface DatabaseCallbacks {
  onElementCreate?: (data: any) => Promise<any>;
  onElementUpdate?: (data: any) => Promise<any>;
  onElementDelete?: (data: any) => Promise<any>;
}

// The main DatabaseIntegration class
class DatabaseIntegration {
  private eventBus: any;
  private elementRegistry: any;
  private modeling: any;

  private processes: Process[] = [];
  private nodes: Node[] = [];

  private onElementCreate: ((data: any) => Promise<any>) | null = null;
  private onElementUpdate: ((data: any) => Promise<any>) | null = null;
  private onElementDelete: ((data: any) => Promise<any>) | null = null;

  private currentPlaybookId: string | null = null;
  private currentProcessId: string | null = null;

  // Track processed elements to prevent duplicate handling
  private processedElements: Set<string> = new Set();

  constructor(eventBus: any, elementRegistry: any, modeling: any) {
    this.eventBus = eventBus;
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;

    // Register event listeners
    this.registerEventListeners();
  }

  private registerEventListeners(): void {
    // Listen for element selection
    this.eventBus.on('element.click', (event: any) => {
      const { element } = event;

      // Find database information for the clicked element
      const databaseInfo = this.getDatabaseInfo(element);

      // Emit a custom event with database info
      this.eventBus.fire('database.element.selected', {
        element,
        databaseInfo
      });
    });

    // Listen for element creation
    this.eventBus.on('shape.added', (event: any) => {
      const { element } = event;

      // Avoid duplicate processing
      if (this.processedElements.has(element.id)) return;

      // Wait a bit to ensure the element is fully created
      setTimeout(() => {
        this.handleElementCreated(element);
        this.processedElements.add(element.id);
      }, 100);
    });

    // Listen for element updates
    this.eventBus.on('element.changed', (event: any) => {
      const { element } = event;
      this.handleElementUpdated(element);
    });

    // Listen for element deletion
    this.eventBus.on('shape.remove', (event: any) => {
      const { element } = event;
      this.handleElementRemoved(element);
      // Remove from processed set
      this.processedElements.delete(element.id);
    });

    // Listen for connection creation
    this.eventBus.on('connection.added', (event: any) => {
      const { element } = event;

      // Avoid duplicate processing
      if (this.processedElements.has(element.id)) return;

      // Wait a bit to ensure the connection is fully created
      setTimeout(() => {
        this.handleElementCreated(element);
        this.processedElements.add(element.id);
      }, 100);
    });

    // Listen for connection deletion
    this.eventBus.on('connection.remove', (event: any) => {
      const { element } = event;
      this.handleElementRemoved(element);
      this.processedElements.delete(element.id);
    });

    // Track existing elements when diagram loaded
    this.eventBus.on('import.done', () => {
      // Clear any previous elements
      this.processedElements.clear();

      // Add all existing elements to the processed set
      // And attempt to sync them with DB info
      this.syncDatabaseElements();

      const allElements = this.elementRegistry.getAll();
      allElements.forEach((element: any) => {
        this.processedElements.add(element.id);
      });
    });
  }

  // Set the process and node data from database
  public setDatabaseEntities(processes: Process[] = [], nodes: Node[] = []): void {
    console.log("Setting database entities:", { processes, nodes });
    this.processes = processes;
    this.nodes = nodes;
  }

  // Set the current playbook and process context
  public setContext(playbookId: string | null, processId: string | null): void {
    console.log("Setting context:", { playbookId, processId });
    this.currentPlaybookId = playbookId;
    this.currentProcessId = processId;
  }

  // Set the database operation callbacks
  public setDatabaseCallbacks(callbacks: DatabaseCallbacks = {}): void {
    this.onElementCreate = callbacks.onElementCreate || null;
    this.onElementUpdate = callbacks.onElementUpdate || null;
    this.onElementDelete = callbacks.onElementDelete || null;
  }

  // Handle element creation
  private handleElementCreated(element: any): void {
    if (!element || !this.currentProcessId || !this.onElementCreate) {
      console.log("Skipping element creation - missing dependencies", {
        hasElement: !!element,
        hasProcessId: !!this.currentProcessId,
        hasCallback: !!this.onElementCreate
      });
      return;
    }

    // Skip non-BPMN elements and elements that already have database IDs
    if (!this.isValidBpmnElement(element) || element.businessObject?.dbId) {
      console.log("Skipping invalid element or already has dbId", {
        isValid: this.isValidBpmnElement(element),
        hasDbId: !!element.businessObject?.dbId
      });
      return;
    }

    // Get element details
    const elementType = this.getBpmnElementType(element);
    const elementName = this.getElementName(element);

    console.log(`Creating ${elementType} element: ${element.id} (${elementName})`);

    try {
      // Create a new database entity based on the element type
      if (elementType === 'process') {
        // Handle process/participant creation
        this.onElementCreate({
          type: 'process',
          data: {
            name: elementName || 'New Process',
            playbookId: this.currentPlaybookId,
            bpmnId: element.id
          }
        }).then(result => {
          if (result && result.id) {
            this.setDatabaseId(element.id, result.id, 'process');
            console.log(`Process ${element.id} saved with DB ID: ${result.id}`);
          }
        }).catch(err => {
          console.error('Failed to create process in database:', err);
        });
      } else {
        // Handle node creation (tasks, events, gateways, connections, etc.)
        this.onElementCreate({
          type: 'node',
          data: {
            name: elementName || this.getDefaultNameForElementType(elementType),
            type: elementType,
            processId: this.currentProcessId,
            bpmnId: element.id
          }
        }).then(result => {
          if (result && result.id) {
            this.setDatabaseId(element.id, result.id, 'node');
            console.log(`Node ${element.id} (${elementType}) saved with DB ID: ${result.id}`);
          }
        }).catch(err => {
          console.error('Failed to create node in database:', err);
        });
      }
    } catch (error) {
      console.error('Error in handleElementCreated:', error);
    }
  }

  // Get default name for different element types
  private getDefaultNameForElementType(elementType: string): string {
    const typeNameMap: Record<string, string> = {
      'task': 'New Task',
      'userTask': 'New User Task',
      'serviceTask': 'New Service Task',
      'startEvent': 'Start Event',
      'endEvent': 'End Event',
      'exclusiveGateway': 'Gateway',
      'parallelGateway': 'Parallel Gateway',
      'sequenceFlow': 'Connection'
    };

    return typeNameMap[elementType] || `New ${elementType}`;
  }

  // Handle element update
  private handleElementUpdated(element: any): void {
    if (!element || !this.onElementUpdate) return;

    // Skip non-BPMN elements
    if (!this.isValidBpmnElement(element)) return;

    // Check if this element has a database mapping
    const dbInfo = this.getDatabaseInfo(element);
    const elementDbId = element.businessObject?.dbId;

    if (!dbInfo && !elementDbId) {
      console.log("Skipping update for element without DB info or dbId:", element.id);
      return;
    }

    const elementName = this.getElementName(element);
    const currentDbId = dbInfo ? dbInfo.id : elementDbId;
    const elementType = this.getBpmnElementType(element);
    const dbType = element.businessObject?.dbType || (elementType === 'process' ? 'process' : 'node');

    this.onElementUpdate({
      dbId: currentDbId,
      type: dbType,
      data: {
        id: currentDbId,
        name: elementName || this.getDefaultNameForElementType(elementType),
        bpmnId: element.id,
        type: elementType
      }
    }).then(() => {
      console.log(`Element ${element.id} (DB ID: ${currentDbId}) update processed by callback.`);
    }).catch(err => {
      console.error(`Failed to update element ${element.id} (DB ID: ${currentDbId}) in database:`, err);
    });
  }

  // Handle element removal
  private handleElementRemoved(element: any): void {
    if (!element || !this.onElementDelete) return;

    // Check if this element has a database mapping
    const dbInfo = this.getDatabaseInfo(element);
    if (!dbInfo) return;

    this.onElementDelete({
      id: dbInfo.id,
      type: element.businessObject?.dbType || (this.getBpmnElementType(element) === 'process' ? 'process' : 'node')
    }).then(() => {
      console.log(`Element ${element.id} (DB ID: ${dbInfo.id}) deleted from database`);
    }).catch(err => {
      console.error('Failed to delete element from database:', err);
    });
  }

  // Get database info for an element
  public getDatabaseInfo(element: any): Process | Node | null {
    if (!element || !element.id) return null;

    // For process (diagram/participant)
    if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
      return this.processes.find(p => p.bpmnId === element.id) || null;
    }

    // For nodes (tasks, events, gateways, etc.)
    return this.nodes.find(n => n.bpmnId === element.id) || null;
  }

  // Set database ID for a BPMN element
  public setDatabaseId(elementId: string, databaseId: string, type: string = 'node'): boolean {
    try {
      const element = this.elementRegistry.get(elementId);
      if (!element) {
        console.warn(`Element ${elementId} not found in registry`);
        return false;
      }

      // Set custom attribute to store DB ID
      this.modeling.updateProperties(element, {
        'dbId': databaseId,
        'dbType': type
      });

      console.log(`Database ID ${databaseId} set for element ${elementId}`);
      return true;
    } catch (error) {
      console.error(`Error setting database ID for ${elementId}:`, error);
      return false;
    }
  }

  // Get all elements with database IDs
  public getElementsWithDatabaseIds(): any[] {
    try {
      const elements = this.elementRegistry.getAll();
      return elements.filter((element: any) =>
        element.businessObject && element.businessObject.dbId);
    } catch (error) {
      console.error('Error getting elements with DB IDs:', error);
      return [];
    }
  }

  // Highlight an element by database ID
  public highlightElementByDatabaseId(databaseId: string): any | null {
    try {
      const elements = this.getElementsWithDatabaseIds();
      const targetElement = elements.find((el: any) =>
        el.businessObject.dbId === databaseId);

      if (targetElement) {
        // Use the event bus to notify about highlighting
        this.eventBus.fire('database.highlight', {
          element: targetElement
        });
        return targetElement;
      }

      return null;
    } catch (error) {
      console.error('Error highlighting element by DB ID:', error);
      return null;
    }
  }

  // Helper methods
  private isValidBpmnElement(element: any): boolean {
    return element && element.type && element.type.startsWith('bpmn:');
  }

  private getBpmnElementType(element: any): string {
    if (!element || !element.type) return 'unknown';

    if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
      return 'process';
    }
    if (element.type === 'bpmn:SequenceFlow') {
      return 'sequenceFlow';
    }

    const typeMap: Record<string, string> = {
      'bpmn:Task': 'task',
      'bpmn:UserTask': 'userTask',
      'bpmn:ServiceTask': 'serviceTask',
      'bpmn:StartEvent': 'startEvent',
      'bpmn:EndEvent': 'endEvent',
      'bpmn:ExclusiveGateway': 'exclusiveGateway',
      'bpmn:ParallelGateway': 'parallelGateway',
      'bpmn:SequenceFlow': 'sequenceFlow',
      'bpmn:TextAnnotation': 'textAnnotation',
      'bpmn:Group': 'group',
      'bpmn:SubProcess': 'subProcess',
      'bpmn:BoundaryEvent': 'boundaryEvent',
      'bpmn:IntermediateCatchEvent': 'intermediateCatchEvent',
      'bpmn:IntermediateThrowEvent': 'intermediateThrowEvent'
    };

    return typeMap[element.type] || element.type.replace('bpmn:', '').toLowerCase();
  }

  private getElementName(element: any): string {
    if (!element || !element.businessObject) return '';

    return element.businessObject.name || '';
  }

  // Sync diagram elements with database IDs after loading
  public syncDatabaseElements(): void {
    if (!this.elementRegistry) {
      console.warn('[DatabaseIntegration] Element registry not available for sync.');
      return;
    }
    console.log('[DatabaseIntegration] Starting syncDatabaseElements...');
    const allDiagramElements = this.elementRegistry.getAll();

    allDiagramElements.forEach((element: any) => {
      if (!this.isValidBpmnElement(element) || element.businessObject?.dbId) {
        return;
      }

      const bpmnId = element.id;
      let dbEntity: Process | Node | null = null;
      let dbType: string = 'node';

      if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
        dbEntity = this.processes.find(p => p.bpmnId === bpmnId) || null;
        dbType = 'process';
      } else {
        dbEntity = this.nodes.find(n => n.bpmnId === bpmnId) || null;
        dbType = 'node';
      }

      if (dbEntity && dbEntity.id) {
        console.log(`[DatabaseIntegration] Syncing element ${bpmnId} with DB ID ${dbEntity.id}`);
        this.setDatabaseId(bpmnId, dbEntity.id, dbType);
      }
    });
    console.log('[DatabaseIntegration] Finished syncDatabaseElements.');
  }
}

// Module definition for BPMN.js
DatabaseIntegration.$inject = ['eventBus', 'elementRegistry', 'modeling'];

export default {
  __init__: ['databaseIntegration'],
  databaseIntegration: ['type', DatabaseIntegration]
};
