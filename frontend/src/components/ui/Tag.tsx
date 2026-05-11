import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'solid' | 'accent' | 'ok' | 'warn' | 'danger';
  dot?: boolean;
}

const variants: Record<string, string> = {
  default: 'bg-paper text-ink border-ink',
  solid:   'bg-ink text-paper border-ink',
  accent:  'bg-lavender text-ink border-ink',
  ok:      'bg-moss text-paper border-ink',
  warn:    'bg-ember text-paper border-ink',
  danger:  'bg-brick text-paper border-ink',
};

export default function Tag({ variant = 'default', dot, children, className, ...props }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[6px]',
        'border-[1px] px-[8px] py-[4px]',
        'font-mono font-bold text-[10px] uppercase tracking-[0.10em] leading-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && <span aria-hidden className="text-[8px]">●</span>}
      {children}
    </span>
  );
}
