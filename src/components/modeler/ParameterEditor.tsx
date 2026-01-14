/**
 * ParameterEditor - Main edit mode component for managing process parameters
 * Supports adding, editing, and deleting Checklist, Scale, and Number parameters
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Trash2, ChevronDown, CheckSquare, Gauge, Hash, GripVertical } from 'lucide-react';
import { 
  NodeParameter, 
  ParameterType, 
  ChecklistParameter, 
  ScaleParameter, 
  NumberParameter,
  createParameter,
} from '@/types/nodeDetails';
import ChecklistEditor from './parameters/ChecklistEditor';
import ScaleEditor from './parameters/ScaleEditor';
import NumberEditor from './parameters/NumberEditor';

interface ParameterEditorProps {
  parameters: NodeParameter[];
  onAdd: (param: NodeParameter) => void;
  onUpdate: (id: string, updates: Partial<NodeParameter>) => void;
  onRemove: (id: string) => void;
}

// Get icon for parameter type
const getParameterIcon = (type: ParameterType) => {
  switch (type) {
    case 'CHECKLIST':
      return <CheckSquare className="h-4 w-4" />;
    case 'SCALE':
      return <Gauge className="h-4 w-4" />;
    case 'NUMBER':
      return <Hash className="h-4 w-4" />;
  }
};

// Get label for parameter type
const getParameterLabel = (type: ParameterType) => {
  switch (type) {
    case 'CHECKLIST':
      return 'Checklist';
    case 'SCALE':
      return 'Scale';
    case 'NUMBER':
      return 'Number';
  }
};

// Single parameter card component
const ParameterCard: React.FC<{
  parameter: NodeParameter;
  onUpdate: (updates: Partial<NodeParameter>) => void;
  onRemove: () => void;
}> = ({ parameter, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-border rounded-lg bg-white overflow-hidden">
      {/* Card header */}
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-oxford-blue">{getParameterIcon(parameter.type)}</span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {getParameterLabel(parameter.type)}
          </span>
          <span className="text-sm text-foreground truncate">
            {parameter.question}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          title="Delete parameter"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <ChevronDown 
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`} 
        />
      </div>

      {/* Card content */}
      {isExpanded && (
        <div className="p-3 border-t border-border">
          {parameter.type === 'CHECKLIST' && (
            <ChecklistEditor
              parameter={parameter as ChecklistParameter}
              onChange={onUpdate}
            />
          )}
          {parameter.type === 'SCALE' && (
            <ScaleEditor
              parameter={parameter as ScaleParameter}
              onChange={onUpdate}
            />
          )}
          {parameter.type === 'NUMBER' && (
            <NumberEditor
              parameter={parameter as NumberParameter}
              onChange={onUpdate}
            />
          )}
        </div>
      )}
    </div>
  );
};

const ParameterEditor: React.FC<ParameterEditorProps> = ({
  parameters,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const handleAddParameter = (type: ParameterType) => {
    const newParam = createParameter(type);
    onAdd(newParam);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <span className="text-xs text-muted-foreground">
          {parameters.length} parameter{parameters.length !== 1 ? 's' : ''}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" />
              Add Parameter
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => handleAddParameter('CHECKLIST')}>
              <CheckSquare className="h-4 w-4 mr-2" />
              Checklist
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddParameter('SCALE')}>
              <Gauge className="h-4 w-4 mr-2" />
              Scale
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddParameter('NUMBER')}>
              <Hash className="h-4 w-4 mr-2" />
              Number
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Parameters list */}
      <div className="flex-1 overflow-y-auto">
        {parameters.length > 0 ? (
          <div className="space-y-3">
            {parameters.map((param) => (
              <ParameterCard
                key={param.id}
                parameter={param}
                onUpdate={(updates) => onUpdate(param.id, updates)}
                onRemove={() => onRemove(param.id)}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CheckSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              No parameters yet
            </p>
            <p className="text-xs text-muted-foreground">
              Click "Add Parameter" to create one
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterEditor;
