import { Calendar, MessageCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMobileMenu } from '@/context/MobileMenuContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSidebarOpen, closeSidebar } = useMobileMenu();

  const isProjectsActive = location.pathname === '/dashboard';
  const isMessagesActive = location.pathname === '/messages';

  const handleNavigate = (path: string) => {
    navigate(path);
    closeSidebar();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-60 bg-gray-900 text-white flex flex-col
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
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-2 lg:pt-6 px-3">
        <button
          onClick={() => handleNavigate('/dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
            isProjectsActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <Calendar size={20} />
          <span className="font-medium">Projects</span>
        </button>

        <button
          onClick={() => handleNavigate('/messages')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            isMessagesActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <MessageCircle size={20} />
          <span className="font-medium">Messages</span>
        </button>
      </nav>
    </div>
    </>
  );
}
