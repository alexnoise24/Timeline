import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'es') {
  const localeMap: Record<string, string> = { en: 'en-US', es: 'es-ES' };
  return new Date(date).toLocaleDateString(localeMap[locale] || 'es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(time: string) {
  return time;
}

// FREE-FOR-ALL MODE (julio 2026): the whole product is free while building the
// user base — every feature open to every logged-in user, all plan/upsell UI
// hidden (web AND native). To re-enable monetization flip this to false; the
// plan gating below and the dormant IAP flow (see iapService) take over again.
export const FREE_FOR_ALL = true;

// Plans with full Pro access (studio/starter are legacy values still in the DB).
// Blocked: free, none, guest. Single source of truth for phone AND Watch gating.
export const FULL_ACCESS_PLANS = ['master', 'lifetime', 'studio', 'pro', 'starter'];

export function hasFullAccess(user: { current_plan?: string; role?: string } | null | undefined): boolean {
  if (!user) return false;
  if (FREE_FOR_ALL) return true;
  return user.role === 'master' || FULL_ACCESS_PLANS.includes(user.current_plan || '');
}

// Wedding mode: pick the day that matches today's local date; if none matches,
// the nearest upcoming day; if all days passed, the last one (covers weddings
// running past midnight). Day dates are stored as UTC midnight, so the UTC
// date-part is the calendar day (same convention as detectActiveEvent).
export function getActiveDay<T extends { date: string }>(days: T[]): T | null {
  if (!days || days.length === 0) return null;

  const sorted = [...days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const dayKey = (d: T) => new Date(d.date).toISOString().split('T')[0];
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const exact = sorted.find((d) => dayKey(d) === todayKey);
  if (exact) return exact;

  const upcoming = sorted.find((d) => dayKey(d) > todayKey);
  return upcoming || sorted[sorted.length - 1];
}

export function formatDateTime(date: string | Date, locale: string = 'es') {
  const localeMap: Record<string, string> = { en: 'en-US', es: 'es-ES' };
  return new Date(date).toLocaleString(localeMap[locale] || 'es-ES', {
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
