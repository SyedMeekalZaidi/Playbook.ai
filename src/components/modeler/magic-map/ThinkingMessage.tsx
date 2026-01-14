/**
 * ThinkingMessage - Animated loading indicator during AI generation
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

const ThinkingMessage: React.FC = () => {
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* Bot avatar */}
      <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
        <span className="text-gold text-sm">✨</span>
      </div>

      {/* Thinking bubble */}
      <div className="bg-muted rounded-lg rounded-tl-sm px-4 py-3 max-w-[80%]">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Creating your diagram</span>
          
          {/* Animated dots */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-gold rounded-full"
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThinkingMessage;
