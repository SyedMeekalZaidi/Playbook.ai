/**
 * WelcomeMessage - Initial greeting with example prompts
 */

'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeMessageProps {
  onExampleClick: (prompt: string) => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onExampleClick }) => {
  // Pre-defined healthcare example prompts
  const examples = [
    "Patient registration with identity verification, insurance eligibility check, and room assignment",
    "Cervical cancer screening process starts with patient check-in and then we conduct HPV test. If the test is Negative, end the process with Routine Rescreening. If Positive, perform Visual Inspection. If the inspection is normal, Schedule Short-term Follow-up; if abnormal, Refer to Specialist for treatment. End the process.",
    "Site assessment with parallel preparation tasks: safety check, equipment setup, and staff notification"
  ];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Icon with glow */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-gold" />
        </div>
      </div>

      {/* Welcome text */}
      <h3 className="text-xl font-semibold text-oxford-blue mb-2">
        Welcome to Magic Map
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
        Describe your process in natural language and I'll create a BPMN diagram for you.
      </p>

      {/* Example prompts */}
      <div className="w-full max-w-[320px] space-y-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Try these examples:
        </p>
        {examples.map((example, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onExampleClick(example)}
            className="w-full text-left justify-start h-auto py-3 px-4 border-gold/20 hover:border-gold/40 hover:bg-gold/5 text-xs"
          >
            <span className="text-gold mr-2">✨</span>
            <span className="text-foreground line-clamp-2">{example}</span>
          </Button>
        ))}
      </div>

      {/* Instruction hint */}
      <p className="text-xs text-muted-foreground mt-6 max-w-[300px]">
        Use the <span className="font-medium text-gold">✨ Enhance</span> button to improve your prompt before generating.
      </p>
    </div>
  );
};

export default WelcomeMessage;
