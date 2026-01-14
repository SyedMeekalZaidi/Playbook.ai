/**
 * BrandStoryPanel - Animated left panel for auth pages
 * 
 * Showcases Playbook.ai's value proposition with:
 * - "Documentation to Life" - Transform text to visual diagrams
 * - "AI-Powered Visualization" - Magic Map natural language processing
 * - "Easy Implementation" - Step-by-step workflow guidance
 * 
 * Features smooth Framer Motion animations with Oxford Blue + Gold theme
 */

'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Sparkles, Brain, CheckCircle } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

const features = [
  {
    icon: Sparkles,
    title: 'Documentation to Life',
    description: "Dynamic documentation that doesn't feel like a filing cabinet ",
    color: 'text-gold',
  },
  {
    icon: Brain,
    title: 'AI-Powered Visualization',
    description: 'Transform text descriptions into visual process maps instantl',
    color: 'text-gold',
  },
  {
    icon: CheckCircle,
    title: 'Easy Implementation',
    description: 'Guide your team step-by-step through any workflow',
    color: 'text-gold',
  },
];

export function BrandStoryPanel() {
  return (
    <div className="relative h-full bg-gradient-to-br from-oxford-blue via-oxford-blue to-[#1a2847] flex flex-col justify-center p-12">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold rounded-full blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10"
      >
        {/* Logo with floating animation */}
        <motion.div
          className="mb-12"
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
              <Image
                src="/rose-logo.png"
                alt="Playbook.ai Logo"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                Playbook<span className="text-gold">.ai</span>
              </h1>
              <p className="text-white/70 text-sm mt-1">
                Bring Documentation to Life
              </p>
            </div>
          </div>
        </motion.div>

        {/* Feature list */}
        <div className="space-y-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="flex gap-4 group"
            >
              {/* Icon with glow effect */}
              <div className="shrink-0">
                <motion.div
                  className="bg-gold/10 backdrop-blur-sm rounded-xl p-3 group-hover:bg-gold/20 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </motion.div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated BPMN diagram being drawn */}
        <motion.div
          variants={itemVariants}
          className="mt-10 pt-6 border-t border-white/10"
        >
          <svg
            viewBox="0 0 400 100"
            className="w-full h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Start Event Circle */}
            <motion.circle
              cx="40"
              cy="50"
              r="18"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            />
            <motion.text
              x="40"
              y="55"
              textAnchor="middle"
              fill="#FEC872"
              fontSize="11"
              fontWeight="600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7 }}
            >
              Start
            </motion.text>
            
            {/* Arrow 1 */}
            <motion.path
              d="M 60 50 L 108 50"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 1.9 }}
            />
            <motion.path
              d="M 103 45 L 108 50 L 103 55"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 2.3 }}
            />

            {/* Task Rectangle */}
            <motion.rect
              x="113"
              y="30"
              width="70"
              height="40"
              rx="4"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 2.4 }}
            />
            <motion.text
              x="148"
              y="55"
              textAnchor="middle"
              fill="#FEC872"
              fontSize="14"
              fontWeight="600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.0 }}
            >
              Now
            </motion.text>

            {/* Arrow 2 */}
            <motion.path
              d="M 185 50 L 233 50"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 3.2 }}
            />
            <motion.path
              d="M 228 45 L 233 50 L 228 55"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 3.6 }}
            />

            {/* Gateway Diamond */}
            <motion.path
              d="M 258 50 L 278 30 L 298 50 L 278 70 Z"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 3.7 }}
            />
            <motion.text
              x="278"
              y="55"
              textAnchor="middle"
              fill="#FEC872"
              fontSize="18"
              fontWeight="bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4.3 }}
            >
              ?
            </motion.text>

            {/* Arrow 3 */}
            <motion.path
              d="M 300 50 L 338 50"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 4.4 }}
            />
            <motion.path
              d="M 333 45 L 338 50 L 333 55"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 4.7 }}
            />

            {/* End Event Circle (double border) */}
            <motion.circle
              cx="360"
              cy="50"
              r="18"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 4.8 }}
            />
            <motion.circle
              cx="360"
              cy="50"
              r="14"
              fill="none"
              stroke="#FEC872"
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 5.2 }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
