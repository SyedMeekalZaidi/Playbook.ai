/**
 * ScaleViewer - Preview mode component for SCALE parameter type
 * Gradient slider (red → yellow → green) with draggable thumb
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScaleParameter } from '@/types/nodeDetails';

interface ScaleViewerProps {
  parameter: ScaleParameter;
  onLocalChange?: (value: number) => void;
}

const ScaleViewer: React.FC<ScaleViewerProps> = ({ parameter, onLocalChange }) => {
  const [value, setValue] = useState(parameter.current);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Sync with parameter when it changes
  useEffect(() => {
    setValue(parameter.current);
  }, [parameter.current]);

  const calculateValue = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = Math.round(parameter.min + percentage * (parameter.max - parameter.min));
    return newValue;
  }, [parameter.min, parameter.max, value]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const newValue = calculateValue(e.clientX);
    setValue(newValue);
    onLocalChange?.(newValue);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newValue = calculateValue(e.clientX);
    setValue(newValue);
    onLocalChange?.(newValue);
  }, [isDragging, calculateValue, onLocalChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse events for dragging
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

  const percentage = ((value - parameter.min) / (parameter.max - parameter.min)) * 100;

  // Get color based on percentage (red → yellow → green)
  const getThumbColor = () => {
    if (percentage < 50) {
      // Red to yellow
      const ratio = percentage / 50;
      return `rgb(${239}, ${Math.round(68 + ratio * (171))}, ${Math.round(68 * (1 - ratio))})`;
    } else {
      // Yellow to green
      const ratio = (percentage - 50) / 50;
      return `rgb(${Math.round(234 - ratio * (234 - 34))}, ${Math.round(179 + ratio * (18))}, ${Math.round(8 + ratio * (86))})`;
    }
  };

  return (
    <div className="space-y-3">
      {/* Question */}
      <p className="text-sm font-medium text-foreground">{parameter.question}</p>

      {/* Value pill */}
      <div className="flex justify-center">
        <div 
          className="px-4 py-1.5 rounded-full text-white font-semibold text-sm shadow-md transition-colors"
          style={{ backgroundColor: getThumbColor() }}
        >
          {value}{parameter.unit ? ` ${parameter.unit}` : ''}
        </div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <div 
          ref={trackRef}
          className="gradient-slider-track relative cursor-pointer"
          onMouseDown={handleMouseDown}
        >
          {/* Thumb */}
          <div
            className={`absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 transform -translate-x-1/2 -translate-y-1/2 transition-shadow ${
              isDragging ? 'scale-110 shadow-xl' : 'hover:scale-105'
            }`}
            style={{ 
              left: `${percentage}%`,
              borderColor: getThumbColor(),
            }}
          />
        </div>

        {/* Min/Max labels */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground">{parameter.min}</span>
          <span className="text-xs text-muted-foreground">{parameter.max}</span>
        </div>
      </div>
    </div>
  );
};

export default ScaleViewer;
