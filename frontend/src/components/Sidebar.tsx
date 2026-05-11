import { Calendar, MessageCircle, Users, X, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useAuthStore } from '@/store/authStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isSidebarOpen, closeSidebar } = useMobileMenu();
  const { user } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  const canAccessCommunity =
    user?.role !== 'guest' &&
    (user?.role === 'master' ||
      ['starter', 'pro', 'studio', 'master', 'lifetime', 'trial'].includes(user?.current_plan || ''));

  const handleNavigate = (path: string) => {
    navigate(path);
    closeSidebar();
  };

  const navItem = (path: string, Icon: React.ElementType, label: string) => {
    const active = isActive(path);
    return (
      <button
        key={path}
        onClick={() => handleNavigate(path)}
        className={[
          'w-full flex items-center gap-3 px-4 py-3 min-h-[44px]',
          'alto-label border-b border-ink/10',
          'transition-colors duration-snap',
          active
            ? 'bg-ink text-paper'
            : 'bg-transparent text-ink hover:bg-fog',
        ].join(' ')}
      >
        <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(10,10,10,0.50)' }}
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar panel */}
      <div
        className={[
          'fixed lg:static inset-y-0 left-0 z-50',
          'flex flex-col bg-paper border-r-[1.5px] border-ink',
          'w-[240px]',
          'transition-transform duration-slide ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Mobile: close button */}
        <div
          className="lg:hidden flex justify-between items-center px-4 py-3 border-b-[1.5px] border-ink"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <span className="alto-label text-stone">MENU</span>
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-fog transition-colors duration-snap"
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={1.5} className="text-ink" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 pt-2 lg:pt-[80px] flex flex-col">
          {navItem('/dashboard', Calendar, t('sidebar.projects'))}
          {navItem('/messages', MessageCircle, t('sidebar.messages'))}
          {canAccessCommunity && navItem('/community', Users, t('sidebar.community'))}
        </nav>

        {/* Bottom: settings */}
        <div className="border-t-[1.5px] border-ink">
          {navItem('/settings', Settings, t('sidebar.settings'))}
        </div>
      </div>
    </>
  );
}
