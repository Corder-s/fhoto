import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  shape?: 'pill' | 'rounded' | 'square';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      shape = 'pill',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const shapeStyles = {
      pill: 'rounded-full',
      rounded: 'rounded-xl',
      square: 'rounded-lg',
    };

    const baseStyles =
      'inline-flex items-center justify-center font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2 focus:ring-offset-[#F5F7F9] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none';

    const variants = {
      primary:
        'bg-[#14B8A6] hover:bg-[#0D9488] active:bg-[#0F766E] text-white shadow-sm hover:shadow-md border border-transparent',
      secondary:
        'bg-[#F1F3F5] hover:bg-[#E2E8F0] active:bg-[#CBD5E1] text-[#191C22] border border-[#E7EAEE] hover:border-[#CBD5E1]',
      outline:
        'bg-white/90 hover:bg-white active:bg-[#F5F7F9] text-[#191C22] border border-[#E7EAEE] hover:border-[#CBD5E1] shadow-xs',
      ghost:
        'bg-transparent hover:bg-[#F1F3F5] active:bg-[#E2E8F0] text-[#64748B] hover:text-[#191C22]',
      dark:
        'bg-[#171A1F] hover:bg-black active:bg-[#262B33] text-white shadow-sm border border-transparent',
      danger:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm border border-transparent',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-xs gap-1.5 min-h-[36px]',
      md: 'px-5 py-2.5 text-xs sm:text-sm gap-2 min-h-[44px]',
      lg: 'px-7 py-3 text-sm sm:text-base gap-2.5 min-h-[50px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, shapeStyles[shape], variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
