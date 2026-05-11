import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  initials: string;
  size?: 24 | 32 | 40 | 48 | 64;
  overflow?: number;
}

export default function Avatar({ initials, size = 40, overflow, className, ...props }: AvatarProps) {
  const fontSize = Math.round(size * 0.32);

  if (overflow !== undefined) {
    return (
      <div
        className={cn('inline-flex items-center justify-center flex-shrink-0 border-[1.5px] border-ink bg-paper text-ink font-mono font-bold', className)}
        style={{ width: size, height: size, fontSize }}
        {...props}
      >
        +{overflow}
      </div>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center justify-center flex-shrink-0 border-[1.5px] border-ink bg-ink text-paper font-mono font-bold tracking-[0.04em]', className)}
      style={{ width: size, height: size, fontSize }}
      {...props}
    >
      {initials.toUpperCase().slice(0, 2)}
    </div>
  );
}
