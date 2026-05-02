'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
  running?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Timer({ seconds, onComplete, running = true, size = 'md', className = '' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running || timeLeft <= 0) {
      if (timeLeft <= 0) handleComplete();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, timeLeft, handleComplete]);

  const progress = timeLeft / seconds;
  const isUrgent = timeLeft <= 3;

  const sizeConfig = {
    sm: { dimension: 48, stroke: 3, text: 'text-sm' },
    md: { dimension: 80, stroke: 4, text: 'text-2xl' },
    lg: { dimension: 120, stroke: 6, text: 'text-4xl' },
  };

  const { dimension, stroke, text } = sizeConfig[size];
  const radius = (dimension - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={dimension} height={dimension} className="-rotate-90">
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={isUrgent ? 'var(--color-danger)' : 'var(--color-gold)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <motion.span
        className={`absolute font-bold ${text} ${isUrgent ? 'text-[var(--color-danger)]' : 'text-white'}`}
        animate={isUrgent ? { scale: [1, 1.2, 1] } : undefined}
        transition={isUrgent ? { repeat: Infinity, duration: 0.5 } : undefined}
      >
        {timeLeft}
      </motion.span>
    </div>
  );
}
