import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-ink-primary text-white hover:bg-ink-medium focus:ring-ink-primary shadow-sm',
      secondary: 'bg-ink-muted text-ink-primary hover:bg-ink-light focus:ring-ink-light',
      outline: 'border border-ink-primary text-ink-primary bg-transparent hover:bg-ink-primary hover:text-white',
      ghost: 'text-text-secondary hover:bg-ink-primary/8',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-4 py-2.5 text-sm min-h-[44px]',
      md: 'px-6 py-3 text-base min-h-[48px]',
      lg: 'px-8 py-4 text-lg min-h-[52px]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium',
          'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'tracking-wide touch-manipulation active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
