import webPush from 'web-push';

// VAPID keys - En producción deberían estar en variables de entorno
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BIk4w8yDVwBdQyLsqHuTWxfnCizCk0hVm-vYOECRX7j9mP-pjH2trSJdhHX0bbz0UAIzB5Ojd_DCpgovK3r9wgQ';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'AAdOEbLg6ZNpLuv3v_D_tvRy4-wgDfrluwm9ErINnTg';

// Configurar VAPID
webPush.setVapidDetails(
  'mailto:alex@lenzu.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Enviar notificación push a una suscripción
 * @param {Object} subscription - PushSubscription object del navegador
 * @param {Object} payload - Datos de la notificación
 */
export async function sendPushNotification(subscription, payload) {
  try {
    const payloadString = JSON.stringify(payload);
    await webPush.sendNotification(subscription, payloadString);
    console.log('✅ Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    if (error.statusCode === 410) {
      console.log('Subscription has expired or is no longer valid');
    }
    return false;
  }
}

/**
 * Enviar notificación a múltiples usuarios
 * @param {Array} subscriptions - Array de PushSubscription objects
 * @param {Object} notification - Notification data
 */
export async function sendBulkNotifications(subscriptions, notification) {
  const promises = subscriptions.map(subscription =>
    sendPushNotification(subscription, notification)
  );
  
  const results = await Promise.allSettled(promises);
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failed = results.length - successful;
  
  console.log(`📊 Notifications sent: ${successful} successful, ${failed} failed`);
  
  return { successful, failed };
}

/**
 * Obtener la clave pública VAPID para el frontend
 */
export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}

export default {
  sendPushNotification,
  sendBulkNotifications,
  getVapidPublicKey
};
