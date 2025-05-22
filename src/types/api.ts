import { Status as PrismaStatus, Role as PrismaClientRole } from '@prisma/client';

export type Status = PrismaStatus;
export type PlaybookCollaboratorRole = PrismaClientRole;

// Export the Role enum so it can be imported by other modules
export { PrismaClientRole as Role };

export interface User {
  id: string;
  email?: string;
  // role?: string; // Example: 'ADMIN' | 'USER', typically from session/auth provider
}

export interface Playbook {
  id: string;
  name: string;
  ownerId: string;
  shortDescription?: string | null;
  documentContent?: any | null; // Prisma Json type
  status: Status;
  isDeleted: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  deletedAt?: string | null; // ISO date string
  Process?: Process[]; // Optional: for eager loading
  PlaybookCollaborator?: PlaybookCollaborator[]; // Optional: for eager loading
  // Add other fields from your Prisma schema if needed
  Role?: PrismaClientRole; // Added to satisfy potential type usage, though not directly on playbook model
}

export interface Process {
  id: string;
  name: string;
  playbookId: string;
  shortDescription?: string | null;
  bpmnXml?: string | null; // For BPMN modeler
  bpmnId?: string | null; // For BPMN modeler
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  Node?: Node[]; // Optional: for eager loading
  ProcessParameter?: ProcessParameter[]; // Process-level parameters
  // For dependencies, these would be populated if included by the API
  parentToProcesses?: ProcessDependency[]; // Dependencies where this process is the child
  nextToProcesses?: ProcessDependency[]; // Dependencies where this process is the parent
}

export interface Node {
  id: string;
  name: string;
  type: string; // e.g., 'Task', 'Event', 'Gateway'
  shortDescription?: string | null;
  processId: string;
  bpmnId?: string | null; // For BPMN modeler
  documentContent?: any | null; // Prisma Json type, added
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  ProcessParameter?: ProcessParameter[]; // Node-specific parameters
  // Add other node fields as needed
}

export interface ProcessParameter {
  id: string;
  name: string;
  type: string; // e.g., "TEXT", "NUMBER", "BOOLEAN", "DROPDOWN", "RADIO", "CHECKBOX"
  mandatory: boolean;
  info?: string | null;
  options?: string[]; // For types like DROPDOWN, RADIO, CHECKBOX
  nodeId?: string | null; // Null if it's a process-level parameter
  processId: string; // The process this parameter belongs to (directly or via a node)
}

export interface ProcessDependency {
  id: string;
  parentProcessId: string; // The ID of the process that comes before
  processId: string;       // The ID of the process that comes after (child)
  trigger?: string | null;  // Optional description of the trigger/condition
  createdAt: string;
  updatedAt: string;
  // Optional: for eager loading if API supports it
  // parentProcess?: Process;
  // childProcess?: Process;
}

export interface PlaybookCollaborator {
  id: string;
  playbookId: string;
  userId: string; // Supabase User ID as a String
  role: PlaybookCollaboratorRole; // Uses the type defined above
  createdAt: string; // ISO date string
  Playbook?: Playbook; // Optional: for eager loading
  // User?: User; // Optional: if you want to include user details
}

// API Payloads
export interface CreatePlaybookPayload {
  name: string;
  ownerId: string;
  shortDescription?: string;
}

export interface UpdatePlaybookPutPayload {
  name: string;
  ownerId: string; // Usually, ownerId is not updatable via PUT in this manner, but matching schema
  shortDescription?: string | null;
  documentContent?: any | null;
  status?: Status;
}

export type UpdatePlaybookPatchPayload = Partial<Omit<UpdatePlaybookPutPayload, 'ownerId'>>;

export interface SharePlaybookPayload {
  userId: string;
  role?: PlaybookCollaboratorRole; // Role is optional, API might default it
}

// Process API Payloads
export interface CreateProcessPayload {
  playbookId: string;
  processName: string; // Corresponds to 'name' in the Process model
  shortDescription?: string;
  nodeList?: CreateNodePayload[]; // For creating nodes along with the process
  processParameters?: CreateProcessParameterPayload[]; // For process-level parameters
  processDependency?: { // For creating an initial dependency
    parentProcessId: string;
    trigger?: string;
  };
}

export interface UpdateProcessPutPayload { // For PUT /api/processes/[processId]
  name: string;
  shortDescription?: string | null;
  bpmnXml?: string | null;
  // Potentially arrays for full replacement of nodes/parameters if API supports
  // nodeList?: CreateNodePayload[]; // Or UpdateNodePayload[]
  // processParameters?: CreateProcessParameterPayload[]; // Or UpdateProcessParameterPayload[]
}

export type UpdateProcessPatchPayload = Partial<UpdateProcessPutPayload>;


// Node API Payloads
export interface CreateNodePayload {
  name: string;
  type: string;
  processId: string; // processId is part of the body for POST /api/node
  shortDescription?: string | null;
  bpmnId?: string | null;
  documentContent?: any | null;
  // parameters?: CreateProcessParameterPayload[]; // Removed: POST /api/node doesn't create parameters inline
}

export interface UpdateNodePayload { // For PATCH /api/node (body includes id)
  id: string; // ID of the node to update
  name?: string;
  type?: string;
  shortDescription?: string | null;
  bpmnId?: string | null;
  documentContent?: any | null;
  // parameters?: UpdateProcessParameterPayload[]; // Removed: Parameters are managed via process or specific parameter endpoints
}


// Process Parameter API Payloads
export interface CreateProcessParameterPayload { // Used for both node and process level
  name: string;
  type: string;
  mandatory: boolean;
  info?: string | null;
  options?: string[];
  nodeId?: string | null; // Specify if it's a node parameter
}

export interface UpdateProcessParameterPayload { // For PUT /api/processes/[processId]/parameters (if updating specific param)
  id: string; // Parameter ID
  name?: string;
  type?: string;
  mandatory?: boolean;
  info?: string | null;
  options?: string[];
}

// Process Dependency API Payloads
export interface CreateProcessDependencyPayload {
  parentProcessId: string;
  trigger?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string | number;
}

// Event interface, if needed globally, otherwise can be page-specific
export interface Event {
  id: string;
  name: string;
  playbookId: string; // Assuming an Event is tied to a Playbook
  description?: string;
  // Add other event fields as needed
}