import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, ChevronDown, CreditCard, Palette, KeyRound, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { usePlatform } from '@/hooks/usePlatform';
import { FREE_FOR_ALL } from '@/lib/utils';
import LanguageSelector from './LanguageSelector';
import ChangePasswordModal from './ChangePasswordModal';
import Wordmark from '@/components/ui/Wordmark';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useMobileMenu();
  const { isIOS } = usePlatform();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangePassword = () => { setIsUserMenuOpen(false); setIsChangePasswordOpen(true); };
  const handleViewPlan = () => { setIsUserMenuOpen(false); navigate('/my-plan'); };
  const handleAccountSettings = () => { setIsUserMenuOpen(false); navigate('/settings'); };
  const handleBranding = () => { setIsUserMenuOpen(false); navigate('/branding'); };
  const handleLogout = () => { setIsUserMenuOpen(false); logout(); };

  const canUseBranding = user?.role === 'master' || ['studio', 'master', 'lifetime'].includes(user?.current_plan || '');

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[9999] bg-paper border-b-[1.5px] border-ink ${isIOS ? 'ios-navbar' : ''}`}
        style={{ paddingTop: 'env(safe-area-inset-top)', transform: 'translateZ(0)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex justify-between items-center ${isIOS ? 'h-14' : 'h-16'}`}>

            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 hover:bg-fog transition-colors duration-snap"
                aria-label="Menu"
              >
                <Menu size={20} className="text-ink" strokeWidth={1.5} />
              </button>

              <Link to="/" className="flex items-center">
                <Wordmark size={22} />
              </Link>
            </div>

            {/* Right: language + user */}
            {user && (
              <div className="flex items-center gap-4">
                <LanguageSelector />

                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-fog transition-colors duration-snap"
                  >
                    <Avatar initials={initials} size={32} />
                    <span className="alto-label hidden md:inline">{user.name}</span>
                    <ChevronDown size={14} className="text-stone" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-0 w-52 bg-paper border-[1.5px] border-ink z-[100]">
                      {/* Account settings first — also where account deletion lives (App Review 5.1.1) */}
                      <button
                        onClick={handleAccountSettings}
                        className="w-full flex items-center gap-3 px-4 py-3 alto-label text-ink border-b border-ink/20 hover:bg-fog transition-colors duration-snap"
                      >
                        <Settings size={14} strokeWidth={1.5} />
                        {t('sidebar.settings')}
                      </button>
                      {/* "My Plan" hidden while the product is fully free; when
                          monetization returns it shows everywhere (IAP in native) */}
                      {!FREE_FOR_ALL && (
                        <button
                          onClick={handleViewPlan}
                          className="w-full flex items-center gap-3 px-4 py-3 alto-label text-ink border-b border-ink/20 hover:bg-fog transition-colors duration-snap"
                        >
                          <CreditCard size={14} strokeWidth={1.5} />
                          {t('nav.myPlan')}
                        </button>
                      )}
                      {canUseBranding && (
                        <button
                          onClick={handleBranding}
                          className="w-full flex items-center gap-3 px-4 py-3 alto-label text-ink border-b border-ink/20 hover:bg-fog transition-colors duration-snap"
                        >
                          <Palette size={14} strokeWidth={1.5} />
                          {t('nav.branding')}
                        </button>
                      )}
                      <button
                        onClick={handleChangePassword}
                        className="w-full flex items-center gap-3 px-4 py-3 alto-label text-ink border-b-[1.5px] border-ink hover:bg-fog transition-colors duration-snap"
                      >
                        <KeyRound size={14} strokeWidth={1.5} />
                        {t('auth.changePassword')}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 alto-label text-brick hover:bg-brick hover:text-paper transition-colors duration-snap"
                      >
                        <LogOut size={14} strokeWidth={1.5} />
                        {t('auth.logout')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div style={{ height: `calc(env(safe-area-inset-top) + ${isIOS ? '56px' : '64px'})` }} />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
}
