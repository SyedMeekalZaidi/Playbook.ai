class DatabaseIntegration {
  constructor(eventBus, elementRegistry, modeling) {
    this.eventBus = eventBus;
    this.elementRegistry = elementRegistry;
    this.modeling = modeling;
    
    // Store database entities
    this.processes = [];
    this.nodes = [];
    
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
  }
  
  // Set the process and node data from database
  setDatabaseEntities(processes = [], nodes = []) {
    this.processes = processes;
    this.nodes = nodes;
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
    const element = this.elementRegistry.get(elementId);
    if (!element) return false;
    
    // We use the business object to store our custom data
    const businessObject = element.businessObject;
    
    // Set custom attribute to store DB ID
    this.modeling.updateProperties(element, {
      'dbId': databaseId,
      'dbType': type
    });
    
    return true;
  }
  
  // Get all elements with database IDs
  getElementsWithDatabaseIds() {
    const elements = this.elementRegistry.getAll();
    return elements.filter(element => 
      element.businessObject && element.businessObject.dbId);
  }
  
  // Highlight an element by database ID
  highlightElementByDatabaseId(databaseId) {
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
  }
}

DatabaseIntegration.$inject = ['eventBus', 'elementRegistry', 'modeling'];

export default {
  __init__: ['databaseIntegration'],
  databaseIntegration: ['type', DatabaseIntegration]
};
