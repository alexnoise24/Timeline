import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getTimeRemaining, formatCountdown, getCountdownColor } from '@/lib/countdown';

interface CountdownTimerProps {
  targetDate: string | Date;
  showIcon?: boolean;
  className?: string;
  compact?: boolean;
}

export default function CountdownTimer({ 
  targetDate, 
  showIcon = true, 
  className = '',
  compact = false 
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    // Update every minute for efficiency
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(targetDate));
    }, 60000);

    // Update immediately
    setTimeRemaining(getTimeRemaining(targetDate));

    return () => clearInterval(interval);
  }, [targetDate]);

  const colorClass = getCountdownColor(targetDate);

  if (timeRemaining.isPast) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 ${className}`}>
        {showIcon && <Clock size={14} />}
        <span>Event has passed</span>
      </div>
    );
  }

  if (timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700 animate-pulse ${className}`}>
        {showIcon && <Clock size={14} />}
        <span>Happening now!</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${colorClass} ${className}`}>
      {showIcon && <Clock size={14} />}
      <span className="font-mono">{formatCountdown(timeRemaining)}</span>
      {!compact && <span className="hidden sm:inline">until event</span>}
    </div>
  );
}
