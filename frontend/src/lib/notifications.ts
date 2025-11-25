// Native Web Push Notifications (No Firebase)
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';

/**
 * Convert base64 VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission and subscribe to push
 */
export async function requestNotificationPermission(): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    console.log('✅ Notification permission granted');

    // 2. Register service worker
    let registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('Registering service worker...');
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('✅ Service worker registered');
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // 3. Get VAPID public key from backend
    const { data } = await axios.get(`${API_URL}/push/vapid-key`);
    const vapidPublicKey = data.publicKey;

    // 4. Subscribe to push notifications
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource
    });

    console.log('✅ Push subscription created:', subscription);

    // 5. Send subscription to backend
    await axios.post(`${API_URL}/push/subscribe`, {
      subscription: subscription.toJSON()
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('✅ Subscription saved to server');

    return subscription;

  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      console.log('No service worker registration found');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('No push subscription found');
      return false;
    }

    // Unsubscribe from push
    await subscription.unsubscribe();
    console.log('✅ Unsubscribed from push notifications');

    // Notify backend
    await axios.post(`${API_URL}/push/unsubscribe`, {
      endpoint: subscription.endpoint
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    return true;

  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return null;
    }

    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Check if user is currently subscribed
 */
export async function isSubscribed(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  return subscription !== null;
}

/**
 * Show a local notification (for testing)
 */
export async function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  
  if (registration) {
    await registration.showNotification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
}

export default {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  unsubscribeFromNotifications,
  getCurrentSubscription,
  isSubscribed,
  showLocalNotification
};
