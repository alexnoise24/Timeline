# Lenzu App — Contexto del proyecto

## Qué es
App de coordinación para fotógrafos de boda. Desarrollada por Alex Obregon 
(fotógrafo de bodas destino en León, México). Permite gestionar timelines, 
shot lists y colaboración de equipo en tiempo real durante el día de boda.

## Stack completo
- **Frontend:** React + TypeScript + Vite → carpeta /frontend
- **Backend:** Node.js + Express + MongoDB → carpeta /backend
- **iOS:** React + Capacitor (LenzuApp)
- **Apple Watch:** WatchConnectivity (LenzuWatch) — diferenciador único
- **Notificaciones push:** Firebase
- **Deploy:** Servidor Ubuntu propio con Cloudflare Tunnel
- **Auth:** Sistema de invitaciones por link

## Base de datos
- **BD de producción: `wedding-timeline`** — NO usar `lenzu` (está vacía)
- Siempre conectar con: `mongosh wedding-timeline`
- Ejemplo para subir plan:
  `ssh alexobregon@192.168.100.150 'mongosh wedding-timeline --eval "db.users.updateOne({email:\"x@x.com\"},{$set:{current_plan:\"pro\",...}})"'`

## Deploy
- Script: deploy-production.sh en la raíz
- Comando: bash deploy-production.sh
- SERVER_USER: alexobregon
- SERVER_IP: 192.168.100.150 (red local)
- SERVER_PATH: /var/www/timeline
- Proceso: build → git push → scp dist → rsync backend → pm2 restart timeline-api
- SSH key: ~/.ssh/id_ed25519 (configurada con ssh-copy-id el 2026-04-06)
- URL producción: lenzu.app

## Estructura de carpetas
/frontend → React app + Landing page
/backend  → API Node.js
/firebase → Config push notifications
/deployment → Scripts y configs del servidor

## Archivos clave
- Landing page: frontend/src/Landing.tsx
- Screenshots App Store: frontend/src/assets/screenshots/
- Variables de entorno: .env (nunca tocar ni commitear)

## Assets
- Screenshots en producción: frontend/src/assets/screenshots/
  - screenshot-01-dashboard.jpg
  - screenshot-02-timeline.jpg
  - screenshot-03-shotlist.jpg
  - screenshot-04-notif.jpg (imagen horizontal — usa objectFit: contain + bg #f0ede8)
  - screenshot-05-watch.png (frame Watch oscuro, más pequeño y cuadrado)

## Diseño / Brand
- Fondo crema: #f4f1ec
- Navy principal: #12112a
- Tipografía: Cormorant Garamond (serif) + DM Sans
- App bilingüe: Español / Inglés (toggle EN/ES en el header)
- Tono: minimalista, editorial, elegante

## Features implementados
- Timeline del día con eventos y countdown
- Shot lists con categorías, progress bar y checkmarks
- Colaboradores (Owner + Editors) por proyecto
- Notificaciones push antes de cada evento
- Apple Watch: muestra timeline en la muñeca
- Dashboard con proyectos organizados por mes
- Modo boda activo (Wedding Day mode)
- Moodboard: moodboard.lenzu.app

## Estado actual (Abril 2026)

### iOS / TestFlight
- Build iOS: v1.1.0 build 6 — aprobado por Apple ✅
- Link público activo: https://testflight.apple.com/join/UbSPGPQ2
- Botón "Probar gratis en iPhone" visible en landing (etiqueta: TESTFLIGHT_BUTTON para comentar/descomentar)
- 51 sesiones registradas en TestFlight
- Usuario Apple Review creado en MongoDB: apple.review@lenzu.app / LenzuReview2026! (plan studio, sin expiración)
- Ícono Liquid Glass generado — pendiente de implementar en Xcode Assets

### Landing page
- Sección "La app, en acción" con 5 screenshots integrada y en producción

### Telegram (notificaciones activas)
- Nuevo registro: nombre, email, fecha, fecha fin de trial
- Mensaje en Community Chat: nombre, plan, mensaje, hora

### Panel de admin (lenzu.app/admin)
- Solo accesible para role: "master"
- Tab "Usuarios": lista con plan, fecha de registro y expiración, buscador por nombre/email, botón "Dar Studio 30d"
- Tab "Activity Log": últimos 100 eventos, filtros por tipo de evento y rango de fechas, badges de color, auto-refresh cada 30s
- NO muestra passwords, tokens ni datos de pago
- Archivos: frontend/src/pages/AdminPanel.tsx + backend/routes/admin.js
- Endpoint: GET /api/admin/activity?eventType=&userId=&from=&to=

### Email de bienvenida (actualizado 2026-04-07)
- Branding: "LenzuApp" → "Lenzu" en todo el template
- Header: #3B3B3B → #12112a (navy)
- Copy intro: "la app que mantiene a tu equipo sincronizado el día de la boda"
- Features actualizados: timeline, shot list, colaboradores, notificaciones, Apple Watch
- Footer: "Coordinación para fotógrafos de boda · lenzu.app"
- Archivo: backend/services/email.js → getPhotographerWelcomeTemplate()

### Beta testers
- Flujo: registrarse en lenzu.app → Alex sube a Pro 30 días manualmente
- Comando para subir plan: decirle a Claude Code "Sube a Pro por 30 días al usuario email@ejemplo.com"
- **Primer beta tester activo: Ray Minto (filmstorymx@gmail.com) → Pro hasta 07 may 2026**
- Al menos 2 personas pidieron Android en TikTok
- Tester con boda el domingo 12 Abril 2026 — prioritario ayudarlo a configurar

### Traducciones i18n (corregidas el 2026-04-07)
- Menú lateral traducido: Proyectos, Mensajes, Comunidad, Configuración
- Modal de invitar colaborador traducido completo (incluye botón "Copiar link" con feedback "¡Copiado!")
- Formato de fechas corregido: "Marzo De 2026" → "marzo de 2026"
- "Guest" → "Colaborador" (ES) / "Collaborator" (EN) en toda la UI
  (valor en BD sigue siendo "guest", solo cambia texto visible)

### UX / Settings
- Sección "Subdominio personalizado" ocultada en BrandingSettings.tsx
  (etiqueta: SUBDOMAIN_SECTION) — DNS wildcard *.lenzu.app pendiente de configurar

### Email de invitación a proyecto (diseñado, NO implementado aún)
- Si usuario existe → CTA al dashboard
- Si no existe → CTA al registro con invite token en URL
- Usaría pie de email configurado en Settings del fotógrafo

### Roles — documentación interna
- Capa 1: User.role → master / creator / photographer / planner / guest
- Capa 2: Timeline.collaborators[].role → editor / invited
- "invited" tiene mismos permisos de escritura que "editor" dentro del proyecto
- Solo el owner puede agregar/quitar colaboradores de un proyecto

## Lo que NO tocar sin preguntar
- Sistema de autenticación e invitaciones
- Lógica del Apple Watch (WatchConnectivity)
- Esquema de MongoDB
- Archivos .env
- deploy-production.sh (solo ejecutar, no modificar)

## Cambios — 7 mayo 2026

### Múltiples locaciones por proyecto
- Se agregó `locationsList: [{ name, url }]` al modelo MongoDB (`backend/models/Timeline.js`)
- Script de migración: `backend/scripts/migrate-locations.js` — popula `locationsList` desde `location`/`locationUrl` existentes
- Comando: `node scripts/migrate-locations.js` (ya ejecutado — 11 proyectos migrados)
- Los campos `location` y `locationUrl` se mantienen para compatibilidad (se sincronizan con el primer item de `locationsList` al guardar)
- UI en `frontend/src/components/Overview.tsx`: lista dinámica con botón "Agregar locación" y botón de eliminar por item
- Type actualizado: `Timeline.locationsList?: Array<{ name: string; url: string }>` en `frontend/src/types/index.ts`

### Export PDF del timeline
- Nuevo componente: `frontend/src/components/TimelinePDFExport.tsx`
- Botón "Export PDF" en el tab Timeline de cada proyecto (junto al botón "Add Day")
- Abre nueva pestaña con el PDF formateado y dispara el diálogo de impresión automáticamente
- Contenido del PDF: header con título/fecha/locación, tabla de eventos por día, shot list agrupado por categoría con checkboxes
- Sin librerías externas — usa browser print API
- Keys i18n agregadas: `timelineView.exportPDF` en en.json y es.json

## Pendiente
- Cambio de ícono Liquid Glass en Xcode Assets
- Set de screenshots en inglés para App Store
- Post Bundles feature
- Recapturar screenshot de notificaciones en inglés
- Email automático de invitación a proyecto (diseñado, no implementado)
- Configurar DNS wildcard *.lenzu.app para subdominios personalizados
- **Restricción Apple Watch por plan (implementar antes de mayo 2026)**
  * Actualmente cualquier usuario puede usar el Watch sin importar su plan
  * La restricción solo existe en marketing (Pricing.tsx) pero no en código
  * Cuando implementar: verificar user.current_plan en App.tsx y
    TimelineView.tsx antes de llamar watchService
  * Planes con acceso: pro, studio, master, lifetime
  * Planes bloqueados: free, starter, trial, none
  * Mostrar modal de upgrade si el plan no tiene acceso
- **Notificaciones push Community Chat (implementar en horario de baja actividad)**
  * Cuando el master escribe en Community → push a todos los demás usuarios
  * Cuando otros usuarios escriben → no mandar push (ya llega por Telegram)
  * Usar Firebase FCM (fcmTokens[] ya guardados en BD)
  * Firebase Admin SDK ya inicializado en services/firebase.js
  * Falta: crear función sendPushNotification() en services/firebase.js
  * Falta: lógica en routes/community.js para disparar según role
  * Limpiar tokens inválidos si FCM devuelve registration-token-not-registered
- Android: al menos 2 personas lo pidieron en TikTok (sin fecha definida)

## Beta Launch — Abril 2026

- Banner beta activo en /pricing: "🎉 Beta abierta — Acceso Studio completo gratis", countdown a mayo 8, 2026
- Registro: badge cambiado de "7-day free trial" a "30 días gratis" hasta mayo 8
- Registro: detección automática de idioma (ES/EN) con toggle manual
- Email bienvenida: bloque beta temporal activo hasta mayo 8
- Admin panel: botón "Dar Studio 30d" (antes era Pro)
- Cron activo: 3 mayo 15:00 UTC → send-beta-reminder.js → usuarios con plan studio (excluye master)
- Mayo 8: todos los cambios temporales revierten automáticamente
- Flujo manual: nuevos registros → admin → "Dar Studio 30d"

## Bug fix — CORS + HEIC (12 abril 2026)
- Root cause del crash "Fallo al agregar foto de fotógrafo" (reportado en App Store Connect, Build 1.1.0 build 6, iPhone 17 Pro, iOS 26.3.1): el origin `capacitor://localhost` no estaba en la lista de CORS permitidos en server.js. La request se bloqueaba antes de llegar a multer — por eso no había error de upload en los logs.
- Fix 1: Agregados origins de Capacitor en backend/server.js (líneas 58-68): `capacitor://localhost`, `ionic://localhost`, `http://localhost`
- Fix 2: Agregado soporte HEIC/HEIF en backend/middleware/upload.js: extensiones heic/heif, mimetypes image/heic, image/heif, application/octet-stream (iOS a veces manda HEIC como octet-stream)
- Cambios backend-only, no requirieron nuevo build de TestFlight

## Activity Logging System (12 abril 2026)
- Sistema de logging para monitorear el uso durante el beta
- Archivos nuevos:
  - backend/models/ActivityLog.js — modelo MongoDB, TTL 180 días, índices en userId, eventType, timestamp
  - backend/services/activityLogger.js — función logActivity() fire-and-forget (nunca bloquea el response al usuario)
- 11 touch points en backend:
  - auth.js: user.register, user.login
  - timeline.js: wedding.create, photographer.add, photographer.photo_upload, error.upload, shot.check
  - timeline.js: nuevo endpoint POST /:id/wedding-mode (solo loggea, no persiste — wedding mode vive en localStorage)
  - invitations.js: collaborator.invite, collaborator.accept (2 rutas: accept-invitation y accept-invite-token)
  - admin.js: GET /api/admin/activity con query params, protegido con requireMaster
- Frontend:
  - api.ts: getActivityLog() + logWeddingMode()
  - TimelineView.tsx: wedding.activate/deactivate en handleToggleFieldMode
  - AdminPanel.tsx: tab "Activity Log" con filtros, badges de color y auto-refresh 30s

## Nota importante — Wedding mode
- Wedding mode es localStorage-only (App.tsx + TimelineView.tsx) — no se persiste en el backend porque debe funcionar sin conexión a internet (escenario común en bodas)
- El log de wedding.activate/deactivate es best-effort: si no hay señal, la llamada falla silenciosamente
- Pendiente futuro: sync de eventos offline al recuperar conexión, y/o dashboard de "bodas en vivo" en admin

## Capacitor Native Detection

To detect if the app is running inside the Capacitor native app (iOS), use this exact condition:

```js
const isNativeApp =
  window.Capacitor?.isNativePlatform?.() === true ||
  navigator.userAgent.includes('Capacitor') ||
  window.location.href.startsWith('capacitor://');
```

Use this pattern whenever you need to show/hide elements depending on whether
the user is in the browser vs the native app.

## Personas del proyecto
- Alex Obregon → owner, desarrollador, fotógrafo principal
- Dani (Daniela) → segunda cámara, cuenta lifetime en Lenzu
- Jorge → mejor amigo de Alex, cuenta master en Lenzu
