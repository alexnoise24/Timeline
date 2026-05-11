import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  arrow?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', arrow, children, ...props }, ref) => {
    const base = [
      'inline-flex items-center justify-center gap-[10px]',
      'font-mono font-bold uppercase tracking-btn',
      'border-[1.5px] border-ink',
      'transition-[background-color,color,border-color] duration-snap ease-out',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'touch-manipulation',
    ].join(' ');

    const variants: Record<string, string> = {
      primary:   'bg-ink text-paper hover:bg-paper hover:text-ink',
      secondary: 'bg-paper text-ink hover:bg-ink hover:text-paper',
      outline:   'bg-paper text-ink hover:bg-ink hover:text-paper', // alias for secondary
      accent:    'bg-lavender text-ink border-ink hover:bg-lavender-deep',
      ghost:     'bg-transparent text-ink border-dashed hover:bg-ink hover:text-paper',
      danger:    'bg-brick text-paper border-brick hover:bg-paper hover:text-brick',
    };

    const sizes: Record<string, string> = {
      sm: 'px-[16px] py-[10px] text-[11px] min-h-[40px]',
      md: 'px-[22px] py-[14px] text-[12px] min-h-[48px]',
      lg: 'px-[28px] py-[16px] text-[13px] min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
        {arrow && <span aria-hidden>→</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
