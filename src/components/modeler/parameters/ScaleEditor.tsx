/**
 * ScaleEditor - Edit mode component for SCALE parameter type
 * Allows editing question text, min/max values, and optional unit
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScaleParameter } from '@/types/nodeDetails';

interface ScaleEditorProps {
  parameter: ScaleParameter;
  onChange: (updates: Partial<ScaleParameter>) => void;
}

const ScaleEditor: React.FC<ScaleEditorProps> = ({ parameter, onChange }) => {
  const handleQuestionChange = (question: string) => {
    onChange({ question });
  };

  const handleMinChange = (value: string) => {
    const min = parseInt(value) || 0;
    // Ensure min is less than max
    if (min < parameter.max) {
      onChange({ min, current: Math.max(min, parameter.current) });
    }
  };

  const handleMaxChange = (value: string) => {
    const max = parseInt(value) || 10;
    // Ensure max is greater than min
    if (max > parameter.min) {
      onChange({ max, current: Math.min(max, parameter.current) });
    }
  };

  const handleUnitChange = (unit: string) => {
    onChange({ unit: unit || undefined });
  };

  return (
    <div className="space-y-3">
      {/* Question input */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Question</Label>
        <Input
          value={parameter.question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder="Enter your question..."
          className="text-sm"
        />
      </div>

      {/* Min/Max/Unit row */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Min</Label>
          <Input
            type="number"
            value={parameter.min}
            onChange={(e) => handleMinChange(e.target.value)}
            className="text-sm h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Max</Label>
          <Input
            type="number"
            value={parameter.max}
            onChange={(e) => handleMaxChange(e.target.value)}
            className="text-sm h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Unit (optional)</Label>
          <Input
            value={parameter.unit || ''}
            onChange={(e) => handleUnitChange(e.target.value)}
            placeholder="e.g., %"
            className="text-sm h-8"
          />
        </div>
      </div>

      {/* Preview of scale */}
      <div className="pt-2">
        <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-6 text-right">{parameter.min}</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
          <span className="text-xs text-muted-foreground w-6">{parameter.max}</span>
          {parameter.unit && (
            <span className="text-xs text-muted-foreground">({parameter.unit})</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScaleEditor;
