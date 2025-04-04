class DatabaseIntegration {
  constructor(eventBus, elementRegistry, modeling) {
    this.eventBus = eventBus;
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;
    
    // Store database entities
    this.processes = [];
    this.nodes = [];
    
    // Database callbacks
    this.onElementCreate = null;
    this.onElementUpdate = null;
    this.onElementDelete = null;
    
    // Current playbook and process context
    this.currentPlaybookId = null;
    this.currentProcessId = null;
    
    // Track created elements to prevent duplicate creation events
    this.processedElements = new Set();
    
    // Register event listeners
    this.registerEventListeners();
  }

  registerEventListeners() {
    // Listen for element selection
    this.eventBus.on('element.click', (event) => {
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
    this.eventBus.on('shape.added', (event) => {
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
    this.eventBus.on('element.changed', (event) => {
      const { element } = event;
      this.handleElementUpdated(element);
    });
    
    // Listen for element deletion
    this.eventBus.on('shape.remove', (event) => {
      const { element } = event;
      this.handleElementRemoved(element);
      // Remove from processed set
      this.processedElements.delete(element.id);
    });
    
    // Listen for connection creation
    this.eventBus.on('connection.added', (event) => {
      const { element } = event;
      
      // Avoid duplicate processing
      if (this.processedElements.has(element.id)) return;
      
      // Wait a bit to ensure the connection is fully created
      setTimeout(() => {
        this.handleElementCreated(element);
        this.processedElements.add(element.id);
      }, 100);
    });
    
    // Track existing elements when diagram loaded
    this.eventBus.on('import.done', () => {
      // Clear any previous elements
      this.processedElements.clear();
      
      // Add all existing elements to the processed set
      const allElements = this.elementRegistry.getAll();
      allElements.forEach(element => {
        this.processedElements.add(element.id);
      });
    });
  }
  
  // Set the process and node data from database
  setDatabaseEntities(processes = [], nodes = []) {
    console.log("Setting database entities:", { processes, nodes });
    this.processes = processes;
    this.nodes = nodes;
  }
  
  // Set the current playbook and process context
  setContext(playbookId, processId) {
    console.log("Setting context:", { playbookId, processId });
    this.currentPlaybookId = playbookId;
    this.currentProcessId = processId;
  }
  
  // Set the database operation callbacks
  setDatabaseCallbacks({
    onElementCreate = null,
    onElementUpdate = null,
    onElementDelete = null
  } = {}) {
    this.onElementCreate = onElementCreate;
    this.onElementUpdate = onElementUpdate;
    this.onElementDelete = onElementDelete;
  }
  
  // Handle element creation
  handleElementCreated(element) {
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
            description: '',
            playbookId: this.currentPlaybookId,
            bpmnId: element.id,
            bpmnXml: null
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
  getDefaultNameForElementType(elementType) {
    const typeNameMap = {
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
  handleElementUpdated(element) {
    if (!element || !this.onElementUpdate) return;
    
    // Skip non-BPMN elements
    if (!this.isValidBpmnElement(element)) return;
    
    // Check if this element has a database mapping
    const dbInfo = this.getDatabaseInfo(element);
    if (!dbInfo) return;
    
    const elementName = this.getElementName(element);
    
    // Only update if name has changed
    if (elementName !== dbInfo.name) {
      this.onElementUpdate({
        id: dbInfo.id,
        type: element.type === 'bpmn:Process' || element.type === 'bpmn:Participant' 
          ? 'process' 
          : 'node',
        data: {
          name: elementName || this.getDefaultNameForElementType(this.getBpmnElementType(element))
        }
      }).then(() => {
        console.log(`Element ${element.id} updated in database`);
      }).catch(err => {
        console.error('Failed to update element in database:', err);
      });
    }
  }
  
  // Handle element removal
  handleElementRemoved(element) {
    if (!element || !this.onElementDelete) return;
    
    // Check if this element has a database mapping
    const dbInfo = this.getDatabaseInfo(element);
    if (!dbInfo) return;
    
    this.onElementDelete({
      id: dbInfo.id,
      type: element.type === 'bpmn:Process' || element.type === 'bpmn:Participant' 
        ? 'process' 
        : 'node'
    }).then(() => {
      console.log(`Element ${element.id} deleted from database`);
    }).catch(err => {
      console.error('Failed to delete element from database:', err);
    });
  }
  
  // Get database info for an element
  getDatabaseInfo(element) {
    if (!element || !element.id) return null;
    
    // For process (diagram/participant)
    if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
      return this.processes.find(p => p.bpmnId === element.id);
    }
    
    // For nodes (tasks, events, gateways, etc.)
    return this.nodes.find(n => n.bpmnId === element.id);
  }
  
  // Set database ID for a BPMN element
  setDatabaseId(elementId, databaseId, type = 'node') {
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
  getElementsWithDatabaseIds() {
    try {
      const elements = this.elementRegistry.getAll();
      return elements.filter(element => 
        element.businessObject && element.businessObject.dbId);
    } catch (error) {
      console.error('Error getting elements with DB IDs:', error);
      return [];
    }
  }
  
  // Highlight an element by database ID
  highlightElementByDatabaseId(databaseId) {
    try {
      const elements = this.getElementsWithDatabaseIds();
      const targetElement = elements.find(el => 
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
  isValidBpmnElement(element) {
    return element && element.type && element.type.startsWith('bpmn:');
  }
  
  getBpmnElementType(element) {
    if (!element || !element.type) return 'unknown';
    
    if (element.type === 'bpmn:Process' || element.type === 'bpmn:Participant') {
      return 'process';
    }
    
    const typeMap = {
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
  
  getElementName(element) {
    if (!element || !element.businessObject) return '';
    
    return element.businessObject.name || '';
  }
}

DatabaseIntegration.$inject = ['eventBus', 'elementRegistry', 'modeling'];

export default {
  __init__: ['databaseIntegration'],
  databaseIntegration: ['type', DatabaseIntegration]
};
