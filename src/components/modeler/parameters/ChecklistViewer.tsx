/**
 * ChecklistViewer - Preview mode component for CHECKLIST parameter type
 * Interactive checkboxes that update local state only
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ChecklistParameter, ChecklistOption } from '@/types/nodeDetails';

interface ChecklistViewerProps {
  parameter: ChecklistParameter;
  onLocalChange?: (options: ChecklistOption[]) => void;
}

const ChecklistViewer: React.FC<ChecklistViewerProps> = ({ parameter, onLocalChange }) => {
  const [options, setOptions] = useState<ChecklistOption[]>(parameter.options);

  // Sync with parameter when it changes
  useEffect(() => {
    setOptions(parameter.options);
  }, [parameter.options]);

  const handleToggle = (optionId: string) => {
    const newOptions = options.map(opt =>
      opt.id === optionId ? { ...opt, checked: !opt.checked } : opt
    );
    setOptions(newOptions);
    onLocalChange?.(newOptions);
  };

  const checkedCount = options.filter(opt => opt.checked).length;

  return (
    <div className="space-y-3">
      {/* Question */}
      <p className="text-sm font-medium text-foreground">{parameter.question}</p>
      
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-oxford-blue to-gold transition-all duration-300"
            style={{ width: `${(checkedCount / options.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {checkedCount}/{options.length}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
              option.checked
                ? 'bg-oxford-blue/5 border-oxford-blue/20'
                : 'bg-white border-border hover:border-oxford-blue/30'
            }`}
          >
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={option.checked}
                onChange={() => handleToggle(option.id)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  option.checked
                    ? 'bg-oxford-blue border-oxford-blue'
                    : 'bg-white border-muted-foreground/30'
                }`}
              >
                {option.checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className={`text-sm transition-all ${
              option.checked 
                ? 'text-oxford-blue font-medium' 
                : 'text-foreground'
            }`}>
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ChecklistViewer;
