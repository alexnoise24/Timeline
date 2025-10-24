import { Calendar, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isProjectsActive = location.pathname === '/dashboard';
  const isMessagesActive = location.pathname === '/messages';

  return (
    <div className="w-60 bg-gray-900 text-white flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 pt-6 px-3">
        <button
          onClick={() => navigate('/dashboard')}
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
          onClick={() => navigate('/messages')}
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
  );
}
