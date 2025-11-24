import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, LogOut, Plus, Users, Camera, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMobileMenu } from '@/context/MobileMenuContext';
import Button from './ui/Button';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useMobileMenu();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            
            <Link to="/" className="flex items-center space-x-2">
              <Calendar className="text-primary-600" size={28} />
              <span className="text-lg sm:text-xl font-bold text-gray-900 hidden xs:inline">{t('app.name')}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <>
                {/* Show different options based on user role */}
                {user.role === 'photographer' ? (
                  <Link to="/create-timeline" className="hidden sm:block">
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                      <Plus size={18} className="sm:mr-2" />
                      <span className="hidden sm:inline">{t('dashboard.createNew')}</span>
                    </Button>
                  </Link>
                ) : (
                  <div className="hidden md:flex items-center space-x-2">
                    <Users size={20} className="text-gray-600" />
                    <span className="text-sm text-gray-700">{t('auth.guestAccess')}</span>
                  </div>
                )}

                {/* Language selector */}
                <LanguageSelector />

                {/* User info - condensed on mobile */}
                <div className="flex items-center space-x-2">
                  {user.role === 'photographer' ? (
                    <Camera size={20} className="text-primary-600" />
                  ) : (
                    <Users size={20} className="text-primary-600" />
                  )}
                  <span className="text-sm text-gray-700 hidden md:inline">{user.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium hidden sm:inline ${
                    user.role === 'photographer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>

                {/* Logout button - icon only on mobile */}
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut size={18} className="sm:mr-2" />
                  <span className="hidden sm:inline">{t('auth.logout')}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
