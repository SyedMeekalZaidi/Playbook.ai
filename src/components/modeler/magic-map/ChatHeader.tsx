/**
 * ChatHeader - Magic Map header with title and Start Fresh button
 */

'use client';

import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMagicMap } from './MagicMapContext';

const ChatHeader: React.FC = () => {
  const { clearMessages } = useMagicMap();

  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-white/50 flex-shrink-0">
      {/* Left: Title with icon */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-gold" />
        </div>
        <h3 className="text-lg font-semibold text-oxford-blue">Magic Map</h3>
      </div>

      {/* Right: Start Fresh button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={clearMessages}
        className="text-muted-foreground hover:text-oxford-blue"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Start Fresh
      </Button>
    </div>
  );
};

export default ChatHeader;
