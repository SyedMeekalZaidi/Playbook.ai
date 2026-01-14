/**
 * useNodeDetails - Hook for managing node documentation and parameters
 * Handles local state, auto-save, and save-on-switch functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeAPI } from '@/services/api';
import {
  NodeDocumentContent,
  NodeParameter,
  SaveStatus,
  parseDocumentContent,
} from '@/types/nodeDetails';

interface SelectedElement {
  element: {
    id: string;
    type: string;
    businessObject?: {
      name?: string;
      dbId?: string;
    };
  };
  databaseInfo?: {
    id: string;
    name: string;
    type: string;
    documentContent?: any;
  } | null;
}

interface UseNodeDetailsOptions {
  autoSaveDelay?: number; // Default: 3000ms
}

interface UseNodeDetailsReturn {
  // State
  documentation: string;
  parameters: NodeParameter[];
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  nodeId: string | null;
  nodeName: string;
  nodeType: string;
  
  // Actions
  setDocumentation: (html: string) => void;
  setParameters: (params: NodeParameter[]) => void;
  updateParameter: (id: string, updates: Partial<NodeParameter>) => void;
  addParameter: (param: NodeParameter) => void;
  removeParameter: (id: string) => void;
  saveNow: () => Promise<void>;
}

export const useNodeDetails = (
  selectedElement: SelectedElement | null,
  options: UseNodeDetailsOptions = {}
): UseNodeDetailsReturn => {
  const { autoSaveDelay = 3000 } = options;

  // State
  const [documentation, setDocumentationState] = useState<string>('');
  const [parameters, setParametersState] = useState<NodeParameter[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Refs for tracking previous node and timeouts
  const previousNodeIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<{
    nodeId: string;
    documentation: string;
    parameters: NodeParameter[];
  } | null>(null);

  // Extract node info from selectedElement
  const nodeId = selectedElement?.databaseInfo?.id || null;
  const nodeName = selectedElement?.element?.businessObject?.name || 
                   selectedElement?.databaseInfo?.name || 
                   'Unnamed Node';
  const nodeType = selectedElement?.databaseInfo?.type || 
                   selectedElement?.element?.type || 
                   'unknown';

  // Save function
  const saveNodeDetails = useCallback(async (
    targetNodeId: string,
    doc: string,
    params: NodeParameter[]
  ): Promise<boolean> => {
    if (!targetNodeId) return false;

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      const documentContent: NodeDocumentContent = {
        documentation: doc,
        parameters: params,
      };

      await NodeAPI.update({
        id: targetNodeId,
        documentContent,
      });

      setSaveStatus('saved');
      
      // Reset to idle after showing "saved" for 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 2000);

      return true;
    } catch (error) {
      console.error('[useNodeDetails] Save failed:', error);
      setSaveStatus('error');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Save now (manual trigger)
  const saveNow = useCallback(async () => {
    if (!nodeId || !isDirty) return;

    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const success = await saveNodeDetails(nodeId, documentation, parameters);
    if (success) {
      setIsDirty(false);
      pendingSaveRef.current = null;
    }
  }, [nodeId, isDirty, documentation, parameters, saveNodeDetails]);

  // Update documentation
  const setDocumentation = useCallback((html: string) => {
    setDocumentationState(html);
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Update all parameters
  const setParameters = useCallback((params: NodeParameter[]) => {
    setParametersState(params);
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Update a single parameter
  const updateParameter = useCallback((id: string, updates: Partial<NodeParameter>) => {
    setParametersState(prev => 
      prev.map(p => p.id === id ? { ...p, ...updates } as NodeParameter : p)
    );
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Add a new parameter
  const addParameter = useCallback((param: NodeParameter) => {
    setParametersState(prev => [...prev, param]);
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Remove a parameter
  const removeParameter = useCallback((id: string) => {
    setParametersState(prev => prev.filter(p => p.id !== id));
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // Load data when selectedElement changes
  useEffect(() => {
    const currentNodeId = selectedElement?.databaseInfo?.id || null;
    const previousNodeId = previousNodeIdRef.current;

    // Save previous node's data if dirty before switching
    if (previousNodeId && previousNodeId !== currentNodeId && pendingSaveRef.current) {
      const { nodeId: prevId, documentation: prevDoc, parameters: prevParams } = pendingSaveRef.current;
      
      // Fire and forget - save previous node
      saveNodeDetails(prevId, prevDoc, prevParams).then(success => {
        if (success) {
          pendingSaveRef.current = null;
        }
      });
    }

    // Clear any pending auto-save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Load new node data
    if (selectedElement?.databaseInfo) {
      const content = parseDocumentContent(selectedElement.databaseInfo.documentContent);
      setDocumentationState(content.documentation);
      setParametersState(content.parameters);
      setIsDirty(false);
      setSaveStatus('idle');
    } else {
      // No node selected - reset state
      setDocumentationState('');
      setParametersState([]);
      setIsDirty(false);
      setSaveStatus('idle');
    }

    // Update previous node reference
    previousNodeIdRef.current = currentNodeId;
  }, [selectedElement?.databaseInfo?.id, saveNodeDetails]);

  // Track pending changes for save-on-switch
  useEffect(() => {
    if (isDirty && nodeId) {
      pendingSaveRef.current = {
        nodeId,
        documentation,
        parameters,
      };
    }
  }, [isDirty, nodeId, documentation, parameters]);

  // Auto-save effect (debounced)
  useEffect(() => {
    if (!isDirty || !nodeId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveNodeDetails(nodeId, documentation, parameters);
      if (success) {
        setIsDirty(false);
        pendingSaveRef.current = null;
      }
    }, autoSaveDelay);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, nodeId, documentation, parameters, autoSaveDelay, saveNodeDetails]);

  // Cleanup on unmount - save if dirty
  useEffect(() => {
    return () => {
      if (pendingSaveRef.current) {
        const { nodeId: id, documentation: doc, parameters: params } = pendingSaveRef.current;
        // Note: This is async but we can't await in cleanup
        // The save might not complete before unmount, but it's best effort
        saveNodeDetails(id, doc, params);
      }
    };
  }, [saveNodeDetails]);

  return {
    documentation,
    parameters,
    isDirty,
    isSaving,
    saveStatus,
    nodeId,
    nodeName,
    nodeType,
    setDocumentation,
    setParameters,
    updateParameter,
    addParameter,
    removeParameter,
    saveNow,
  };
};
