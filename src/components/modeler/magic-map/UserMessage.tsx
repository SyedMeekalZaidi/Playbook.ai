/**
 * UserMessage - Display user's chat messages
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage } from './types';

interface UserMessageProps {
  message: ChatMessage;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <motion.div
      className="flex justify-end mb-4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Message bubble */}
      <div className="bg-oxford-blue text-white rounded-lg rounded-br-sm px-4 py-3 max-w-[80%]">
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </motion.div>
  );
};

export default UserMessage;
