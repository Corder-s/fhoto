import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'neutral' | 'dark';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'brand',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-bold tracking-wide rounded-full';

  const variants = {
    brand: 'bg-[#EFFCF8] text-[#0F766E] border border-[#99F6E4]',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    error: 'bg-red-50 text-red-700 border border-red-200',
    neutral: 'bg-[#F1F3F5] text-[#64748B] border border-[#E7EAEE]',
    dark: 'bg-[#171A1F] text-white border border-[#262B33]',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-[10px] gap-1',
    md: 'px-3 py-1 text-[11px] gap-1.5',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
};
