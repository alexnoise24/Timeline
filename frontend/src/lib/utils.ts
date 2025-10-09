import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(time: string) {
  return time;
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    ceremony: 'bg-pink-100 text-pink-700',
    reception: 'bg-purple-100 text-purple-700',
    preparation: 'bg-blue-100 text-blue-700',
    photography: 'bg-green-100 text-green-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return colors[category] || colors.other;
}

export function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    ceremony: 'Ceremony',
    reception: 'Reception',
    preparation: 'Preparation',
    photography: 'Photography',
    other: 'Other',
  };
  return labels[category] || 'Other';
}
