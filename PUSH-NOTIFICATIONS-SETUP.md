# 🔔 Guía de Configuración: Web Push Notifications

## ✅ Implementación Completada

Tu app ahora tiene **notificaciones push nativas** sin dependencia de Firebase. Todo funciona directamente desde tu servidor `lenzu.app`.

---

## 🚀 Deployment al Servidor

### 1. Deploy la nueva versión

```bash
cd /Volumes/T7/Web\ APP/Timeline
bash deployment/deploy-to-server.sh
```

### 2. Agregar VAPID keys al servidor

```bash
ssh alexobregon@192.168.100.150

# Editar .env del backend
nano /var/www/timeline/backend/.env

# Agregar estas líneas al final:
VAPID_PUBLIC_KEY=BIk4w8yDVwBdQyLsqHuTWxfnCizCk0hVm-vYOECRX7j9mP-pjH2trSJdhHX0bbz0UAIzB5Ojd_DCpgovK3r9wgQ
VAPID_PRIVATE_KEY=AAdOEbLg6ZNpLuv3v_D_tvRy4-wgDfrluwm9ErINnTg

# Guardar: Ctrl+O, Enter, Ctrl+X

# Reiniciar backend
pm2 restart timeline-api

# Verificar logs
pm2 logs timeline-api --lines 20
```

---

## 🧪 Testing

### 1. Activar notificaciones en la app

1. Ve a **https://lenzu.app**
2. Haz login
3. En el Dashboard, verás la tarjeta **"Notificaciones Push"**
4. Click en **"Activar notificaciones"**
5. El navegador pedirá permiso → **Permitir**
6. Deberías ver ✅ **"Notificaciones activadas"**

### 2. Enviar notificación de prueba

Usa la API de prueba desde tu Mac:

```bash
# Obtén tu token de autenticación
# (lo puedes ver en localStorage de tu navegador → Application → Local Storage → token)

TOKEN="tu_token_aqui"

curl -X POST https://lenzu.app/api/push/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Deberías recibir una notificación: 🎉 **"Notificación de prueba"**

---

## 📱 Funcionalidades

### ✅ Lo que funciona:

- Notificaciones en tiempo real
- Funciona incluso con la app cerrada
- Click en notificación abre la app
- Soporte multi-dispositivo (un usuario puede tener notificaciones en varios navegadores)
- Activar/desactivar desde la UI
- Compatible con Chrome, Firefox, Edge, Safari (iOS 16.4+)

### 🔔 Cuándo se envían notificaciones:

Actualmente, las notificaciones se pueden enviar manualmente usando la API. Próximamente se pueden agregar automáticamente para:
- Nuevos mensajes en timeline
- Cambios en eventos
- Invitaciones a timelines
- Recordatorios de eventos próximos

---

## 🛠️ API Endpoints

### GET `/api/push/vapid-key`
Obtiene la clave pública VAPID (público, no requiere auth)

### POST `/api/push/subscribe`
Guarda la suscripción del usuario (requiere auth)

```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

### POST `/api/push/unsubscribe`
Elimina la suscripción (requiere auth)

```json
{
  "endpoint": "https://..."
}
```

### POST `/api/push/test`
Envía una notificación de prueba al usuario autenticado

---

## 🐛 Troubleshooting

### "Las notificaciones no son compatibles"
- **Solución**: Asegúrate de usar HTTPS (https://lenzu.app). Los service workers solo funcionan en HTTPS.

### "Notificaciones Bloqueadas"
- **Chrome**: Click en el candado → Configuración del sitio → Notificaciones → Permitir
- **Firefox**: Click en el candado → Permisos → Notificaciones → Permitir
- **Safari**: Safari → Configuración → Sitios web → Notificaciones → Permitir para lenzu.app

### El botón "Activar" no hace nada
- **Solución**: Abre las Developer Tools (F12) → Console y busca errores
- Verifica que el service worker se haya registrado: Application → Service Workers

### No recibo notificaciones
1. Verifica que el backend tenga las VAPID keys en `.env`
2. Reinicia el backend: `pm2 restart timeline-api`
3. Revisa los logs: `pm2 logs timeline-api`
4. Prueba desactivar y volver a activar las notificaciones

---

## 📝 Notas Importantes

1. **HTTPS es requerido**: Las notificaciones solo funcionan en HTTPS (tu túnel de Cloudflare ya lo proporciona)

2. **Service Worker**: Se registra automáticamente en `/sw.js`

3. **VAPID Keys**: Ya están hardcoded en el código como fallback, pero es mejor tenerlas en el `.env` del servidor

4. **Persistencia**: Las suscripciones se guardan en la base de datos MongoDB local

5. **Multi-dispositivo**: Un usuario puede tener notificaciones activadas en varios navegadores/dispositivos

---

## 🎯 Próximos Pasos (Opcional)

Para integrar notificaciones automáticas en eventos de la app:

1. **Nuevos mensajes**: Modificar `/backend/routes/messages.js` para enviar notificación cuando se crea un mensaje

2. **Cambios en timeline**: En `/backend/routes/timeline.js` cuando se actualiza un evento

3. **Invitaciones**: En `/backend/routes/invitations.js` cuando se envía una invitación

Ejemplo:
```javascript
import { sendPushNotification } from '../services/webPush.js';

// Después de crear un mensaje
const user = await User.findById(recipientId);
if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
  for (const subscription of user.pushSubscriptions) {
    await sendPushNotification(subscription, {
      title: 'Nuevo mensaje',
      body: `${sender.name} te ha enviado un mensaje`,
      data: { url: `/timeline/${timelineId}` }
    });
  }
}
```

---

¡Las notificaciones push están listas para usar! 🎉
