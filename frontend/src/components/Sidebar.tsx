import { Calendar, MessageCircle, Users, X, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileMenu } from '@/context/MobileMenuContext';
import { useAuthStore } from '@/store/authStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, closeSidebar } = useMobileMenu();
  const { user } = useAuthStore();

  const isProjectsActive = location.pathname === '/dashboard';
  const isMessagesActive = location.pathname === '/messages';
  const isCommunityActive = location.pathname === '/community';
  const isSettingsActive = location.pathname === '/settings';

  // Check if user can access community (not guest, and has starter+ plan or is master)
  const canAccessCommunity = user?.role !== 'guest' && (
    user?.role === 'master' || 
    ['starter', 'pro', 'studio', 'trial'].includes(user?.current_plan || '')
  );

  const handleNavigate = (path: string) => {
    navigate(path);
    closeSidebar();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 glass-subtle border-r border-border-soft flex flex-col
        transform transition-transform duration-300 ease-in-out
        lg:transform-none
        ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }
      `}>
      {/* Mobile close button */}
      <div className="lg:hidden flex justify-end p-4">
        <button
          onClick={closeSidebar}
          className="p-2 hover:bg-olive-primary/10 rounded-lg transition-colors duration-200 text-text-secondary"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-2 lg:pt-6 px-3">
        <button
          onClick={() => handleNavigate('/dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
            isProjectsActive
              ? 'bg-olive-primary text-white'
              : 'text-text-secondary hover:bg-olive-primary/8'
          }`}
        >
          <Calendar size={20} strokeWidth={1.5} />
          <span className="font-medium">Projects</span>
        </button>

        <button
          onClick={() => handleNavigate('/messages')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
            isMessagesActive
              ? 'bg-olive-primary text-white'
              : 'text-text-secondary hover:bg-olive-primary/8'
          }`}
        >
          <MessageCircle size={20} strokeWidth={1.5} />
          <span className="font-medium">Messages</span>
        </button>

        {canAccessCommunity && (
          <button
            onClick={() => handleNavigate('/community')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full mb-2 transition-all duration-200 ${
              isCommunityActive
                ? 'bg-olive-primary text-white'
                : 'text-text-secondary hover:bg-olive-primary/8'
            }`}
          >
            <Users size={20} strokeWidth={1.5} />
            <span className="font-medium">Community</span>
          </button>
        )}

        <div className="mt-auto pt-4 border-t border-border-soft">
          <button
            onClick={() => handleNavigate('/settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
              isSettingsActive
                ? 'bg-olive-primary text-white'
                : 'text-text-secondary hover:bg-olive-primary/8'
            }`}
          >
            <Settings size={20} strokeWidth={1.5} />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
    </>
  );
}
