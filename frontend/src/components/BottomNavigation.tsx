import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, MessageSquare, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.projects' },
  { path: '/timeline', icon: Calendar, labelKey: 'nav.timeline' },
  { path: '/messages', icon: MessageSquare, labelKey: 'nav.messages' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function BottomNavigation() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-field-surface border-t border-field-accent/20 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full min-h-[56px] transition-colors ${
                active 
                  ? 'text-field-highlight' 
                  : 'text-field-accent hover:text-field-highlight'
              }`}
            >
              <Icon size={24} strokeWidth={active ? 2 : 1.5} />
              <span className="text-xs mt-1 font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
