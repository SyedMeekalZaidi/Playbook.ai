/**
 * ChecklistEditor - Edit mode component for CHECKLIST parameter type
 * Allows editing question text and managing checklist options
 */

'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X, GripVertical } from 'lucide-react';
import { ChecklistParameter, ChecklistOption } from '@/types/nodeDetails';

interface ChecklistEditorProps {
  parameter: ChecklistParameter;
  onChange: (updates: Partial<ChecklistParameter>) => void;
}

const ChecklistEditor: React.FC<ChecklistEditorProps> = ({ parameter, onChange }) => {
  const handleQuestionChange = (question: string) => {
    onChange({ question });
  };

  const handleOptionLabelChange = (optionId: string, label: string) => {
    const newOptions = parameter.options.map(opt =>
      opt.id === optionId ? { ...opt, label } : opt
    );
    onChange({ options: newOptions });
  };

  const handleAddOption = () => {
    const newOption: ChecklistOption = {
      id: crypto.randomUUID(),
      label: `Option ${parameter.options.length + 1}`,
      checked: false,
    };
    onChange({ options: [...parameter.options, newOption] });
  };

  const handleRemoveOption = (optionId: string) => {
    if (parameter.options.length <= 1) return; // Keep at least one option
    const newOptions = parameter.options.filter(opt => opt.id !== optionId);
    onChange({ options: newOptions });
  };

  return (
    <div className="space-y-3">
      {/* Question input */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Question</label>
        <Input
          value={parameter.question}
          onChange={(e) => handleQuestionChange(e.target.value)}
          placeholder="Enter your question..."
          className="text-sm"
        />
      </div>

      {/* Options list */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Options</label>
        <div className="space-y-2">
          {parameter.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2 group">
              <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              <div className="w-5 h-5 rounded border-2 border-muted-foreground/30 flex-shrink-0" />
              <Input
                value={option.label}
                onChange={(e) => handleOptionLabelChange(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="text-sm h-8 flex-1"
              />
              <button
                type="button"
                onClick={() => handleRemoveOption(option.id)}
                className={`p-1 text-muted-foreground hover:text-destructive transition-colors ${
                  parameter.options.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                }`}
                disabled={parameter.options.length <= 1}
                title={parameter.options.length <= 1 ? 'At least one option required' : 'Remove option'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddOption}
          className="mt-2 h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add option
        </Button>
      </div>
    </div>
  );
};

export default ChecklistEditor;
