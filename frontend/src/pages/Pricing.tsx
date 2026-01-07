import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, Sparkles, ArrowLeft, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface PlanFeature {
  key: string;
  free: boolean | string;
  starter: boolean | string;
  pro: boolean | string;
  studio: boolean | string;
}

const plans = [
  {
    id: 'free',
    price: 0,
    period: 'month',
    timelines: 1,
    collaborators: 2,
    popular: false,
  },
  {
    id: 'starter',
    price: 9,
    period: 'month',
    timelines: 5,
    collaborators: 10,
    popular: false,
  },
  {
    id: 'pro',
    price: 19,
    period: 'month',
    timelines: 20,
    collaborators: 50,
    popular: true,
  },
  {
    id: 'studio',
    price: 39,
    period: 'month',
    timelines: Infinity,
    collaborators: Infinity,
    popular: false,
  },
];

const features: PlanFeature[] = [
  { key: 'timelines', free: '1', starter: '5', pro: '20', studio: '∞' },
  { key: 'collaborators', free: '2', starter: '10', pro: '50', studio: '∞' },
  { key: 'shotLists', free: true, starter: true, pro: true, studio: true },
  { key: 'teamPhotographers', free: false, starter: true, pro: true, studio: true },
  { key: 'pushNotifications', free: false, starter: true, pro: true, studio: true },
  { key: 'prioritySupport', free: false, starter: false, pro: true, studio: true },
  { key: 'customBranding', free: false, starter: false, pro: false, studio: true },
];

export default function Pricing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success(t('pricing.paymentSuccess'));
      // Refresh user data to get updated plan
      checkAuth();
      // Clear URL params
      navigate('/pricing', { replace: true });
    } else if (canceled === 'true') {
      toast.info(t('pricing.paymentCanceled'));
      navigate('/pricing', { replace: true });
    }
  }, [searchParams, navigate, t, checkAuth]);

  const handleSelectPlan = async (planId: string) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    // Free plan - just update to free
    if (planId === 'free') {
      toast.info(t('pricing.freePlanInfo'));
      return;
    }

    // If user already has this plan
    if (user?.current_plan === planId) {
      return;
    }

    setLoadingPlan(planId);

    try {
      const response = await api.post('/stripe/create-checkout-session', { planId });

      // Redirect to Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('pricing.checkoutError'));
    } finally {
      setLoadingPlan(null);
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

      // Redirect to Stripe Customer Portal
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('pricing.portalError'));
    } finally {
      setManagingSubscription(false);
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'string') {
      return <span className="font-medium text-text">{value}</span>;
    }
    return value ? (
      <Check size={20} className="text-green-500 mx-auto" />
    ) : (
      <X size={20} className="text-gray-300 mx-auto" />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-text/70 hover:text-text transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading text-text mb-4">
            {t('pricing.title')}
          </h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 ${
                plan.popular
                  ? 'ring-2 ring-accent shadow-lg'
                  : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-accent text-text text-xs font-medium px-3 py-1 rounded-full">
                    <Sparkles size={12} />
                    {t('pricing.popular')}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-heading text-text mb-2">
                  {t(`pricing.plans.${plan.id}.name`)}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-text">
                    ${plan.price}
                  </span>
                  <span className="text-text/60">/{t('pricing.month')}</span>
                </div>
                <p className="text-sm text-text/60 mt-2">
                  {t(`pricing.plans.${plan.id}.description`)}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  <span>
                    {plan.timelines === Infinity
                      ? t('pricing.unlimitedTimelines')
                      : t('pricing.timelinesCount', { count: plan.timelines })}
                  </span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  <span>
                    {plan.collaborators === Infinity
                      ? t('pricing.unlimitedCollaborators')
                      : t('pricing.collaboratorsCount', { count: plan.collaborators })}
                  </span>
                </li>
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loadingPlan === plan.id || user?.current_plan === plan.id}
                className={`w-full ${
                  plan.popular
                    ? 'bg-accent hover:bg-accent/80 text-text'
                    : ''
                }`}
                variant={plan.popular ? 'primary' : 'outline'}
              >
                {loadingPlan === plan.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : user?.current_plan === plan.id ? (
                  t('pricing.currentPlan')
                ) : plan.price === 0 ? (
                  t('pricing.getStarted')
                ) : (
                  t('pricing.subscribe')
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* Features Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-heading text-text">
              {t('pricing.compareFeatures')}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-4 font-medium text-text/70">
                    {t('pricing.feature')}
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className="p-4 text-center font-heading text-text"
                    >
                      {t(`pricing.plans.${plan.id}.name`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={feature.key}
                    className={index % 2 === 0 ? 'bg-gray-50' : ''}
                  >
                    <td className="p-4 text-sm text-text">
                      {t(`pricing.features.${feature.key}`)}
                    </td>
                    <td className="p-4 text-center">
                      {renderFeatureValue(feature.free)}
                    </td>
                    <td className="p-4 text-center">
                      {renderFeatureValue(feature.starter)}
                    </td>
                    <td className="p-4 text-center">
                      {renderFeatureValue(feature.pro)}
                    </td>
                    <td className="p-4 text-center">
                      {renderFeatureValue(feature.studio)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manage Subscription Button */}
        {user?.stripe_subscription_id && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              {managingSubscription ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Settings2 size={18} />
              )}
              {t('pricing.manageSubscription')}
            </Button>
          </div>
        )}

        {/* FAQ or Contact */}
        <div className="mt-12 text-center">
          <p className="text-text/70">
            {t('pricing.questions')}{' '}
            <a
              href="mailto:support@lenzu.app"
              className="text-accent hover:underline"
            >
              {t('pricing.contactUs')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
