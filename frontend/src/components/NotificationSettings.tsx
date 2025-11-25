import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  unsubscribeFromNotifications,
  isSubscribed
} from '@/lib/notifications';

export default function NotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setSupported(isNotificationSupported());
    setPermission(getNotificationPermission());

    // Check if already subscribed
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    const isCurrentlySubscribed = await isSubscribed();
    setSubscribed(isCurrentlySubscribed);
  };

  const handleEnableNotifications = async () => {
    if (!supported) {
      toast.error('Las notificaciones no son compatibles en este navegador');
      return;
    }

    setLoading(true);

    try {
      const subscription = await requestNotificationPermission();

      if (subscription) {
        setPermission('granted');
        setSubscribed(true);
        toast.success('✅ Notificaciones activadas correctamente');
      } else {
        if (Notification.permission === 'denied') {
          toast.error('Notificaciones bloqueadas. Por favor, habilítalas en la configuración de tu navegador.');
        } else {
          toast.error('No se pudo activar las notificaciones');
        }
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Error al activar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);

    try {
      const success = await unsubscribeFromNotifications();

      if (success) {
        setSubscribed(false);
        toast.success('Notificaciones desactivadas');
      } else {
        toast.error('No se pudo desactivar las notificaciones');
      }
    } catch (error) {
      console.error('Error disabling notifications:', error);
      toast.error('Error al desactivar las notificaciones');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff size={24} />
            Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-text opacity-75">
            <p>Las notificaciones push no son compatibles en este navegador.</p>
            <p className="text-sm mt-2">
              Para recibir notificaciones, usa un navegador compatible como Chrome, Firefox, Safari o Edge.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permission === 'denied') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X size={24} className="text-red-500" />
            Notificaciones Bloqueadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-text opacity-75">
            <p className="mb-4">
              Has bloqueado las notificaciones para este sitio. Para activarlas:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Haz clic en el icono de candado en la barra de direcciones</li>
              <li>Busca la opción "Notificaciones"</li>
              <li>Selecciona "Permitir"</li>
              <li>Recarga la página</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={24} className="text-accent" />
          Notificaciones Push
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-text opacity-75 leading-relaxed">
            Recibe notificaciones en tiempo real sobre actualizaciones en tus eventos, nuevos mensajes y cambios importantes.
          </p>

          {subscribed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-accent bg-opacity-10 rounded-xl">
                <Check size={20} className="text-accent" />
                <span className="text-text font-medium">Notificaciones activadas</span>
              </div>
              
              <Button
                onClick={handleDisableNotifications}
                variant="outline"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Desactivando...' : 'Desactivar notificaciones'}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleEnableNotifications}
              disabled={loading}
              className="w-full"
            >
              <Bell size={18} className="mr-2" />
              {loading ? 'Activando...' : 'Activar notificaciones'}
            </Button>
          )}

          <div className="mt-4 p-4 bg-background rounded-xl">
            <p className="text-sm text-text opacity-60 mb-2">💡 Consejo:</p>
            <p className="text-sm text-text opacity-75 leading-relaxed">
              Las notificaciones funcionan incluso cuando la aplicación está cerrada. Puedes personalizar qué notificaciones recibir desde la configuración de tu navegador.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
