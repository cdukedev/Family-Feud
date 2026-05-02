'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StrikeOverlayProps {
  strikes: number;
  showLatest: boolean;
  onDismiss: () => void;
}

export function StrikeOverlay({ strikes, showLatest, onDismiss }: StrikeOverlayProps) {
  useEffect(() => {
    if (showLatest) {
      const timer = setTimeout(onDismiss, 2000);
      return () => clearTimeout(timer);
    }
  }, [showLatest, onDismiss]);

  return (
    <AnimatePresence>
      {showLatest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 10, stiffness: 200 }}
            className="flex gap-4"
          >
            {Array.from({ length: strikes }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15 }}
              >
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 120 120"
                  className="drop-shadow-[0_0_30px_rgba(231,76,60,0.8)]"
                >
                  <line
                    x1="20"
                    y1="20"
                    x2="100"
                    y2="100"
                    stroke="#E74C3C"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <line
                    x1="100"
                    y1="20"
                    x2="20"
                    y2="100"
                    stroke="#E74C3C"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
