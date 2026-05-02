'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'buzzer' | 'mic' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | 'buzzer';

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white shadow-lg',
  secondary: 'bg-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/90 text-white shadow-lg',
  buzzer: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_40px_rgba(230,57,70,0.5)] rounded-full',
  mic: 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_30px_rgba(46,204,113,0.4)] rounded-full',
  ghost: 'bg-transparent hover:bg-white/10 text-white',
  danger: 'bg-[var(--color-danger)] hover:bg-[var(--color-danger)]/90 text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
  buzzer: 'w-48 h-48 text-3xl',
};

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  pulsing?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled, pulsing, children, className = '', ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        animate={pulsing ? { scale: [1, 1.05, 1] } : undefined}
        transition={pulsing ? { repeat: Infinity, duration: 1.5 } : undefined}
        disabled={disabled}
        className={`
          font-bold rounded-xl transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
