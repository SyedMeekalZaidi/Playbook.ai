/**
 * ChatInput - Input field with Enhance and Send buttons
 */

'use client';

import React, { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMagicMap } from './MagicMapContext';

const ChatInput: React.FC = () => {
  const {
    sendMessage,
    enhancePrompt,
    isGenerating,
    isEnhancing,
    isLimitReached,
  } = useMagicMap();

  const [inputValue, setInputValue] = useState('');

  // Handle send
  const handleSend = async () => {
    if (!inputValue.trim() || isGenerating) return;

    await sendMessage(inputValue.trim());
    setInputValue(''); // Clear input after sending
  };

  // Handle enhance
  const handleEnhance = async () => {
    if (!inputValue.trim() || isEnhancing) return;

    const enhanced = await enhancePrompt(inputValue.trim());
    if (enhanced) {
      setInputValue(enhanced); // Replace input with enhanced version
    }
  };

  // Handle Enter key (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // If limit reached, show disabled state
  if (isLimitReached) {
    return (
      <div className="p-4 border-t border-border bg-muted/30 flex-shrink-0">
        <div className="flex flex-col items-center gap-2 py-2">
          <p className="text-sm text-muted-foreground text-center">
            For accurate diagram creation, please start a new chat
          </p>
          <p className="text-xs text-muted-foreground">(5 message limit reached)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-border bg-white/50 flex-shrink-0">
      {/* Input and Buttons */}
      <div className="flex items-end gap-2">
        <Textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your process... (e.g., 'Patient registration with eligibility check')"
          disabled={isGenerating}
          className="flex-1 min-h-[100px] max-h-[200px] resize-none"
        />
        
        {/* Button Stack - Enhance on top, Send on bottom */}
        <div className="flex flex-col gap-1.5">
          {/* Enhance Button with Tooltip */}
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleEnhance}
                  disabled={!inputValue.trim() || isEnhancing || isGenerating}
                  className="h-9 w-9 border-gold/30 text-gold hover:text-gold hover:bg-gold/10 hover:border-gold/50"
                >
                  {isEnhancing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="left"
                className="bg-oxford-blue text-white border-oxford-blue shadow-lg max-w-[200px]"
              >
                <p className="text-xs font-medium">Enhance Prompt</p>
                <p className="text-xs opacity-90 mt-0.5">
                  AI improves your description for better diagram results
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isGenerating}
            size="icon"
            className="bg-oxford-blue hover:bg-oxford-blue/90 h-9 w-9"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default ChatInput;
