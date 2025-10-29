import { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  requestNotificationPermission, 
  onForegroundMessage, 
  isNotificationSupported,
  getNotificationPermission 
} from '@/lib/firebase';
import api from '@/lib/api';
import Button from './ui/Button';

export default function NotificationHandler() {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const hasSeenPrompt = localStorage.getItem('notificationPromptSeen');
    const supported = isNotificationSupported();
    
    if (supported && permission === 'default' && !hasSeenPrompt) {
      // Show prompt after 5 seconds to not be intrusive
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  useEffect(() => {
    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Received foreground message:', payload);
      
      // Show toast notification
      const notification = (payload as any)?.notification || {};
      const title = notification.title || 'New Notification';
      const body = notification.body || '';
      
      toast(title, {
        description: body,
        icon: <Bell size={16} />,
        duration: 5000,
      });
    });

    return unsubscribe;
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        // Save FCM token to backend
        await api.post('/users/fcm-token', { fcmToken: token });
        
        setPermission('granted');
        setShowPrompt(false);
        toast.success('Notifications enabled!', {
          description: 'You\'ll now receive updates about your timelines',
        });
      } else {
        toast.error('Failed to enable notifications', {
          description: 'Please check your browser settings',
        });
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
      localStorage.setItem('notificationPromptSeen', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notificationPromptSeen', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Bell className="text-primary-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Stay Updated
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Get notified about new messages, events, and timeline updates
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                size="sm"
                className="flex-1"
              >
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Notification settings component for navbar/settings
 */
export function NotificationToggle() {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (permission === 'granted') {
      toast.info('To disable notifications, please update your browser settings');
      return;
    }

    setIsLoading(true);
    try {
      const token = await requestNotificationPermission();
      
      if (token) {
        await api.post('/users/fcm-token', { fcmToken: token });
        setPermission('granted');
        toast.success('Notifications enabled!');
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isNotificationSupported()) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded-lg transition-colors ${
        permission === 'granted'
          ? 'text-primary-600 bg-primary-100 hover:bg-primary-200'
          : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
      }`}
      title={permission === 'granted' ? 'Notifications enabled' : 'Enable notifications'}
    >
      {permission === 'granted' ? <Bell size={20} /> : <BellOff size={20} />}
    </button>
  );
}
