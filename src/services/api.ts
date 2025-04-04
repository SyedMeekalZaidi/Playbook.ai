/**
 * API service for backend communication
 */

// Process API methods
export const ProcessAPI = {
  // Get all processes
  getAll: async () => {
    const response = await fetch('/api/process');
    if (!response.ok) {
      throw new Error('Failed to fetch processes');
    }
    return response.json();
  },
  
  // Get a process by ID
  getById: async (id: string) => {
    const response = await fetch(`/api/process?id=${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch process');
    }
    return response.json();
  },
  
  // Create a new process
  create: async (data: {
    name: string;
    description?: string;
    playbookId: string;
    bpmnXml?: string | null;
  }) => {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create process');
    }
    
    return response.json();
  },
  
  // Update a process
  update: async (id: string, data: {
    name?: string;
    description?: string;
    bpmnXml?: string;
  }) => {
    const response = await fetch('/api/process', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update process');
    }
    
    return response.json();
  },
  
  // Delete a process
  delete: async (id: string) => {
    const response = await fetch(`/api/process?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete process');
    }
    
    return response.json();
  }
};

// Node API methods
export const NodeAPI = {
  // Get all nodes for a process
  getByProcessId: async (processId: string) => {
    const response = await fetch(`/api/node?processId=${processId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch nodes');
    }
    return response.json();
  },
  
  // Get a node by ID
  getById: async (id: string) => {
    const response = await fetch(`/api/node?id=${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch node');
    }
    return response.json();
  },
  
  // Create a new node
  create: async (data: {
    name: string;
    type: string;
    processId: string;
    bpmnId?: string;
  }) => {
    const response = await fetch('/api/node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create node');
    }
    
    return response.json();
  },
  
  // Update a node
  update: async (id: string, data: {
    name?: string;
    type?: string;
  }) => {
    const response = await fetch('/api/node', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update node');
    }
    
    return response.json();
  },
  
  // Delete a node
  delete: async (id: string) => {
    const response = await fetch(`/api/node?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete node');
    }
    
    return response.json();
  }
};
