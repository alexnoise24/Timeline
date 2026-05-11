import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, FolderOpen, Users, Check, ArrowUpRight, Loader2, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface UsageData {
  timelines: number;
  collaborators: number;
}

const ALL_FEATURES = [
  'Proyectos ilimitados',
  'Invitados ilimitados',
  'Shot lists',
  'Notificaciones push',
  'Apple Watch sync',
  'Modo campo (Día de boda)',
  'Branding personalizado',
  'Comunidad de fotógrafos',
  'Soporte prioritario',
];

const PLAN_LABELS: Record<string, string> = {
  free: 'GRATIS', trial: 'PRUEBA', starter: 'PRO',
  pro: 'PRO', studio: 'PRO', master: 'MASTER', lifetime: 'LIFETIME',
};

const PLAN_PRICES: Record<string, string> = {
  free: '$0', trial: '$0', starter: '$5',
  pro: '$5', studio: '$5', master: '∞', lifetime: '∞',
};

export default function MyPlan() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [usage, setUsage] = useState<UsageData>({ timelines: 0, collaborators: 0 });
  const [loading, setLoading] = useState(true);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);

  const currentPlan = user?.current_plan || 'free';
  const isPaid = ['starter', 'pro', 'studio', 'master', 'lifetime'].includes(currentPlan);
  const isTrial = currentPlan === 'trial' || currentPlan === 'free';

  useEffect(() => {
    api.get('/users/usage')
      .then(r => setUsage(r.data))
      .catch(e => console.error('Error fetching usage:', e))
      .finally(() => setLoading(false));
  }, []);

  const handleManageSubscription = async () => {
    if (!user?.stripe_customer_id) { toast.error(t('pricing.noSubscription')); return; }
    setManagingSubscription(true);
    try {
      const r = await api.post('/stripe/create-portal-session');
      window.location.href = r.data.url;
    } catch {
      toast.error(t('pricing.portalError'));
    } finally {
      setManagingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user?.stripe_subscription_id) { toast.error(t('pricing.noSubscription')); return; }
    if (!window.confirm(t('myPlan.cancelConfirm'))) return;

    setCancelingSubscription(true);
    try {
      await api.post('/stripe/cancel-subscription');
      toast.success(t('myPlan.cancelSuccess'));
      window.location.reload();
    } catch {
      toast.error(t('myPlan.cancelError'));
    } finally {
      setCancelingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={20} strokeWidth={1.5} className="animate-spin text-stone" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-paper">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

            {/* Header */}
            <div className="mb-8 pb-6 border-b-[1.5px] border-ink">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 alto-label text-stone hover:text-ink transition-colors duration-[80ms] mb-4"
              >
                <ArrowLeft size={13} strokeWidth={1.5} />
                {t('common.back')}
              </button>
              <p className="alto-label text-stone mb-1">LENZU · MI PLAN</p>
              <h1 className="font-display font-bold text-[32px] tracking-[-0.03em] leading-none text-ink">
                {t('myPlan.currentPlan').toUpperCase()}
              </h1>
            </div>

            {/* Current plan card */}
            <div className={`border-[1.5px] mb-4 ${isPaid ? 'border-ink bg-ink' : 'border-ink bg-paper'}`}>
              <div className="px-6 py-6 flex items-end justify-between">
                <div>
                  <p className={`alto-label mb-1 ${isPaid ? 'text-paper/50' : 'text-stone'}`}>PLAN ACTUAL</p>
                  <h2 className={`font-display font-bold text-[40px] tracking-[-0.04em] leading-none ${isPaid ? 'text-paper' : 'text-ink'}`}>
                    {PLAN_LABELS[currentPlan] || currentPlan.toUpperCase()}
                  </h2>
                </div>
                <div className="text-right">
                  <span className={`font-display font-bold text-[36px] tracking-[-0.04em] leading-none ${isPaid ? 'text-paper' : 'text-ink'}`}>
                    {PLAN_PRICES[currentPlan] || '$0'}
                  </span>
                  <span className={`alto-label ml-1 ${isPaid ? 'text-paper/50' : 'text-stone'}`}>/MES</span>
                </div>
              </div>

              {/* Trial expiry */}
              {isTrial && user?.trial_end_date && (
                <div className="mx-4 mb-4 border-[1px] border-ember/40 bg-ember/8 px-4 py-3">
                  <p className="font-mono text-[11px] text-ink leading-relaxed">
                    Prueba activa · termina el{' '}
                    <span className="font-bold">
                      {new Date(user.trial_end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Usage */}
            <div className="border-[1.5px] border-ink bg-paper mb-4">
              <div className="px-5 py-3 border-b-[1px] border-ink/20">
                <h3 className="alto-label text-ink">{t('myPlan.usage').toUpperCase()}</h3>
              </div>
              <div className="grid grid-cols-2 divide-x-[1px] divide-ink/15">
                {[
                  { icon: <FolderOpen size={13} strokeWidth={1.5} />, label: t('myPlan.timelines'), value: usage.timelines },
                  { icon: <Users size={13} strokeWidth={1.5} />, label: t('myPlan.collaboratorsTotal'), value: usage.collaborators },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="px-5 py-5">
                    <div className="flex items-center gap-1.5 alto-label text-stone mb-2">
                      {icon}
                      {label.toUpperCase()}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-bold text-[32px] tracking-[-0.04em] leading-none text-ink">
                        {value}
                      </span>
                      {isPaid && (
                        <span className="alto-label text-stone">/ ∞</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="border-[1.5px] border-ink bg-paper mb-6">
              <div className="px-5 py-3 border-b-[1px] border-ink/20">
                <h3 className="alto-label text-ink">{t('myPlan.featuresIncluded').toUpperCase()}</h3>
              </div>
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check size={12} strokeWidth={2.5} className={isPaid ? 'text-moss' : 'text-stone'} />
                    <span className={`font-mono text-[12px] ${isPaid ? 'text-ink' : 'text-stone'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              {!isPaid && (
                <div className="px-5 pb-4">
                  <p className="font-mono text-[11px] text-stone">
                    Todas las funciones disponibles durante la prueba.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              {!isPaid && (
                <Button
                  variant="accent"
                  onClick={() => navigate('/pricing')}
                  className="flex-1 flex items-center justify-center gap-2"
                  arrow
                >
                  <ArrowUpRight size={13} strokeWidth={1.5} />
                  Activar plan Pro · $5/mes
                </Button>
              )}

              {user?.stripe_customer_id && (
                <Button
                  variant="secondary"
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {managingSubscription
                    ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    : <Settings2 size={13} strokeWidth={1.5} />}
                  {t('myPlan.manageSubscription')}
                </Button>
              )}

              {user?.stripe_subscription_id && (
                <Button
                  variant="ghost"
                  onClick={handleCancelSubscription}
                  disabled={cancelingSubscription}
                  className="flex-1 flex items-center justify-center gap-2 hover:text-brick hover:border-brick/40"
                >
                  {cancelingSubscription
                    ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                    : <X size={13} strokeWidth={1.5} />}
                  {t('myPlan.cancelPlan')}
                </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
