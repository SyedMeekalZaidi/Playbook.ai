/**
 * NumberViewer - Preview mode component for NUMBER parameter type
 * Number input with optional slider for bounded values
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';
import { NumberParameter } from '@/types/nodeDetails';

interface NumberViewerProps {
  parameter: NumberParameter;
  onLocalChange?: (value: number) => void;
}

const NumberViewer: React.FC<NumberViewerProps> = ({ parameter, onLocalChange }) => {
  const [value, setValue] = useState(parameter.current);
  const [inputValue, setInputValue] = useState(String(parameter.current)); // String for text input
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const hasBounds = parameter.min !== undefined && parameter.max !== undefined;

  // Sync with parameter when it changes
  useEffect(() => {
    setValue(parameter.current);
    setInputValue(String(parameter.current));
  }, [parameter.current]);

  const clampValue = (v: number) => {
    let result = v;
    if (parameter.min !== undefined) result = Math.max(parameter.min, result);
    if (parameter.max !== undefined) result = Math.min(parameter.max, result);
    return result;
  };

  // Update both states and notify parent
  const updateValue = (newValue: number) => {
    const clamped = clampValue(newValue);
    setValue(clamped);
    setInputValue(String(clamped));
    onLocalChange?.(clamped);
  };

  // Handle text input changes - allow any input while typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputValue(text); // Allow any text while typing
    
    // If it's a valid number, update the actual value
    const parsed = parseInt(text);
    if (!isNaN(parsed)) {
      const clamped = clampValue(parsed);
      setValue(clamped);
      onLocalChange?.(clamped);
    }
  };

  // On blur, ensure we have a valid value
  const handleInputBlur = () => {
    const parsed = parseInt(inputValue);
    if (isNaN(parsed) || inputValue.trim() === '') {
      // Reset to default (min or 0)
      const defaultValue = parameter.min ?? 0;
      updateValue(defaultValue);
    } else {
      // Ensure displayed value matches clamped value
      const clamped = clampValue(parsed);
      setInputValue(String(clamped));
    }
  };

  const handleIncrement = () => {
    updateValue(value + 1);
  };

  const handleDecrement = () => {
    updateValue(value - 1);
  };

  // Slider functionality for bounded values
  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current || !hasBounds) return value;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round(parameter.min! + percentage * (parameter.max! - parameter.min!));
    return newValue;
  }, [parameter.min, parameter.max, hasBounds, value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!hasBounds) return;
    e.preventDefault();
    setIsDragging(true);
    const newValue = calculateValue(e.clientX);
    updateValue(newValue);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newValue = calculateValue(e.clientX);
    setValue(newValue);
    setInputValue(String(newValue));
    onLocalChange?.(newValue);
  }, [isDragging, calculateValue, onLocalChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const percentage = hasBounds 
    ? ((value - parameter.min!) / (parameter.max! - parameter.min!)) * 100 
    : 50;

  return (
    <div className="space-y-3">
      {/* Question */}
      <p className="text-sm font-medium text-foreground">{parameter.question}</p>

      {/* Number input with +/- buttons */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={parameter.min !== undefined && value <= parameter.min}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        
        <div className="relative">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-24 h-12 text-center text-lg font-semibold pr-8"
          />
          {parameter.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {parameter.unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={parameter.max !== undefined && value >= parameter.max}
          className="w-10 h-10 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Slider for bounded values */}
      {hasBounds && (
        <div className="px-2">
          <div 
            ref={trackRef}
            className="h-2 bg-gradient-to-r from-oxford-blue/20 via-oxford-blue/50 to-oxford-blue rounded-full relative cursor-pointer"
            onMouseDown={handleMouseDown}
          >
            {/* Thumb */}
            <div
              className={`absolute top-1/2 w-4 h-4 bg-oxford-blue rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2 transition-shadow ${
                isDragging ? 'scale-110 shadow-lg' : 'hover:scale-105'
              }`}
              style={{ left: `${percentage}%` }}
            />
          </div>

          {/* Min/Max labels */}
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              {parameter.min}{parameter.unit ? ` ${parameter.unit}` : ''}
            </span>
            <span className="text-xs text-muted-foreground">
              {parameter.max}{parameter.unit ? ` ${parameter.unit}` : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberViewer;
