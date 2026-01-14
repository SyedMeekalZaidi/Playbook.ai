/**
 * MagicMapTab - AI-powered diagram generation chat interface
 * Composes all chat UI components and manages diagram modal
 */

'use client';

import React from 'react';
import { useMagicMap } from './magic-map/MagicMapContext';
import ChatHeader from './magic-map/ChatHeader';
import ChatMessageList from './magic-map/ChatMessageList';
import ChatInput from './magic-map/ChatInput';
import DiagramModal from './magic-map/DiagramModal';

const MagicMapTab: React.FC = () => {
  const { expandedXml, expandedProcessName, setExpandedXml, createProcess, sendMessage } = useMagicMap();

  // Handle example prompt click from WelcomeMessage
  // Directly sends the message to the AI
  const handleExampleClick = async (prompt: string) => {
    await sendMessage(prompt);
  };

  // Handle process creation from modal
  const handleCreateProcess = async (xml: string, name: string) => {
    const result = await createProcess(xml, name);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create process');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <ChatHeader />

      {/* Message list (scrollable) */}
      <ChatMessageList onExampleClick={handleExampleClick} />

      {/* Input field (fixed bottom) */}
      <ChatInput />

      {/* Diagram modal (opens when diagram is clicked) */}
      <DiagramModal
        open={expandedXml !== null}
        onOpenChange={(open) => !open && setExpandedXml(null)}
        xml={expandedXml}
        suggestedName={expandedProcessName}
        onCreateProcess={handleCreateProcess}
      />
    </div>
  );
};

export default MagicMapTab;
