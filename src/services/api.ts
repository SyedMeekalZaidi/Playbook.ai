// API services for interfacing with the backend

// Helper function for API calls
const apiCall = async (url: string, options = {}) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
};

// Playbook API operations
export const PlaybookAPI = {
  getAll: () => apiCall('/api/playbooks'),
  getById: (id: string) => apiCall(`/api/playbooks/${id}`),
  create: (data: any) => apiCall('/api/playbooks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => apiCall(`/api/playbooks/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/playbooks/${id}`, {
    method: 'DELETE',
  }),
};

// Process API operations
export const ProcessAPI = {
  getAll: () => apiCall('/api/processes'),
  getById: (id: string) => apiCall(`/api/processes/${id}`),
  getByPlaybook: (playbookId: string) => apiCall(`/api/playbooks/${playbookId}/processes`),
  create: (data: any) => apiCall('/api/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => apiCall(`/api/processes/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/processes/${id}`, {
    method: 'DELETE',
  }),
};

// Node API operations
export const NodeAPI = {
  getAll: () => apiCall('/api/nodes'),
  getById: (id: string) => apiCall(`/api/nodes/${id}`),
  getByProcess: (processId: string) => apiCall(`/api/processes/${processId}/nodes`),
  create: (data: any) => apiCall('/api/nodes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (data: any) => apiCall(`/api/nodes/${data.id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/nodes/${id}`, {
    method: 'DELETE',
  }),
};

// Other API operations can be added here
