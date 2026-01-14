/**
 * Magic Map Components Index
 * Re-exports all magic map components for cleaner imports
 */

export { MagicMapProvider, useMagicMap } from './MagicMapContext';
export { default as ChatHeader } from './ChatHeader';
export { default as ChatMessageList } from './ChatMessageList';
export { default as ChatInput } from './ChatInput';
export { default as ThinkingMessage } from './ThinkingMessage';
export { default as UserMessage } from './UserMessage';
export { default as AssistantMessage } from './AssistantMessage';
export { default as WelcomeMessage } from './WelcomeMessage';
export { default as DiagramPreview } from './DiagramPreview';
export { default as DiagramModal } from './DiagramModal';

// Types
export type { ChatMessage, MagicMapState, MagicMapContextType } from './types';
