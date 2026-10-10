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
          <label htmlFor={inputId} className="block text-xs font-bold uppercase tracking-wider text-ink-primary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-ink-muted">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'w-full bg-white text-ink-primary text-sm font-medium rounded-card-sm border border-contour-subtle px-3.5 py-2.5 transition-colors placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand min-h-[44px]',
                leftIcon && 'pl-10',
                rightIcon && 'pr-10',
                error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
                className
              )
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center pointer-events-none text-ink-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
        {!error && helperText && <p className="text-xs text-ink-muted">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
