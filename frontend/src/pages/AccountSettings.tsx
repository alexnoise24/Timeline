import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { ArrowLeft, User, Trash2, AlertTriangle, Loader2, Mail, Shield, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { FREE_FOR_ALL } from '@/lib/utils';

export default function AccountSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const isMaster = user?.role === 'master';

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      toast.error(t('settings.typeDeleteToConfirm'));
      return;
    }
    if (!password) {
      toast.error(t('settings.passwordRequired'));
      return;
    }

    setDeleting(true);
    try {
      await api.delete('/users/account', { data: { password } });
      toast.success(t('settings.accountDeleted'));
      logout();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('settings.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  const planLabel = (plan: string) => {
    if (plan === 'none' || plan === 'guest') return t('plans.guestLabel');
    const labels: Record<string, string> = {
      free: 'GRATIS', trial: 'PRUEBA', starter: 'STARTER',
      pro: 'PRO', studio: 'STUDIO', master: 'MASTER', lifetime: 'LIFETIME',
    };
    return labels[plan] || plan.toUpperCase();
  };

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
              <p className="alto-label text-stone mb-1">LENZU · AJUSTES</p>
              <h1 className="font-display font-bold text-[32px] tracking-[-0.03em] leading-none text-ink">
                {t('settings.title').toUpperCase()}
              </h1>
            </div>

            {/* Account Info */}
            <div className="border-[1.5px] border-ink bg-paper mb-4">
              <div className="px-5 py-3 border-b-[1px] border-ink/20 flex items-center gap-2">
                <User size={13} strokeWidth={1.5} className="text-stone" />
                <h2 className="alto-label text-ink">{t('settings.accountInfo').toUpperCase()}</h2>
              </div>
              <div className="divide-y-[1px] divide-ink/10">
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2 alto-label text-stone">
                    <Mail size={12} strokeWidth={1.5} />
                    {t('settings.email').toUpperCase()}
                  </div>
                  <span className="font-mono font-bold text-[12px] text-ink">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2 alto-label text-stone">
                    <Shield size={12} strokeWidth={1.5} />
                    {t('settings.role').toUpperCase()}
                  </div>
                  <span className="font-mono font-bold text-[12px] text-ink">
                    {user?.role === 'guest' ? t('auth.guest').toUpperCase() : user?.role?.toUpperCase()}
                  </span>
                </div>
                {/* Plan label hidden while fully free, and always in native (no plan mentions) */}
                {!FREE_FOR_ALL && !Capacitor.isNativePlatform() && (
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-2 alto-label text-stone">
                      <FileText size={12} strokeWidth={1.5} />
                      {t('settings.plan').toUpperCase()}
                    </div>
                    <span className="border-[1px] border-lavender/50 bg-lavender/10 px-2 py-0.5 font-mono font-bold text-[10px] text-ink">
                      {planLabel(user?.current_plan || 'free')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Legal */}
            <div className="border-[1.5px] border-ink bg-paper mb-4">
              <div className="px-5 py-3 border-b-[1px] border-ink/20">
                <h2 className="alto-label text-ink">{t('settings.legal').toUpperCase()}</h2>
              </div>
              <div className="divide-y-[1px] divide-ink/10">
                {[
                  { label: t('settings.privacyPolicy'), path: '/privacy' },
                  { label: t('settings.termsOfService'), path: '/terms' },
                  { label: t('settings.helpSupport'), path: '/support' },
                ].map(({ label, path }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-fog transition-colors duration-[80ms]"
                  >
                    <span className="font-mono text-[12px] text-ink">{label}</span>
                    <ChevronRight size={13} strokeWidth={1.5} className="text-stone" />
                  </button>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-[1.5px] border-brick/40 bg-paper">
              <div className="px-5 py-3 border-b-[1px] border-brick/20 flex items-center gap-2">
                <AlertTriangle size={13} strokeWidth={1.5} className="text-brick" />
                <h2 className="alto-label text-brick">{t('settings.dangerZone').toUpperCase()}</h2>
              </div>
              <div className="px-5 py-5">
                <p className="font-mono text-[11px] text-stone leading-relaxed mb-4">
                  {t('settings.deleteAccountWarning')}
                </p>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isMaster}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={13} strokeWidth={1.5} />
                  {t('settings.deleteAccount')}
                </Button>
                {isMaster && (
                  <p className="alto-label text-stone mt-2">{t('settings.masterCannotDelete')}</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[rgba(10,10,10,0.55)] flex items-center justify-center z-50 p-4">
          <div className="bg-paper border-[1.5px] border-ink w-full max-w-md">
            {/* Modal header */}
            <div className="px-6 py-4 border-b-[1.5px] border-ink flex items-center gap-2">
              <AlertTriangle size={14} strokeWidth={1.5} className="text-brick" />
              <h3 className="font-display font-bold text-[16px] tracking-[-0.02em] text-ink">
                {t('settings.confirmDelete').toUpperCase()}
              </h3>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="font-mono text-[12px] text-stone leading-relaxed">
                {t('settings.deleteAccountDescription')}
              </p>

              <ul className="space-y-1 border-l-[2px] border-brick/30 pl-3">
                {/* Apple subscriptions can't be canceled server-side — point native users to iOS Settings */}
                {['deleteItem1', 'deleteItem2', Capacitor.isNativePlatform() ? 'deleteItemAppleSub' : 'deleteItem3', 'deleteItem4'].map(key => (
                  <li key={key} className="font-mono text-[11px] text-stone">
                    {t(`settings.${key}`)}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-[6px]">
                <span className="alto-label text-ink">{t('settings.enterPassword')}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[11px] font-mono text-[13px] text-ink focus:outline-none focus:outline-[2px] focus:outline-brick placeholder:text-stone"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-[6px]">
                <span className="alto-label text-ink">{t('settings.typeDelete')}</span>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full border-[1.5px] border-ink bg-paper px-[14px] py-[11px] font-mono font-bold text-[13px] text-ink focus:outline-none focus:outline-[2px] focus:outline-brick placeholder:text-stone placeholder:font-normal"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="secondary"
                  onClick={() => { setShowDeleteModal(false); setPassword(''); setConfirmText(''); }}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== 'DELETE' || !password}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {deleting
                    ? <><Loader2 size={13} strokeWidth={1.5} className="animate-spin" />{t('settings.deleting')}</>
                    : t('settings.deleteForever')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
