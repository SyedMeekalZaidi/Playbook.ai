/**
 * API Service for BPMN Process and Node Operations
 */

// Process API Service
export const ProcessAPI = {
  // Get all processes
  async getAll() {
    try {
      const response = await fetch('/api/process');
      if (!response.ok) throw new Error('Failed to fetch processes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching processes:', error);
      throw error;
    }
  },

  // Get a process by ID
  async getById(id: string) {
    try {
      const response = await fetch(`/api/process?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch process');
      return await response.json();
    } catch (error) {
      console.error('Error fetching process:', error);
      throw error;
    }
  },

  // Create a new process
  async create(data: {
    name: string;
    playbookId: string;
    bpmnXml?: string;
    bpmnId?: string;
  }) {
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create process');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating process:', error);
      throw error;
    }
  },

  // Update a process
  async update(data: {
    id: string;
    name?: string;
    bpmnXml?: string;
    bpmnId?: string;
  }) {
    try {
      const response = await fetch('/api/process', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update process');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating process:', error);
      throw error;
    }
  },

  // Delete a process
  async delete(id: string) {
    try {
      const response = await fetch(`/api/process?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete process');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting process:', error);
      throw error;
    }
  }
};

// Node API Service
export const NodeAPI = {
  // Get all nodes for a process
  async getByProcessId(processId: string) {
    try {
      const response = await fetch(`/api/node?processId=${processId}`);
      if (!response.ok) throw new Error('Failed to fetch nodes');
      return await response.json();
    } catch (error) {
      console.error('Error fetching nodes:', error);
      throw error;
    }
  },

  // Get a node by ID
  async getById(id: string) {
    try {
      const response = await fetch(`/api/node?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch node');
      return await response.json();
    } catch (error) {
      console.error('Error fetching node:', error);
      throw error;
    }
  },

  // Create a new node
  async create(data: {
    name: string;
    type: string;
    processId: string;
    bpmnId?: string;
  }) {
    try {
      const response = await fetch('/api/node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create node');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating node:', error);
      throw error;
    }
  },

  // Update a node
  async update(data: {
    id: string;
    name?: string;
    type?: string;
    bpmnId?: string;
  }) {
    try {
      const response = await fetch('/api/node', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update node');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating node:', error);
      throw error;
    }
  },

  // Delete a node
  async delete(id: string) {
    try {
      const response = await fetch(`/api/node?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete node');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting node:', error);
      throw error;
    }
  }
};

// Playbook API Service
export const PlaybookAPI = {
  // Get a playbook by ID
  async getById(id: string) {
    try {
      const response = await fetch(`/api/playbook?id=${id}`);
      if (!response.ok) throw new Error('Failed to fetch playbook');
      return await response.json();
    } catch (error) {
      console.error('Error fetching playbook:', error);
      throw error;
    }
  },

  // Create a new playbook with specified ID
  async create(data: {
    id: string;
    name: string;
    ownerId?: string;
    shortDescription?: string;
  }) {
    try {
      const response = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create playbook');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating playbook:', error);
      throw error;
    }
  },

  // Get or create the fixed test playbook
  async getTestPlaybook() {
    try {
      // Try to get the existing playbook
      try {
        return await this.getById('test-playbook-id');
      } catch (error) {
        // If not found, create it
        return await this.create({
          id: 'test-playbook-id',
          name: 'Test Playbook'
        });
      }
    } catch (error) {
      console.error('Error getting test playbook:', error);
      throw error;
    }
  }
};
