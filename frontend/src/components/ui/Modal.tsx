import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(10,10,10,0.55)' }}
        onClick={onClose}
      />
      {/* panel */}
      <div
        className={cn(
          'relative bg-paper border-[1.5px] border-ink w-full max-h-[85vh] overflow-y-auto overflow-x-hidden',
          sizeMap[size]
        )}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between bg-paper border-b-[1.5px] border-ink px-6 py-4">
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] leading-none text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="alto-label text-stone hover:text-ink transition-colors duration-snap"
              aria-label="Close"
            >
              ESC ×
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
