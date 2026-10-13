import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'bg-white rounded-2xl border border-[#E8E2D8] shadow-[0_2px_10px_-2px_rgba(26,24,22,0.04)] p-5 sm:p-6 transition-all duration-300',
            hoverEffect &&
              'hover:border-[#D5CEC4] hover:shadow-[0_12px_28px_-6px_rgba(26,24,22,0.09)] hover:-translate-y-1 cursor-pointer',
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
