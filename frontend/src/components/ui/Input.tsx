import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  mono?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, mono = false, ...props }, ref) => (
    <div className="w-full flex flex-col gap-[6px]">
      {label && (
        <span className="alto-label text-ink">{label}</span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full border-[1.5px] border-ink bg-fog px-[14px] py-[12px]',
          'text-[14px] text-ink',
          mono
            ? 'font-mono font-bold'
            : 'font-display font-[500]',
          'focus:outline-none focus:outline-[2px] focus:outline-lavender focus:outline-offset-0',
          'placeholder:text-stone placeholder:font-normal',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-brick focus:outline-brick',
          className
        )}
        {...props}
      />
      {error && (
        <span className="alto-label text-brick">{error}</span>
      )}
    </div>
  )
);

Input.displayName = 'Input';

export default Input;
