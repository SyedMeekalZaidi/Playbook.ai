/**
 * NodeEditorTab - Content for the Node Editor tab in the right sidebar
 * Contains header with Edit/Preview toggle, and split view for Documentation & Parameters
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  ListChecks, 
  Edit3, 
  Eye, 
  Loader2, 
  Check, 
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NodeParameter, SaveStatus, ParameterType } from '@/types/nodeDetails';
import DocumentationEditor from './DocumentationEditor';
import DocumentationViewer from './DocumentationViewer';
import ParameterEditor from './ParameterEditor';
import ParameterViewer from './ParameterViewer';

type ViewMode = 'edit' | 'preview';

interface NodeEditorTabProps {
  nodeId: string | null;
  nodeName: string;
  nodeType: string;
  documentation: string;
  setDocumentation: (html: string) => void;
  parameters: NodeParameter[];
  setParameters: (params: NodeParameter[]) => void;
  updateParameter: (id: string, updates: Partial<NodeParameter>) => void;
  addParameter: (param: NodeParameter) => void;
  removeParameter: (id: string) => void;
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  saveNow: () => Promise<void>;
}

// Save status indicator component with retry button
const SaveStatusIndicator: React.FC<{ 
  status: SaveStatus; 
  isSaving: boolean;
  onRetry?: () => void;
}> = ({ status, isSaving, onRetry }) => {
  if (isSaving) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  switch (status) {
    case 'saved':
      return (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          <span>Saved</span>
        </div>
      );
    case 'error':
      return (
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </div>
          {onRetry && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRetry}
              className="h-6 px-1.5 text-xs text-destructive hover:text-destructive"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      );
    default:
      return null;
  }
};

// Edit/Preview toggle component
const ModeToggle: React.FC<{ mode: ViewMode; onChange: (mode: ViewMode) => void }> = ({ mode, onChange }) => {
  return (
    <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
      <button
        type="button"
        onClick={() => onChange('edit')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'edit'
            ? 'bg-white text-oxford-blue shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Edit3 className="h-3.5 w-3.5" />
        Edit
      </button>
      <button
        type="button"
        onClick={() => onChange('preview')}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
          mode === 'preview'
            ? 'bg-white text-oxford-blue shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        Preview
      </button>
    </div>
  );
};

// Documentation section component
const DocumentationSection: React.FC<{
  documentation: string;
  setDocumentation: (html: string) => void;
  mode: ViewMode;
}> = ({ documentation, setDocumentation, mode }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <FileText className="h-4 w-4 text-oxford-blue" />
        <h3 className="text-sm font-medium text-oxford-blue">Documentation</h3>
      </div>
      <div className="flex-1 min-h-0">
        {mode === 'edit' ? (
          <DocumentationEditor
            content={documentation}
            onChange={setDocumentation}
            placeholder="Add documentation for this step..."
          />
        ) : (
          <div className="h-full rounded-lg border border-border bg-white overflow-hidden">
            <DocumentationViewer content={documentation} />
          </div>
        )}
      </div>
    </div>
  );
};

// Parameters section component
const ParametersSection: React.FC<{
  parameters: NodeParameter[];
  setParameters: (params: NodeParameter[]) => void;
  updateParameter: (id: string, updates: Partial<NodeParameter>) => void;
  addParameter: (param: NodeParameter) => void;
  removeParameter: (id: string) => void;
  mode: ViewMode;
}> = ({ parameters, updateParameter, addParameter, removeParameter, mode }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <ListChecks className="h-4 w-4 text-oxford-blue" />
        <h3 className="text-sm font-medium text-oxford-blue">Process Parameters</h3>
      </div>
      <div className="flex-1 min-h-0">
        {mode === 'edit' ? (
          <ParameterEditor
            parameters={parameters}
            onAdd={addParameter}
            onUpdate={updateParameter}
            onRemove={removeParameter}
          />
        ) : (
          <div className="h-full rounded-lg border border-border bg-white overflow-hidden">
            <ParameterViewer parameters={parameters} />
          </div>
        )}
      </div>
    </div>
  );
};

// Main component
const NodeEditorTab: React.FC<NodeEditorTabProps> = ({
  nodeId,
  nodeName,
  nodeType,
  documentation,
  setDocumentation,
  parameters,
  setParameters,
  updateParameter,
  addParameter,
  removeParameter,
  isDirty,
  isSaving,
  saveStatus,
  saveNow,
}) => {
  const [mode, setMode] = useState<ViewMode>('edit');
  const [fadeKey, setFadeKey] = useState(0);

  // Trigger fade animation when node changes
  useEffect(() => {
    setFadeKey(prev => prev + 1);
  }, [nodeId]);

  // Keyboard shortcut: Cmd/Ctrl+S to save
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (isDirty && !isSaving) {
        saveNow();
      }
    }
  }, [isDirty, isSaving, saveNow]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header with node name, mode toggle, and save status */}
        <div className="px-4 py-3 border-b border-border bg-white/50">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <h2 className="text-base font-semibold text-oxford-blue truncate cursor-default">
                    {nodeName}
                  </h2>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start">
                  <p>{nodeName}</p>
                </TooltipContent>
              </Tooltip>
              <p className="text-xs text-muted-foreground">
                {nodeType}
                {isDirty && <span className="ml-2 text-gold">• Unsaved</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <SaveStatusIndicator 
                status={saveStatus} 
                isSaving={isSaving} 
                onRetry={saveStatus === 'error' ? saveNow : undefined}
              />
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
          </div>
        </div>

        {/* Content area - split between Documentation and Parameters */}
        <div 
          key={fadeKey}
          className="flex-1 flex flex-col overflow-hidden p-4 gap-4 node-content-fade-in node-details-scrollbar"
        >
          {/* Documentation - top half */}
          <div className="flex-1 min-h-0">
            <DocumentationSection
              documentation={documentation}
              setDocumentation={setDocumentation}
              mode={mode}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-border flex-shrink-0" />

          {/* Parameters - bottom half */}
          <div className="flex-1 min-h-0">
            <ParametersSection
              parameters={parameters}
              setParameters={setParameters}
              updateParameter={updateParameter}
              addParameter={addParameter}
              removeParameter={removeParameter}
              mode={mode}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NodeEditorTab;
