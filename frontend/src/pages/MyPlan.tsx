import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Crown, FolderOpen, Users, Check, X, ArrowUpRight, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface UsageData {
  timelines: number;
  collaborators: number;
}

const planLimits: Record<string, { timelines: number; collaborators: number; features: string[] }> = {
  free: {
    timelines: 1,
    collaborators: 2,
    features: ['shotLists']
  },
  trial: {
    timelines: 5,
    collaborators: 10,
    features: ['shotLists', 'teamPhotographers', 'pushNotifications']
  },
  starter: {
    timelines: 5,
    collaborators: 10,
    features: ['shotLists', 'teamPhotographers', 'pushNotifications']
  },
  pro: {
    timelines: 20,
    collaborators: 50,
    features: ['shotLists', 'teamPhotographers', 'pushNotifications', 'prioritySupport']
  },
  studio: {
    timelines: Infinity,
    collaborators: Infinity,
    features: ['shotLists', 'teamPhotographers', 'pushNotifications', 'prioritySupport', 'customBranding']
  },
  master: {
    timelines: Infinity,
    collaborators: Infinity,
    features: ['shotLists', 'teamPhotographers', 'pushNotifications', 'prioritySupport', 'customBranding']
  }
};

const allFeatures = [
  'shotLists',
  'teamPhotographers', 
  'pushNotifications',
  'prioritySupport',
  'customBranding'
];

export default function MyPlan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<UsageData>({ timelines: 0, collaborators: 0 });
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  const currentPlan = user?.current_plan || 'free';
  const limits = planLimits[currentPlan] || planLimits.free;

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await api.get('/users/usage');
      setUsage(response.data);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user?.stripe_customer_id) {
      toast.error(t('pricing.noSubscription'));
      return;
    }

    setManagingSubscription(true);

    try {
      const response = await api.post('/stripe/create-portal-session');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('pricing.portalError'));
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.stripe_subscription_id) {
      toast.error(t('pricing.noSubscription'));
      return;
    }

    // Confirm cancellation
    if (!window.confirm(t('myPlan.cancelConfirm'))) {
      return;
    }

    setCancelingSubscription(true);

    try {
      await api.post('/stripe/cancel-subscription');
      toast.success(t('myPlan.cancelSuccess'));
      // Refresh user data
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('myPlan.cancelError'));
    } finally {
      setCancelingSubscription(false);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    const names: Record<string, string> = {
      free: 'Free',
      trial: 'Trial',
      starter: 'Starter',
      pro: 'Pro',
      studio: 'Studio',
      master: 'Master'
    };
    return names[plan] || plan;
  };

  const getPlanPrice = (plan: string) => {
    const prices: Record<string, string> = {
      free: '$0',
      trial: '$0',
      starter: '$9',
      pro: '$19',
      studio: '$39',
      master: '∞'
    };
    return prices[plan] || '$0';
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === Infinity) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const formatLimit = (limit: number) => {
    return limit === Infinity ? '∞' : limit.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-text/70 hover:text-text transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Current Plan Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent/20 rounded-xl">
                <Crown size={28} className="text-accent" />
              </div>
              <div>
                <p className="text-sm text-text/60">{t('myPlan.currentPlan')}</p>
                <h1 className="text-2xl sm:text-3xl font-heading text-text">
                  {getPlanDisplayName(currentPlan)}
                </h1>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-3xl font-bold text-text">
                {getPlanPrice(currentPlan)}
                <span className="text-base font-normal text-text/60">/{t('pricing.month')}</span>
              </p>
            </div>
          </div>

          {/* Trial info if applicable */}
          {currentPlan === 'trial' && user?.trial_end_date && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm">
                {t('myPlan.trialEnds')}: <strong>{new Date(user.trial_end_date).toLocaleDateString()}</strong>
              </p>
            </div>
          )}

          {/* Usage Section */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-medium text-text mb-4">{t('myPlan.usage')}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Timelines Usage */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FolderOpen size={20} className="text-text/70" />
                  <span className="text-sm text-text/70">{t('myPlan.timelines')}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-text">{usage.timelines}</span>
                  <span className="text-text/60">/ {formatLimit(limits.timelines)}</span>
                </div>
                {limits.timelines !== Infinity && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${getUsagePercentage(usage.timelines, limits.timelines)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Collaborators Usage */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users size={20} className="text-text/70" />
                  <span className="text-sm text-text/70">{t('myPlan.collaboratorsTotal')}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-text">{usage.collaborators}</span>
                  <span className="text-text/60">/ {formatLimit(limits.collaborators)}</span>
                </div>
                {limits.collaborators !== Infinity && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${getUsagePercentage(usage.collaborators, limits.collaborators)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Features Included */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-6">
          <h3 className="font-medium text-text mb-4">{t('myPlan.featuresIncluded')}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allFeatures.map((feature) => {
              const isIncluded = limits.features.includes(feature);
              return (
                <div 
                  key={feature}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isIncluded ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {isIncluded ? (
                    <Check size={18} className="text-green-600 shrink-0" />
                  ) : (
                    <X size={18} className="text-gray-400 shrink-0" />
                  )}
                  <span className={isIncluded ? 'text-text' : 'text-text/50'}>
                    {t(`pricing.features.${feature}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {currentPlan !== 'master' && (
            <Button 
              onClick={() => navigate('/pricing')}
              className="flex-1 inline-flex items-center justify-center gap-2"
            >
              <ArrowUpRight size={18} />
              {currentPlan === 'studio' ? t('myPlan.comparePlans') : t('myPlan.upgradePlan')}
            </Button>
          )}
          
          {user?.stripe_customer_id && (
            <Button 
              variant="outline"
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="flex-1 inline-flex items-center justify-center gap-2"
            >
              {managingSubscription ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Settings2 size={18} />
              )}
              {t('myPlan.manageSubscription')}
            </Button>
          )}

          {user?.stripe_subscription_id && (
            <Button 
              variant="outline"
              onClick={handleCancelSubscription}
              disabled={cancelingSubscription}
              className="flex-1 inline-flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              {cancelingSubscription ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <X size={18} />
              )}
              {t('myPlan.cancelPlan')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
