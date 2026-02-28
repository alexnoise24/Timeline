import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Trash2, AlertTriangle, Loader2, Mail, Shield, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

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
      const message = error.response?.data?.message || t('settings.deleteError');
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-text/70" />
              </button>
              <div>
                <h1 className="text-2xl font-heading text-text">{t('settings.title')}</h1>
                <p className="text-sm text-text/60">{t('settings.subtitle')}</p>
              </div>
            </div>

            {/* Account Info Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <User size={20} className="text-accent" />
                </div>
                <h2 className="text-lg font-semibold text-text">{t('settings.accountInfo')}</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-text/50" />
                    <span className="text-text/70">{t('settings.email')}</span>
                  </div>
                  <span className="text-text font-medium">{user?.email}</span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Shield size={18} className="text-text/50" />
                    <span className="text-text/70">{t('settings.role')}</span>
                  </div>
                  <span className="text-text font-medium capitalize">{user?.role}</span>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-text/50" />
                    <span className="text-text/70">{t('settings.plan')}</span>
                  </div>
                  <span className="text-text font-medium capitalize">{user?.current_plan || 'free'}</span>
                </div>
              </div>
            </div>

            {/* Legal Links */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-text mb-4">{t('settings.legal')}</h2>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/privacy')}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-text/80"
                >
                  {t('settings.privacyPolicy')}
                </button>
                <button
                  onClick={() => navigate('/terms')}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-text/80"
                >
                  {t('settings.termsOfService')}
                </button>
                <button
                  onClick={() => navigate('/support')}
                  className="w-full text-left px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-text/80"
                >
                  {t('settings.helpSupport')}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl border border-red-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-red-600">{t('settings.dangerZone')}</h2>
              </div>
              
              <p className="text-text/70 text-sm mb-4">
                {t('settings.deleteAccountWarning')}
              </p>
              
              <Button
                onClick={() => setShowDeleteModal(true)}
                disabled={isMaster}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={18} />
                {t('settings.deleteAccount')}
              </Button>
              
              {isMaster && (
                <p className="text-xs text-text/50 mt-2">
                  {t('settings.masterCannotDelete')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-text">{t('settings.confirmDelete')}</h3>
            </div>
            
            <p className="text-text/70 mb-4">
              {t('settings.deleteAccountDescription')}
            </p>
            
            <ul className="text-sm text-text/60 mb-6 space-y-1">
              <li>• {t('settings.deleteItem1')}</li>
              <li>• {t('settings.deleteItem2')}</li>
              <li>• {t('settings.deleteItem3')}</li>
              <li>• {t('settings.deleteItem4')}</li>
            </ul>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-text/70 mb-1">
                  {t('settings.enterPassword')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text/70 mb-1">
                  {t('settings.typeDelete')}
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50"
                  placeholder="DELETE"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setPassword('');
                  setConfirmText('');
                }}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText !== 'DELETE' || !password}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t('settings.deleting')}
                  </>
                ) : (
                  t('settings.deleteForever')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
