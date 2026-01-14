/**
 * NumberEditor - Edit mode component for NUMBER parameter type
 * Allows editing question text, optional min/max values, and optional unit
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberParameter } from '@/types/nodeDetails';

interface NumberEditorProps {
  parameter: NumberParameter;
  onChange: (updates: Partial<NumberParameter>) => void;
}

const NumberEditor: React.FC<NumberEditorProps> = ({ parameter, onChange }) => {
  const handleQuestionChange = (question: string) => {
    onChange({ question });
  };

  const handleMinChange = (value: string) => {
    if (value === '') {
      onChange({ min: undefined });
      return;
    }
    const min = parseInt(value);
    if (!isNaN(min)) {
      // If max exists, ensure min is less than max
      if (parameter.max === undefined || min < parameter.max) {
        onChange({ min });
      }
    }
  };

  const handleMaxChange = (value: string) => {
    if (value === '') {
      onChange({ max: undefined });
      return;
    }
    const max = parseInt(value);
    if (!isNaN(max)) {
      // If min exists, ensure max is greater than min
      if (parameter.min === undefined || max > parameter.min) {
        onChange({ max });
      }
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
          <Label className="text-xs text-muted-foreground mb-1 block">Min (optional)</Label>
          <Input
            type="number"
            value={parameter.min ?? ''}
            onChange={(e) => handleMinChange(e.target.value)}
            placeholder="—"
            className="text-sm h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Max (optional)</Label>
          <Input
            type="number"
            value={parameter.max ?? ''}
            onChange={(e) => handleMaxChange(e.target.value)}
            placeholder="—"
            className="text-sm h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Unit (optional)</Label>
          <Input
            value={parameter.unit || ''}
            onChange={(e) => handleUnitChange(e.target.value)}
            placeholder="e.g., kg"
            className="text-sm h-8"
          />
        </div>
      </div>

      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        Leave min/max empty for unrestricted input.
        {parameter.min !== undefined && parameter.max !== undefined && (
          <span className="ml-1">
            Range: {parameter.min} - {parameter.max}
            {parameter.unit && ` ${parameter.unit}`}
          </span>
        )}
      </p>
    </div>
  );
};

export default NumberEditor;
