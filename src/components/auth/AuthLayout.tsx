/**
 * AuthLayout - Shared split-panel layout for Login/Signup pages
 * 
 * Two-column design:
 * - Left (60%): BrandStoryPanel with animated content
 * - Right (40%): Auth form (login or signup)
 * 
 * Responsive: Stacks vertically on mobile (<1024px)
 * Accessibility: Respects prefers-reduced-motion
 */

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: ReactNode; // [BrandStoryPanel, FormComponent]
}

export function AuthLayout({ children }: AuthLayoutProps) {
  // Extract left and right children
  const childArray = Array.isArray(children) ? children : [children];
  const [leftPanel, rightPanel] = childArray.length === 2 ? childArray : [null, childArray[0]];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-0 md:p-4 lg:p-6 -mt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-7xl bg-white rounded-none md:rounded-2xl shadow-none md:shadow-2xl overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-screen md:min-h-[700px] lg:min-h-[750px]">
          {/* Left Panel - Brand Story (Hidden on mobile/tablet) */}
          {leftPanel && (
            <div className="hidden lg:block lg:col-span-3 relative overflow-hidden">
              {leftPanel}
            </div>
          )}

          {/* Right Panel - Auth Form */}
          <div className="lg:col-span-2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
            <div className="w-full max-w-md">
              {rightPanel}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
