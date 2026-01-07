import { useTranslation } from 'react-i18next';
import { Clock, Sparkles } from 'lucide-react';
import { User } from '@/types';

interface TrialBannerProps {
  user: User;
  onViewPlans?: () => void;
}

export default function TrialBanner({ user, onViewPlans }: TrialBannerProps) {
  const { t } = useTranslation();

  // Master users don't see trial banner
  if (user.role === 'master') return null;

  // Only show for users with active trial
  if (!user.is_trial_active || !user.trial_end_date) return null;

  const trialEndDate = new Date(user.trial_end_date);
  const now = new Date();
  const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Don't show if trial is already expired (modal will handle that)
  if (daysRemaining <= 0) return null;

  // Calculate progress (7 day trial)
  const totalTrialDays = 7;
  const daysUsed = totalTrialDays - daysRemaining;
  const progressPercent = Math.min((daysUsed / totalTrialDays) * 100, 100);

  // Determine urgency level for styling
  const isUrgent = daysRemaining <= 2;
  const isWarning = daysRemaining <= 4 && daysRemaining > 2;

  return (
    <div 
      className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border ${
        isUrgent 
          ? 'bg-red-50 border-red-200' 
          : isWarning 
            ? 'bg-amber-50 border-amber-200' 
            : 'bg-accent/10 border-accent/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            isUrgent ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-accent/20'
          }`}>
            {isUrgent ? (
              <Clock size={20} className="text-red-600" />
            ) : (
              <Sparkles size={20} className={isWarning ? 'text-amber-600' : 'text-accent'} />
            )}
          </div>
          <div>
            <h3 className={`font-heading text-lg ${
              isUrgent ? 'text-red-900' : isWarning ? 'text-amber-900' : 'text-text'
            }`}>
              {daysRemaining === 1 
                ? t('trial.lastDay')
                : t('trial.daysRemaining', { days: daysRemaining })
              }
            </h3>
            <p className={`text-sm mt-1 ${
              isUrgent ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-text/70'
            }`}>
              {t('trial.enjoyFeatures')}
            </p>
          </div>
        </div>

        {onViewPlans && (
          <button
            onClick={onViewPlans}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              isUrgent 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : isWarning 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-accent hover:bg-accent/80 text-text'
            }`}
          >
            {t('trial.viewPlans')}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className={`h-2 rounded-full overflow-hidden ${
          isUrgent ? 'bg-red-200' : isWarning ? 'bg-amber-200' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-accent'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className={`text-xs mt-2 ${
          isUrgent ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-text/60'
        }`}>
          {t('trial.progress', { used: daysUsed, total: totalTrialDays })}
        </p>
      </div>
    </div>
  );
}
