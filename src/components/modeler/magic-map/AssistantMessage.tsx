/**
 * AssistantMessage - Display AI responses (with optional diagram preview)
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './types';
import { AlertCircle } from 'lucide-react';
import DiagramPreview from './DiagramPreview';
import { useMagicMap } from './MagicMapContext';

interface AssistantMessageProps {
  message: ChatMessage;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  const { setExpandedXml } = useMagicMap();

  // Check if message is an error (no XML and contains error keywords)
  const isError = !message.xml && (
    message.content.toLowerCase().includes('error') ||
    message.content.toLowerCase().includes('couldn\'t') ||
    message.content.toLowerCase().includes('failed') ||
    message.content.toLowerCase().includes('sorry')
  );

  const handleDiagramClick = () => {
    if (message.xml) {
      setExpandedXml(message.xml, message.processName);
    }
  };

  return (
    <motion.div
      className="flex items-start gap-3 mb-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
        <span className="text-gold text-sm">✨</span>
      </div>

      <div className="flex-1 max-w-[80%]">
        {/* Message bubble */}
        <div className={`rounded-lg rounded-tl-sm px-4 py-3 ${
          isError ? 'bg-red-50 border border-red-200' : 'bg-muted'
        }`}>
          {isError && (
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-red-700">Error</span>
            </div>
          )}
          <p className="text-sm whitespace-pre-wrap break-words text-foreground">
            {message.content}
          </p>
        </div>

        {/* Diagram preview with process name */}
        {message.xml && (
          <div className="mt-3">
            {/* AI-suggested process name */}
            {message.processName && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Suggested:</span>
                <span className="text-sm font-semibold text-oxford-blue">
                  {message.processName}
                </span>
              </div>
            )}
            
            {/* Diagram preview */}
            <DiagramPreview xml={message.xml} onClick={handleDiagramClick} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AssistantMessage;
