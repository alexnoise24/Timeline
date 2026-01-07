import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Trash2, Save, Loader2, Palette, Building2, Globe, Mail } from 'lucide-react';
import { toast } from 'sonner';
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

const defaultColors = [
  '#D4E157', // Current accent (lime)
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#45B7D1', // Sky blue
  '#96CEB4', // Sage
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
];

export default function BrandingSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, checkAuth } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [branding, setBranding] = useState<BrandingData>({
    enabled: false,
    studioName: null,
    logo: null,
    accentColor: null,
    subdomain: null,
    emailFooter: null,
  });

  const canUseBranding = user?.role === 'master' || user?.current_plan === 'studio';

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await api.get('/branding');
      setBranding(response.data.branding);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t('branding.requiresStudio'));
      } else {
        console.error('Error fetching branding:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/branding', branding);
      toast.success(t('branding.saved'));
      checkAuth(); // Refresh user data
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('branding.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('branding.logoTooLarge'));
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await api.post('/branding/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBranding(prev => ({ ...prev, logo: response.data.logo }));
      toast.success(t('branding.logoUploaded'));
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('branding.logoUploadError'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteLogo = async () => {
    try {
      await api.delete('/branding/logo');
      setBranding(prev => ({ ...prev, logo: null }));
      toast.success(t('branding.logoDeleted'));
    } catch (error) {
      toast.error(t('branding.logoDeleteError'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!canUseBranding) {
    return (
      <div className="min-h-screen bg-background">
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-heading text-text mb-2">
            {t('branding.requiresStudioTitle')}
          </h2>
          <p className="text-text/70 mb-6">
            {t('branding.requiresStudioDescription')}
          </p>
          <Button onClick={() => navigate('/pricing')}>
            {t('branding.viewPlans')}
          </Button>
        </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-heading text-text mb-2">
            {t('branding.title')}
          </h1>
          <p className="text-text/70">
            {t('branding.description')}
          </p>
        </div>

        {/* Enable Branding Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text">{t('branding.enableBranding')}</h3>
              <p className="text-sm text-text/60">{t('branding.enableDescription')}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={branding.enabled}
                onChange={(e) => setBranding(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        {/* Studio Name */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-gray-100 rounded-lg shrink-0 hidden sm:block">
              <Building2 size={24} className="text-text/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text mb-1">{t('branding.studioName')}</h3>
              <p className="text-sm text-text/60 mb-4 break-words">{t('branding.studioNameDescription')}</p>
              <input
                type="text"
                value={branding.studioName || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, studioName: e.target.value }))}
                placeholder={t('branding.studioNamePlaceholder')}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-gray-100 rounded-lg shrink-0 hidden sm:block">
              <Upload size={24} className="text-text/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text mb-1">{t('branding.logo')}</h3>
              <p className="text-sm text-text/60 mb-4 break-words">{t('branding.logoDescription')}</p>
              
              {branding.logo ? (
                <div className="flex items-center gap-4">
                  <img
                    src={`${import.meta.env.VITE_API_URL || ''}${branding.logo}`}
                    alt="Logo"
                    className="h-16 w-auto object-contain bg-gray-50 rounded-lg p-2"
                  />
                  <Button
                    variant="outline"
                    onClick={handleDeleteLogo}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 size={16} className="mr-2" />
                    {t('branding.deleteLogo')}
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Upload size={16} className="mr-2" />
                    )}
                    {t('branding.uploadLogo')}
                  </Button>
                  <p className="text-xs text-text/50 mt-2">{t('branding.logoRequirements')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accent Color */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-gray-100 rounded-lg shrink-0 hidden sm:block">
              <Palette size={24} className="text-text/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text mb-1">{t('branding.accentColor')}</h3>
              <p className="text-sm text-text/60 mb-4 break-words">{t('branding.accentColorDescription')}</p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBranding(prev => ({ ...prev, accentColor: color }))}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      branding.accentColor === color 
                        ? 'border-text scale-110' 
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-text/60">{t('branding.customColor')}:</span>
                <input
                  type="color"
                  value={branding.accentColor || '#D4E157'}
                  onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={branding.accentColor || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                  placeholder="#D4E157"
                  className="w-28 px-3 py-1 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Subdomain */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-gray-100 rounded-lg shrink-0 hidden sm:block">
              <Globe size={24} className="text-text/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text mb-1">{t('branding.subdomain')}</h3>
              <p className="text-sm text-text/60 mb-4 break-words">{t('branding.subdomainDescription')}</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
                <input
                  type="text"
                  value={branding.subdomain || ''}
                  onChange={(e) => setBranding(prev => ({ 
                    ...prev, 
                    subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') 
                  }))}
                  placeholder="miestudio"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <span className="px-4 py-2 bg-gray-100 border border-gray-200 sm:border-l-0 rounded-lg sm:rounded-l-none sm:rounded-r-lg text-text/60 text-center">
                  .lenzu.app
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Footer */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 bg-gray-100 rounded-lg shrink-0 hidden sm:block">
              <Mail size={24} className="text-text/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text mb-1">{t('branding.emailFooter')}</h3>
              <p className="text-sm text-text/60 mb-4 break-words">{t('branding.emailFooterDescription')}</p>
              <textarea
                value={branding.emailFooter || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, emailFooter: e.target.value }))}
                placeholder={t('branding.emailFooterPlaceholder')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {t('branding.saveChanges')}
          </Button>
        </div>
      </div>
    </div>
  );
}
