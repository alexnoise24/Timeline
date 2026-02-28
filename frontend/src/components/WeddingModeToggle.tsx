import { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WeddingModeToggleProps {
  onToggle?: (isActive: boolean) => void;
  className?: string;
}

const STORAGE_KEY = 'lenzu-wedding-mode';

export default function WeddingModeToggle({ onToggle, className = '' }: WeddingModeToggleProps) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isActive));
    onToggle?.(isActive);
    
    // Apply field-mode class to root element
    const root = document.getElementById('root');
    if (root) {
      if (isActive) {
        root.classList.add('field-mode');
      } else {
        root.classList.remove('field-mode');
      }
    }
  }, [isActive, onToggle]);

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
        transition-all duration-300 min-h-[44px] desktop:min-h-[44px] mobile:min-h-[56px]
        ${isActive 
          ? 'bg-ink-primary text-white' 
          : 'border border-ink-primary text-ink-primary hover:bg-ink-primary hover:text-white'
        }
        ${className}
      `}
    >
      <Camera size={18} />
      <span className="hidden sm:inline">
        {isActive ? t('weddingMode.stop', 'Terminar día') : t('weddingMode.start', 'Iniciar día de boda')}
      </span>
      {isActive && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full animate-pulse">
          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
          {t('weddingMode.live', 'EN VIVO')}
        </span>
      )}
    </button>
  );
}

export function useWeddingMode() {
  const [isActive, setIsActive] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  useEffect(() => {
    const handleStorage = () => {
      setIsActive(localStorage.getItem(STORAGE_KEY) === 'true');
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return isActive;
}
