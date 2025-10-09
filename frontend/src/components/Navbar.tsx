import { Link } from 'react-router-dom';
import { Calendar, LogOut, User, Plus, Users, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Button from './ui/Button';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="text-primary-600" size={32} />
            <span className="text-xl font-bold text-gray-900">Wedding Timeline</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                {/* Show different options based on user role */}
                {user.role === 'photographer' ? (
                  <Link to="/create-timeline">
                    <Button size="sm" className="bg-primary-600 hover:bg-primary-700">
                      <Plus size={18} className="mr-2" />
                      Create Timeline
                    </Button>
                  </Link>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Users size={20} className="text-gray-600" />
                    <span className="text-sm text-gray-700">Guest Access</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  {user.role === 'photographer' ? (
                    <Camera size={20} className="text-primary-600" />
                  ) : (
                    <Users size={20} className="text-primary-600" />
                  )}
                  <span className="text-sm text-gray-700">{user.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'photographer'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>

                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut size={18} className="mr-2" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
