import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-base font-medium text-text-primary mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-5 py-3 rounded-[14px] text-base text-text-primary',
            'bg-white/60 backdrop-blur-sm',
            'border border-border-soft',
            'focus:outline-none focus:border-olive-primary focus:ring-2 focus:ring-olive-primary/15',
            'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
            'placeholder:text-text-muted',
            'disabled:bg-gray-100 disabled:cursor-not-allowed',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
