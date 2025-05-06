// API services for interfacing with the backend
import { 
    CreatePlaybookPayload, UpdatePlaybookPatchPayload, UpdatePlaybookPutPayload, SharePlaybookPayload,
    CreateProcessPayload, UpdateProcessPatchPayload, UpdateProcessPutPayload,
    CreateNodePayload, UpdateNodePayload,
    CreateProcessParameterPayload, UpdateProcessParameterPayload,
    CreateProcessDependencyPayload,
    Event as EventType // Assuming Event type is defined in @/types/api
} from '@/types/api';

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
  getAll: (params?: { ownerId?: string; status?: string }) => {
    let url = '/api/playbooks';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.ownerId) queryParams.append('ownerId', params.ownerId);
      if (params.status) queryParams.append('status', params.status);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return apiCall(url);
  },
  getById: (id: string, params?: { includeProcess?: boolean; includeNodes?: boolean; includeNodeParams?: boolean; includeAll?: boolean }) => {
    let url = `/api/playbooks/${id}`;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.includeProcess) queryParams.append('includeProcess', 'true');
      if (params.includeNodes) queryParams.append('includeNodes', 'true');
      if (params.includeNodeParams) queryParams.append('includeNodeParams', 'true');
      if (params.includeAll) queryParams.append('includeAll', 'true');
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return apiCall(url);
  },
  create: (data: CreatePlaybookPayload) => apiCall('/api/playbooks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (id: string, data: UpdatePlaybookPutPayload) => apiCall(`/api/playbooks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (id: string, data: UpdatePlaybookPatchPayload) => apiCall(`/api/playbooks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/playbooks/${id}`, {
    method: 'DELETE',
  }),
  share: (playbookId: string, data: SharePlaybookPayload) => apiCall(`/api/playbooks/${playbookId}/share`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// Process API operations
export const ProcessAPI = {
  getAll: (params?: { playbookId?: string }) => {
    let url = '/api/processes';
    if (params?.playbookId) {
      const queryParams = new URLSearchParams();
      queryParams.append('playbookId', params.playbookId);
      url += `?${queryParams.toString()}`;
    }
    return apiCall(url);
  },
  getById: (id: string) => apiCall(`/api/processes/${id}`),
  create: (data: CreateProcessPayload) => apiCall('/api/processes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (id: string, data: UpdateProcessPutPayload) => apiCall(`/api/processes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (id: string, data: UpdateProcessPatchPayload) => apiCall(`/api/processes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/processes/${id}`, {
    method: 'DELETE',
  }),

  // Process Parameters
  getProcessParameters: (processId: string) => apiCall(`/api/processes/${processId}/parameters`),
  createProcessParameters: (processId: string, data: { parameters: CreateProcessParameterPayload[] }) => apiCall(`/api/processes/${processId}/parameters`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateProcessParameter: (processId: string, data: UpdateProcessParameterPayload) => apiCall(`/api/processes/${processId}/parameters`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteProcessParameter: (processId: string, parameterId: string) => apiCall(`/api/processes/${processId}/parameters?id=${parameterId}`, {
    method: 'DELETE',
  }),

  // Process Dependencies
  getProcessDependencies: (processId: string) => apiCall(`/api/processes/${processId}/dependencies`),
  createProcessDependency: (processId: string, data: CreateProcessDependencyPayload) => apiCall(`/api/processes/${processId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  deleteProcessDependency: (processId: string, dependencyId: string) => apiCall(`/api/processes/${processId}/dependencies?dependencyId=${dependencyId}`, {
    method: 'DELETE',
  }),
};

// Node API operations
export const NodeAPI = {
  getByProcess: (processId: string) => apiCall(`/api/processes/${processId}/nodes`),
  getById: (id: string) => apiCall(`/api/nodes/${id}`),
  create: (data: CreateNodePayload) => apiCall('/api/nodes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: UpdateNodePayload) => apiCall(`/api/nodes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiCall(`/api/nodes/${id}`, {
    method: 'DELETE',
  }),
};

// Event API operations
export const EventAPI = {
  getAll: (params?: { userId?: string; playbookId?: string }) => {
    let url = '/api/event';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.playbookId) queryParams.append('playbookId', params.playbookId);
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    return apiCall(url);
  },
  create: (data: Partial<EventType>) => apiCall('/api/event', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};
