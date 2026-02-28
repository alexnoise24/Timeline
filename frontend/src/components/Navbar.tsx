import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, LogOut, Users, Camera, Menu, KeyRound, ChevronDown, CreditCard, Palette } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useBranding } from '@/context/BrandingContext';
import { usePlatform } from '@/hooks/usePlatform';
import LanguageSelector from './LanguageSelector';
import ChangePasswordModal from './ChangePasswordModal';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useMobileMenu();
  const { branding } = useBranding();
  const { isIOS } = usePlatform();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = () => {
    setIsUserMenuOpen(false);
    setIsChangePasswordOpen(true);
  };

  const handleViewPlan = () => {
    setIsUserMenuOpen(false);
    navigate('/my-plan');
  };

  const handleBranding = () => {
    setIsUserMenuOpen(false);
    navigate('/branding');
  };

  const canUseBranding = user?.role === 'master' || user?.current_plan === 'studio';

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
  };

  return (
    <>
      <nav className={`glass-subtle border-b border-border-soft pt-[env(safe-area-inset-top)] ${isIOS ? 'ios-navbar' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center ${isIOS ? 'h-14' : 'h-20'}`}>
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-ink-primary/10 rounded-lg transition-colors"
              >
                <Menu size={24} className="text-text-primary" />
              </button>
              
              <Link to="/" className="flex items-center space-x-3">
                {branding?.enabled && branding.logo ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL || ''}${branding.logo}`}
                    alt={branding.studioName || 'Logo'}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <Calendar className="text-ink-primary" size={32} />
                )}
                <span className="text-xl sm:text-2xl font-heading text-text-primary hidden xs:inline">
                  {branding?.enabled && branding.studioName ? branding.studioName : t('app.name')}
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <>
                  {/* Language selector */}
                  <LanguageSelector />

                  {/* User menu with dropdown */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-ink-primary/10 transition-colors"
                    >
                      {(user.role === 'photographer' || user.role === 'planner' || user.role === 'creator' || user.role === 'master') ? (
                        <Camera size={20} className="text-ink-primary" />
                      ) : (
                        <Users size={20} className="text-ink-primary" />
                      )}
                      <span className="text-sm text-text-primary hidden md:inline">{user.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium hidden sm:inline ${
                        user.role === 'photographer'
                          ? 'bg-ink-muted text-ink-primary'
                          : 'bg-ink-ghost text-ink-medium'
                      }`}>
                        {user.role}
                      </span>
                      <ChevronDown size={16} className="text-text-muted" />
                    </button>

                    {/* Dropdown menu */}
                    {isUserMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 glass-card rounded-[16px] py-1 z-50">
                        <button
                          onClick={handleViewPlan}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-ink-primary/10 transition-colors"
                        >
                          <CreditCard size={16} className="text-ink-primary" />
                          {t('nav.myPlan')}
                        </button>
                        {canUseBranding && (
                          <button
                            onClick={handleBranding}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-ink-primary/10 transition-colors"
                          >
                            <Palette size={16} className="text-ink-primary" />
                            {t('nav.branding')}
                          </button>
                        )}
                        <button
                          onClick={handleChangePassword}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-ink-primary/10 transition-colors"
                        >
                          <KeyRound size={16} className="text-ink-primary" />
                          {t('auth.changePassword')}
                        </button>
                        <hr className="my-1 border-border-soft" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400/80 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} />
                          {t('auth.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
