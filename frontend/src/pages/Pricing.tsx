import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ArrowLeft, Loader2, Settings2, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const FREE_FEATURE_KEYS = [
  'plans.freeFeature1', 'plans.freeFeature2', 'plans.freeFeature3',
  'plans.freeFeature4', 'plans.freeFeature5', 'plans.freeFeature6',
];

const PRO_FEATURE_KEYS = [
  'plans.proFeature1', 'plans.proFeature2', 'plans.proFeature3',
  'plans.proFeature4',
];

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const trialExpired = (location.state as any)?.trialExpired === true;
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success(t('pricing.paymentSuccess'));
      checkAuth();
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
    if (planId === 'free' || user?.current_plan === planId) return;

    setLoadingPlan(planId);
    try {
      const response = await api.post('/stripe/create-checkout-session', { planId });
      window.location.href = response.data.url;
    } catch {
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
      window.location.href = response.data.url;
    } catch {
      toast.error(t('pricing.portalError'));
    } finally {
      setManagingSubscription(false);
    }
  };

  const isPro = ['pro', 'studio', 'master', 'lifetime', 'starter'].includes(user?.current_plan || '');
  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen bg-paper">

      {/* Nav strip */}
      <header className="border-b-[1.5px] border-ink bg-paper">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo size="sm" variant="paper" />
          {isAuthenticated && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 alto-label text-stone hover:text-ink transition-colors duration-[80ms]"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              Volver
            </button>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Trial expired banner */}
        {trialExpired && (
          <div className="mb-10 border-[1.5px] border-ember/50 bg-ember/5 px-5 py-4">
            <p className="font-mono font-bold text-[12px] text-ink uppercase tracking-[0.06em]">
              Tu período de prueba ha terminado
            </p>
            <p className="font-mono text-[11px] text-stone mt-0.5">
              Activa el plan Pro para seguir usando Lenzu.
            </p>
          </div>
        )}

        {/* Page header */}
        <div className="mb-14 border-b-[1.5px] border-ink pb-8">
          <p className="alto-label text-stone mb-3">LENZU · PLANES</p>
          <h1 className="font-display font-bold text-[42px] sm:text-[60px] tracking-[-0.04em] leading-none text-ink whitespace-pre-line">
            {t('plans.headline')}
          </h1>
          <p className="font-mono text-[13px] text-stone mt-4 max-w-lg leading-relaxed">
            {t('plans.subheadline')}
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-[1.5px] border-ink mb-16">

          {/* ── Free Trial ── */}
          <div className="p-8 border-b-[1.5px] md:border-b-0 md:border-r-[1.5px] border-ink">
            <div className="mb-6">
              <p className="alto-label text-stone mb-2">{t('plans.freePlanLabel')}</p>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-[48px] tracking-[-0.04em] leading-none text-ink">$0</span>
                <span className="alto-label text-stone">{t('plans.freeDuration')}</span>
              </div>
              <p className="font-mono text-[11px] text-stone mt-2 leading-relaxed">
                {t('plans.freeDesc')}
              </p>
            </div>

            <ul className="space-y-2 mb-8">
              {FREE_FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <Check size={13} strokeWidth={2.5} className="text-moss flex-shrink-0" />
                  <span className="font-mono text-[12px] text-ink">{t(key)}</span>
                </li>
              ))}
            </ul>

            {!isAuthenticated ? (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate('/register')}
                arrow
              >
                {t('plans.createFreeAccount')}
              </Button>
            ) : isPro ? (
              <div className="border-[1px] border-ink/20 px-4 py-3">
                <p className="alto-label text-stone text-center">{t('plans.activePlan')}</p>
              </div>
            ) : (
              <div className="border-[1px] border-moss/40 bg-moss/5 px-4 py-3">
                <p className="alto-label text-moss text-center">
                  {user?.trial_end_date
                    ? t('plans.trialActiveEnds', { date: new Date(user.trial_end_date).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) })
                    : t('plans.trialActive')}
                </p>
              </div>
            )}
          </div>

          {/* ── Pro ── */}
          <div className="p-8 bg-ink">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <p className="alto-label text-paper/60">{t('plans.proPlanLabel')}</p>
                <span className="border-[1px] border-lavender/50 bg-lavender/15 px-1.5 py-0.5 font-mono font-bold text-[9px] text-lavender uppercase tracking-[0.08em]">
                  {t('plans.recommended')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold text-[48px] tracking-[-0.04em] leading-none text-paper">$5</span>
                <span className="alto-label text-paper/60">{t('myPlan.perMonth').toLowerCase()}</span>
              </div>
              <p className="font-mono text-[11px] text-paper/60 mt-2 leading-relaxed">
                {t('plans.proDesc')}
              </p>
            </div>

            <ul className="space-y-2 mb-8">
              {PRO_FEATURE_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <Check size={13} strokeWidth={2.5} className="text-lavender flex-shrink-0" />
                  <span className="font-mono text-[12px] text-paper/80">{t(key)}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="border-[1px] border-lavender/40 bg-lavender/10 px-4 py-3">
                <p className="alto-label text-lavender text-center">{t('plans.currentPlanActive')}</p>
              </div>
            ) : isNative ? (
              // Unreachable: /pricing redirects to /dashboard in native (App.tsx).
              // In-app purchases live in /my-plan.
              null
            ) : (
              <Button
                variant="accent"
                className="w-full !bg-lavender !border-lavender hover:!bg-lavender-deep"
                onClick={() => handleSelectPlan('pro')}
                disabled={loadingPlan === 'pro'}
                arrow
              >
                {loadingPlan === 'pro'
                  ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                  : t('plans.activatePro')}
              </Button>
            )}

            {/* Patreon note */}
            <div className="mt-4 border-[1px] border-paper/10 px-3 py-2.5 flex items-start gap-2">
              <ExternalLink size={12} strokeWidth={1.5} className="text-paper/40 mt-0.5 flex-shrink-0" />
              <p className="font-mono text-[10px] text-paper/40 leading-relaxed">
                {t('plans.patreonNote')}
              </p>
            </div>
          </div>
        </div>

        {/* Manage subscription — hidden on native (Apple guideline 3.1.1) */}
        {!isNative && user?.stripe_subscription_id && (
          <div className="mb-10 flex justify-center">
            <Button
              variant="ghost"
              onClick={handleManageSubscription}
              disabled={managingSubscription}
              className="inline-flex items-center gap-2"
            >
              {managingSubscription
                ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                : <Settings2 size={13} strokeWidth={1.5} />}
              {t('pricing.manageSubscription')}
            </Button>
          </div>
        )}

        {/* FAQ strip */}
        <div className="border-t-[1.5px] border-ink pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {([
            { qKey: 'plans.faq1q', aKey: 'plans.faq1a' },
            { qKey: 'plans.faq2q', aKey: 'plans.faq2a' },
            { qKey: 'plans.faq3q', aKey: 'plans.faq3a' },
          ] as const).map(({ qKey, aKey }) => (
            <div key={qKey}>
              <p className="font-mono font-bold text-[12px] text-ink mb-1">{t(qKey)}</p>
              <p className="font-mono text-[11px] text-stone leading-relaxed">{t(aKey)}</p>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-10 text-center">
          <p className="alto-label text-stone">
            {t('plans.questions')}{' '}
            <a
              href="mailto:support@lenzu.app"
              className="text-lavender hover:text-lavender-deep transition-colors duration-[80ms]"
            >
              support@lenzu.app
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
