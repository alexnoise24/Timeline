import { useState } from 'react';
import { Calendar, MessageCircle, Users, X, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useAuthStore } from '@/store/authStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, closeSidebar } = useMobileMenu();
  const { user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const isProjectsActive = location.pathname === '/dashboard';
  const isMessagesActive = location.pathname === '/messages';
  const isCommunityActive = location.pathname === '/community';
  const isSettingsActive = location.pathname === '/settings';

  const canAccessCommunity = user?.role !== 'guest' && (
    user?.role === 'master' || 
    ['starter', 'pro', 'studio', 'trial'].includes(user?.current_plan || '')
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    closeSidebar();
    setIsExpanded(false);
  };

  const toggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Hidden on mobile, collapsible on tablet, expanded on desktop */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          hidden md:flex flex-col
          glass-subtle border-r border-border-soft
          transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isExpanded ? 'w-[220px]' : 'tablet:w-16 desktop:w-[220px]'}
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        onClick={toggleExpand}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-4">
          <button
            onClick={closeSidebar}
            className="p-2 hover:bg-ink-primary/10 rounded-lg transition-colors duration-200 text-text-secondary"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-2 lg:pt-6 px-3">
          <button
            onClick={() => handleNavigate('/dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-2 transition-all duration-200 min-h-[44px] ${
              isProjectsActive
                ? 'bg-ink-primary text-white'
                : 'text-text-secondary hover:bg-ink-primary/8'
            }`}
          >
            <Calendar size={20} strokeWidth={1.5} className="flex-shrink-0" />
            <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${
              isExpanded ? 'opacity-100' : 'tablet:opacity-0 tablet:w-0 desktop:opacity-100 desktop:w-auto'
            }`}>Projects</span>
          </button>

          <button
            onClick={() => handleNavigate('/messages')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-2 transition-all duration-200 min-h-[44px] ${
              isMessagesActive
                ? 'bg-ink-primary text-white'
                : 'text-text-secondary hover:bg-ink-primary/8'
            }`}
          >
            <MessageCircle size={20} strokeWidth={1.5} className="flex-shrink-0" />
            <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${
              isExpanded ? 'opacity-100' : 'tablet:opacity-0 tablet:w-0 desktop:opacity-100 desktop:w-auto'
            }`}>Messages</span>
          </button>

          {canAccessCommunity && (
            <button
              onClick={() => handleNavigate('/community')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-2 transition-all duration-200 min-h-[44px] ${
                isCommunityActive
                  ? 'bg-ink-primary text-white'
                  : 'text-text-secondary hover:bg-ink-primary/8'
              }`}
            >
              <Users size={20} strokeWidth={1.5} className="flex-shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${
                isExpanded ? 'opacity-100' : 'tablet:opacity-0 tablet:w-0 desktop:opacity-100 desktop:w-auto'
              }`}>Community</span>
            </button>
          )}

          <div className="mt-auto pt-4 border-t border-border-soft">
            <button
              onClick={() => handleNavigate('/settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 min-h-[44px] ${
                isSettingsActive
                  ? 'bg-ink-primary text-white'
                  : 'text-text-secondary hover:bg-ink-primary/8'
              }`}
            >
              <Settings size={20} strokeWidth={1.5} className="flex-shrink-0" />
              <span className={`font-medium whitespace-nowrap transition-opacity duration-200 ${
                isExpanded ? 'opacity-100' : 'tablet:opacity-0 tablet:w-0 desktop:opacity-100 desktop:w-auto'
              }`}>Settings</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
