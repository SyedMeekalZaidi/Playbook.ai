/**
 * ParameterViewer - Preview mode component for displaying interactive parameters
 * Maps parameters to their respective viewer components
 */

'use client';

import React from 'react';
import { ListChecks } from 'lucide-react';
import { 
  NodeParameter, 
  ChecklistParameter, 
  ScaleParameter, 
  NumberParameter 
} from '@/types/nodeDetails';
import ChecklistViewer from './parameters/ChecklistViewer';
import ScaleViewer from './parameters/ScaleViewer';
import NumberViewer from './parameters/NumberViewer';

interface ParameterViewerProps {
  parameters: NodeParameter[];
}

const ParameterViewer: React.FC<ParameterViewerProps> = ({ parameters }) => {
  // Empty state
  if (parameters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <ListChecks className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No parameters configured.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Switch to Edit mode to add parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="space-y-4">
        {parameters.map((param) => (
          <div 
            key={param.id}
            className="p-4 rounded-lg border border-border bg-white"
          >
            {param.type === 'CHECKLIST' && (
              <ChecklistViewer
                parameter={param as ChecklistParameter}
              />
            )}
            {param.type === 'SCALE' && (
              <ScaleViewer
                parameter={param as ScaleParameter}
              />
            )}
            {param.type === 'NUMBER' && (
              <NumberViewer
                parameter={param as NumberParameter}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterViewer;
