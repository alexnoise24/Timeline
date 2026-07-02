import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

interface BrandingData {
  enabled: boolean;
  studioName: string | null;
  logo: string | null;
  accentColor: string | null;
  subdomain: string | null;
  emailFooter: string | null;
}

export default function BrandingSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState<BrandingData>({
    enabled: true,
    studioName: null,
    logo: null,
    accentColor: null,
    subdomain: null,
    emailFooter: null,
  });

  const canUseBranding = ['pro', 'studio', 'master', 'lifetime', 'starter'].includes(user?.current_plan || '');

  useEffect(() => {
    api.get('/branding')
      .then(r => setBranding(r.data.branding))
      .catch((err: any) => {
        if (err.response?.status !== 403) console.error('Error fetching branding:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/branding', branding);
      toast.success(t('branding.saved'));
      checkAuth();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('branding.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full bg-paper">
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

  if (!canUseBranding) {
    // Native app: no plan/pricing prompt — bounce to settings.
    if (Capacitor.isNativePlatform()) {
      return <Navigate to="/settings" replace />;
    }
    return (
      <div className="flex h-full bg-paper">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
            <p className="font-display font-bold text-[18px] tracking-[-0.02em] text-ink text-center">
              {t('branding.requiresStudioTitle').toUpperCase()}
            </p>
            <p className="alto-label text-stone text-center max-w-xs">
              {t('branding.requiresStudioDescription')}
            </p>
            <Button variant="accent" onClick={() => navigate('/pricing')} arrow>
              {t('branding.viewPlans')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-paper">
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
              <p className="alto-label text-stone mb-1">LENZU · BRANDING</p>
              <h1 className="font-display font-bold text-[32px] tracking-[-0.03em] leading-none text-ink">
                {t('branding.title').toUpperCase()}
              </h1>
              <p className="font-mono text-[12px] text-stone mt-2">
                {t('branding.description')}
              </p>
            </div>

            {/* Studio Name */}
            <div className="border-[1.5px] border-ink bg-paper mb-8">
              <div className="px-5 py-3 border-b-[1px] border-ink/20">
                <h2 className="alto-label text-ink">{t('branding.studioName').toUpperCase()}</h2>
                <p className="font-mono text-[11px] text-stone mt-0.5">{t('branding.studioNameDescription')}</p>
              </div>
              <div className="px-5 py-5">
                <input
                  type="text"
                  value={branding.studioName || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, studioName: e.target.value }))}
                  placeholder={t('branding.studioNamePlaceholder')}
                  className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[12px] font-mono font-bold text-[14px] text-ink focus:outline-none focus:outline-[2px] focus:outline-lavender placeholder:text-stone placeholder:font-normal"
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end">
              <Button variant="accent" onClick={handleSave} disabled={saving} className="flex items-center gap-2" arrow>
                {saving
                  ? <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                  : <Save size={13} strokeWidth={1.5} />}
                {t('branding.saveChanges')}
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
