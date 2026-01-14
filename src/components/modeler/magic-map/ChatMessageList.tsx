/**
 * ChatMessageList - Scrollable container for all messages
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useMagicMap } from './MagicMapContext';
import WelcomeMessage from './WelcomeMessage';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import ThinkingMessage from './ThinkingMessage';

interface ChatMessageListProps {
  onExampleClick: (prompt: string) => void;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ onExampleClick }) => {
  const { messages, isGenerating, userMessageCount } = useMagicMap();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        {/* Show welcome message if no user messages yet */}
        {userMessageCount === 0 && <WelcomeMessage onExampleClick={onExampleClick} />}

        {/* Render all messages */}
        {messages.map((message) => (
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : message.role === 'assistant' ? (
            <AssistantMessage key={message.id} message={message} />
          ) : null
        ))}

        {/* Show thinking indicator while generating */}
        {isGenerating && <ThinkingMessage />}

        {/* Scroll target */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatMessageList;
