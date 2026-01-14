/**
 * Type definitions for Node Details Panel
 * Used by useNodeDetails hook and related components
 */

// Parameter types supported in the editor
export type ParameterType = 'CHECKLIST' | 'SCALE' | 'NUMBER';

// Base interface for all parameters
export interface BaseParameter {
  id: string;
  type: ParameterType;
  question: string;
}

// Checklist parameter - multiple choice with checkboxes
export interface ChecklistParameter extends BaseParameter {
  type: 'CHECKLIST';
  options: ChecklistOption[];
}

export interface ChecklistOption {
  id: string;
  label: string;
  checked: boolean;
}

// Scale parameter - slider with range
export interface ScaleParameter extends BaseParameter {
  type: 'SCALE';
  min: number;
  max: number;
  unit?: string;
  current: number;
}

// Number parameter - numeric input
export interface NumberParameter extends BaseParameter {
  type: 'NUMBER';
  min?: number;
  max?: number;
  unit?: string;
  current: number;
}

// Union type for all parameter types
export type NodeParameter = ChecklistParameter | ScaleParameter | NumberParameter;

// Structure stored in Node.documentContent JSON field
export interface NodeDocumentContent {
  documentation: string; // HTML from Tiptap editor
  parameters: NodeParameter[];
}

// Save status for UI feedback
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Helper to create default empty document content
export const createDefaultDocumentContent = (): NodeDocumentContent => ({
  documentation: '',
  parameters: [],
});

// Helper to parse documentContent from database (handles null/undefined)
export const parseDocumentContent = (content: any): NodeDocumentContent => {
  if (!content) {
    return createDefaultDocumentContent();
  }
  
  // If it's a string, try to parse as JSON
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return {
        documentation: parsed.documentation || '',
        parameters: Array.isArray(parsed.parameters) ? parsed.parameters : [],
      };
    } catch {
      // If parsing fails, treat it as raw documentation HTML
      return {
        documentation: content,
        parameters: [],
      };
    }
  }
  
  // If it's already an object, extract fields
  return {
    documentation: content.documentation || '',
    parameters: Array.isArray(content.parameters) ? content.parameters : [],
  };
};

// Helper to create a new parameter with defaults
export const createParameter = (type: ParameterType): NodeParameter => {
  const id = crypto.randomUUID();
  
  switch (type) {
    case 'CHECKLIST':
      return {
        id,
        type: 'CHECKLIST',
        question: 'New checklist question',
        options: [
          { id: crypto.randomUUID(), label: 'Option 1', checked: false },
        ],
      };
    case 'SCALE':
      return {
        id,
        type: 'SCALE',
        question: 'New scale question',
        min: 1,
        max: 10,
        current: 5,
      };
    case 'NUMBER':
      return {
        id,
        type: 'NUMBER',
        question: 'New number question',
        current: 0,
      };
  }
};
