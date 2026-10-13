import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-[#1A1816]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-[#8C847A]">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-white text-[#1A1816] text-xs sm:text-sm font-medium rounded-xl border border-[#E8E2D8] px-3.5 sm:px-4 py-2.5 transition-all duration-150 placeholder:text-[#8C847A] focus:outline-none focus:ring-2 focus:ring-[#FF6E00]/25 focus:border-[#FF6E00] hover:border-[#D5CEC4] min-h-[44px] shadow-xs',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-red-500 focus:ring-red-500/25 focus:border-red-500',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-[#8C847A]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-red-600 mt-1">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#8C847A] mt-1">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
