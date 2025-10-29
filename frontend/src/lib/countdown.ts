export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

/**
 * Calculate time remaining until a target date
 */
export function getTimeRemaining(targetDate: string | Date): TimeRemaining {
  const target = new Date(targetDate);
  const now = new Date();
  const difference = target.getTime() - now.getTime();
  
  const isPast = difference < 0;
  const absoluteDiff = Math.abs(difference);
  
  const days = Math.floor(absoluteDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absoluteDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absoluteDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absoluteDiff % (1000 * 60)) / 1000);
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isPast,
    totalSeconds: Math.floor(absoluteDiff / 1000)
  };
}

/**
 * Format countdown as a human-readable string
 */
export function formatCountdown(timeRemaining: TimeRemaining, includeSeconds: boolean = false): string {
  const { days, hours, minutes, seconds } = timeRemaining;
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    if (includeSeconds) {
      return `${minutes}m ${seconds}s`;
    }
    return `${minutes} minutes`;
  } else {
    return `${seconds} seconds`;
  }
}

/**
 * Format countdown for display with label
 */
export function formatCountdownWithLabel(targetDate: string | Date, includeSeconds: boolean = false): string {
  const timeRemaining = getTimeRemaining(targetDate);
  
  if (timeRemaining.isPast) {
    return 'Event has passed';
  }
  
  if (timeRemaining.days === 0 && timeRemaining.hours === 0 && timeRemaining.minutes === 0) {
    return 'Happening now!';
  }
  
  return formatCountdown(timeRemaining, includeSeconds);
}

/**
 * Get a short countdown string (e.g., "5d 3h" or "2h 15m")
 */
export function getShortCountdown(targetDate: string | Date): string {
  const timeRemaining = getTimeRemaining(targetDate);
  
  if (timeRemaining.isPast) {
    return 'Past';
  }
  
  const { days, hours, minutes } = timeRemaining;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'Now';
  }
}

/**
 * Get countdown badge color based on time remaining
 */
export function getCountdownColor(targetDate: string | Date): string {
  const timeRemaining = getTimeRemaining(targetDate);
  
  if (timeRemaining.isPast) {
    return 'bg-gray-100 text-gray-600';
  }
  
  const { days, hours } = timeRemaining;
  
  if (days === 0 && hours < 2) {
    return 'bg-red-100 text-red-700'; // Urgent - less than 2 hours
  } else if (days === 0) {
    return 'bg-orange-100 text-orange-700'; // Today
  } else if (days < 7) {
    return 'bg-yellow-100 text-yellow-700'; // This week
  } else {
    return 'bg-blue-100 text-blue-700'; // Future
  }
}
