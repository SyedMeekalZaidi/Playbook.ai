/**
 * Magic Map Types - Shared type definitions for chat and diagram generation
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  xml?: string; // Optional: BPMN XML if AI generated a diagram
  processName?: string; // Optional: AI-suggested process name
  timestamp: Date;
}

export interface MagicMapState {
  messages: ChatMessage[];
  isGenerating: boolean;
  isEnhancing: boolean;
  userMessageCount: number;
  isLimitReached: boolean;
  expandedXml: string | null;
  expandedProcessName: string | null; // Suggested name for expanded diagram
}

export interface MagicMapContextType extends MagicMapState {
  // Actions
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
  enhancePrompt: (prompt: string) => Promise<string | null>;
  createProcess: (xml: string, name: string) => Promise<{ success: boolean; processId?: string; error?: string }>;
  setExpandedXml: (xml: string | null, processName?: string | null) => void; // Updated to accept optional processName
}
