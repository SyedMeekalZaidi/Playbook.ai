/**
 * Magic Map Context - Chat state management
 * Handles messages, AI interactions, and process creation
 * Placed at NodeDetailsPanel level to survive tab switches
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ChatMessage, MagicMapState, MagicMapContextType } from './types';

// Create context
const MagicMapContext = createContext<MagicMapContextType | undefined>(undefined);

// Provider props
interface MagicMapProviderProps {
  children: React.ReactNode;
  playbookId: string;
  onProcessCreated: (processId: string) => void;
}

// Provider component
export const MagicMapProvider: React.FC<MagicMapProviderProps> = ({
  children,
  playbookId,
  onProcessCreated,
}) => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [expandedXml, setExpandedXmlState] = useState<string | null>(null);
  const [expandedProcessName, setExpandedProcessName] = useState<string | null>(null);

  // Computed: User message count (for 5-message limit)
  const userMessageCount = useMemo(() => {
    return messages.filter(msg => msg.role === 'user').length;
  }, [messages]);

  // Computed: Limit reached
  const isLimitReached = userMessageCount >= 5;

  // Action: Add message
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Action: Clear messages (Start Fresh)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setExpandedXmlState(null);
    setExpandedProcessName(null);
  }, []);

  // Action: Send message (generate diagram)
  const sendMessage = useCallback(async (content: string) => {
    const startTime = performance.now();
    console.log('[Magic Map] 🚀 Generation started');
    console.log('[Magic Map] Prompt:', content);
    
    // Optimistically add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    // Set generating state
    setIsGenerating(true);

    try {
      // Prepare messages for API (include conversation history)
      const messagesToSend = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      console.log('[Magic Map] 📤 Sending to API:', {
        messageCount: messagesToSend.length,
        conversationHistory: messagesToSend.map(m => `${m.role}: ${m.content.substring(0, 50)}...`)
      });

      // Call generate API
      const response = await fetch('/api/magic-map/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesToSend }),
      });
      
      const fetchTime = performance.now();
      console.log('[Magic Map] 📥 API response received', {
        status: response.status,
        statusText: response.statusText,
        timeMs: Math.round(fetchTime - startTime)
      });

      const data = await response.json();
      
      console.log('[Magic Map] 📋 Response data:', {
        valid: data.valid,
        hasXml: !!data.xml,
        xmlLength: data.xml?.length || 0,
        processName: data.processName,
        message: data.message,
        error: data.error
      });

      // Handle response
      if (response.ok && data.valid && data.xml) {
        console.log('[Magic Map] ✅ Generation successful');
        console.log('[Magic Map] Process Name:', data.processName);
        console.log('[Magic Map] ===== FULL XML OUTPUT =====');
        console.log(data.xml);
        console.log('[Magic Map] ===== END XML OUTPUT =====');
        
        // Success: Add assistant message with diagram
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message || 'Here\'s your diagram:',
          xml: data.xml,
          processName: data.processName,
          timestamp: new Date(),
        };
        addMessage(assistantMessage);
        
        const totalTime = performance.now() - startTime;
        console.log('[Magic Map] 🎉 Total generation time:', Math.round(totalTime), 'ms');
      } else {
        console.log('[Magic Map] ❌ Generation failed:', data.error);
        
        // Error: Add assistant error message
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.error || 'Sorry, I couldn\'t create that diagram. Try describing a simpler workflow.',
          timestamp: new Date(),
        };
        addMessage(errorMessage);
      }
    } catch (error) {
      console.error('[Magic Map] 💥 Network/Parse error:', error);
      console.error('[Magic Map] Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack?.split('\n').slice(0, 3)
      });
      
      // Network error: Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Connection error. Please check your internet and try again.',
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, addMessage]);

  // Action: Enhance prompt
  const enhancePrompt = useCallback(async (prompt: string): Promise<string | null> => {
    console.log('[Magic Map] ✨ Enhancement started');
    console.log('[Magic Map] Original prompt:', prompt);
    
    setIsEnhancing(true);

    try {
      const response = await fetch('/api/magic-map/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      console.log('[Magic Map] Enhancement response:', {
        status: response.status,
        hasEnhanced: !!data.enhancedPrompt
      });

      if (response.ok && data.enhancedPrompt) {
        console.log('[Magic Map] ✅ Enhanced prompt:', data.enhancedPrompt);
        return data.enhancedPrompt;
      } else {
        console.error('[Magic Map] ❌ Enhancement failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('[Magic Map] 💥 Enhancement error:', error);
      return null;
    } finally {
      setIsEnhancing(false);
    }
  }, []);

  // Action: Create process
  const createProcess = useCallback(async (
    xml: string,
    name: string
  ): Promise<{ success: boolean; processId?: string; error?: string }> => {
    console.log('[Magic Map] 💾 Process creation started');
    console.log('[Magic Map] Process name:', name);
    console.log('[Magic Map] XML length:', xml.length, 'chars');
    console.log('[Magic Map] Playbook ID:', playbookId);
    
    try {
      const response = await fetch('/api/magic-map/create-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xml, processName: name, playbookId }),
      });

      const data = await response.json();
      
      console.log('[Magic Map] Create process response:', {
        status: response.status,
        success: data.success,
        processId: data.processId,
        error: data.error
      });

      if (response.ok && data.success && data.processId) {
        console.log('[Magic Map] ✅ Process created successfully:', data.processId);
        
        // Success: Notify parent to load the new process
        onProcessCreated(data.processId);
        return { success: true, processId: data.processId };
      } else {
        console.error('[Magic Map] ❌ Process creation failed:', data.error);
        return { success: false, error: data.error || 'Failed to create process' };
      }
    } catch (error) {
      console.error('[Magic Map] 💥 Process creation error:', error);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  }, [playbookId, onProcessCreated]);

  // Action: Set expanded XML (for modal)
  const setExpandedXml = useCallback((xml: string | null, processName?: string | null) => {
    setExpandedXmlState(xml);
    setExpandedProcessName(processName || null);
  }, []);

  // Context value
  const value: MagicMapContextType = {
    // State
    messages,
    isGenerating,
    isEnhancing,
    isLimitReached,
    expandedXml,
    expandedProcessName,
    userMessageCount,
    
    // Actions
    addMessage,
    clearMessages,
    sendMessage,
    enhancePrompt,
    createProcess,
    setExpandedXml,
  };

  return (
    <MagicMapContext.Provider value={value}>
      {children}
    </MagicMapContext.Provider>
  );
};

// Custom hook to use context
export const useMagicMap = (): MagicMapContextType => {
  const context = useContext(MagicMapContext);
  if (!context) {
    throw new Error('useMagicMap must be used within MagicMapProvider');
  }
  return context;
};
