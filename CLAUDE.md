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
- Build iOS: v1.1.0 build 11 — **✅ APROBADA para el App Store (2026-07-05)** tras resolver los 3 rechazos (5.1.1 eliminación de cuenta, 3.1.1 free-for-all, Guideline 4 ícono Watch). Publicación automática; visible en el store en ~24h desde la aprobación
- App ID de App Store Connect: 6761141674 → link del store: https://apps.apple.com/app/id6761141674
- Link público activo: https://testflight.apple.com/join/UbSPGPQ2
- Botón "Probar gratis en iPhone" visible en landing (etiqueta: TESTFLIGHT_BUTTON para comentar/descomentar)
- 51 sesiones registradas en TestFlight
- Usuario Apple Review creado en MongoDB: apple.review@lenzu.app / LenzuReview2026! (plan **pro**, sin expiración)
- ~~Ícono Liquid Glass generado — pendiente de implementar en Xcode Assets~~ ✅ completado
- App configurada como **iPhone only** (removido iPad y Mac de Supported Destinations)
- Capacitor config actualizado: `contentInset: 'never'`, `scrollEnabled: false` (fix definitivo del bounce nativo)

### App Store Connect (configurado 2026-06-20)
- Categoría principal: **Productivity**
- Precio: **Gratis ($0.00)** en todos los países
- Política de privacidad: https://lenzu.app/privacy
- Clasificación por edades: **4+**
- Derechos sobre contenido: No (contenido creado por usuarios propios)
- Privacy Nutrition Label completado — datos declarados:
  - Nombre y Email → Funcionalidad + Marketing del desarrollador, vinculados al usuario
  - Mensajes → Funcionalidad, vinculados al usuario
  - Fotos → Funcionalidad, vinculados al usuario
  - Otro contenido (timelines, shot lists) → Funcionalidad, vinculados al usuario
  - ID de usuario → Funcionalidad + Análisis, vinculado al usuario
  - ID del dispositivo (FCM token) → Funcionalidad, vinculado al usuario
  - Interacción con el producto (Activity Log) → Análisis, vinculado al usuario
  - Ningún dato usado para seguimiento ni compartido con terceros
- Contacto de revisión: Alejandro Obregon Hernandez / alexnoise24@gmail.com
- Publicación: automática al aprobar

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

## Cambios — 11 mayo 2026

### Rediseño Alto Edition (completado)
- Sistema de diseño "Alto" implementado: tokens en tailwind.config.js (PAPER, INK, LAVENDER, FOG, STONE, MOSS, EMBER, FIELD-*)
- Componentes base creados: Ticket, Wordmark, Button, Tag, Input, Avatar
- Navbar y Sidebar rediseñados con nuevo sistema visual
- Dashboard rediseñado con grupos por año colapsables (ver abajo)

### Dashboard — agrupación por año
- Timelines agrupados por año con secciones colapsables
- Solo el año actual está expandido por defecto
- Títulos: "THE SEASON / 2026", "NEXT SEASON / 2027", años pasados "2025 /"
- Al buscar, todos los años con resultados se expanden automáticamente
- Tarjeta "próximo evento" en lavanda con tilt -0.8° y sombra offset

### Dashboard — layout de filas
- Mobile: 2 líneas (nombre de pareja arriba, fecha + tag abajo) — sin truncado
- Desktop: columna descripción con ancho fijo (w-56 xl:w-96) + contenedor derecho fijo w-32 para tag+acciones — texto siempre al mismo margen

### ShootList — modo boda (campo oscuro)
- Prop `fieldMode` agregada a ShootList.tsx
- En TimelineView.tsx se pasa `fieldMode` cuando está activo wedding mode en mobile
- Tokens de color condicionales: text-field-text, bg-field-surface, border-white/10, etc.

### Navbar — Wordmark siempre visible
- Removida lógica de branding condicional (logo personalizado ya no aparece en navbar)
- Siempre muestra `<Wordmark size={22} />` independiente del plan del usuario

### BrandingSettings — simplificado
- Removida sección de subida de logotipo
- Solo queda campo "Nombre del estudio"

### Favicon y PWA icons
- favicon.svg creado: cuadrado lavanda rotado -6° con "L" en negro (coincide con Ticket)
- index.html actualizado: título, theme-color #7B7FE0, apple-mobile-web-app-title "Lenzu"
- manifest.json actualizado: name "Lenzu", colores, descripción
- icon-192.png y icon-512.png regenerados con el ícono correcto del usuario

### Ícono iOS + Watch + Splash
- Ícono principal en `ios/App/App/Assets.xcassets/AppIcon.appiconset/` reemplazado con diseño final del usuario
- Ícono Apple Watch en `ios/App/LenzuWatch Watch App/Assets.xcassets/AppIcon.appiconset/AppIcon.png` actualizado
- Splash screens generados con `npx @capacitor/assets generate --ios` desde `resources/splash.png`
- Imagen fuente en `frontend/resources/splash.png` (2732×2732 aprox)
- Build enviado a TestFlight: build 5

### i18n Pricing.tsx
- Agregado `i18n` al destructure de useTranslation (faltaba, causaba error en locale de fechas)
- FAQ reemplazado con keys i18n: plans.faq1q/a, plans.faq2q/a, plans.faq3q/a
- plans.questions usada para texto de contacto

## Reengagement — Mayo 2026

- Email de reactivación enviado el 29 mayo 2026 a 8 usuarios con plan expirado (últimos 60 días)
- Template: correo personal de Alex, botón "PRUÉBALO UN MES MÁS"
- Endpoint: `GET /api/auth/extend-plan?token=xxx` — valida JWT tipo `reengagement`, extiende Studio 30d, redirige a `/login?extend=success`
- Token JWT firmado con JWT_SECRET, expira en 7 días (link de un solo uso temporal)
- Script: `backend/scripts/send-reengagement.js` — reutilizable para futuras campañas
  - Dry run: `node scripts/send-reengagement.js --dry-run`
  - Envío real: `node scripts/send-reengagement.js`
- Login.tsx muestra mensaje de éxito cuando llegan tras hacer clic

## Pendiente
- ~~Cambio de ícono en Xcode Assets~~ ✅ completado
- ~~Set de screenshots en inglés para App Store~~ ✅ screenshots en español subidos (primary language ES)
- Post Bundles feature
- ~~Recapturar screenshot de notificaciones en inglés~~ ✅ mockup generado
- ~~Email automático de invitación a proyecto~~ ✅ implementado 2026-07-06 (ver "Cambios — 6 julio 2026")
- Configurar DNS wildcard *.lenzu.app para subdominios personalizados
- ~~Restricción Apple Watch por plan~~ ✅ implementado 2026-07-02 (ver sección "Cambios — 2 julio 2026")
- ~~Notificaciones push Community Chat~~ ✅ implementado 2026-07-06 (ver "Cambios — 6 julio 2026"). Nota: la infra `sendPushNotification()` YA existía en `services/notifications.js` (no en firebase.js); solo faltaba la lógica de disparo por role
- Android: al menos 2 personas lo pidieron en TikTok (sin fecha definida)
- ~~Próximo build de Xcode: `ITSAppUsesNonExemptEncryption = NO`~~ ✅ agregado al Info.plist 2026-07-06 (aplica en el próximo binario que archives)
- **Próximo build de Xcode — splash screen**: `@capacitor/splash-screen` NO está instalado (pantalla blanca al abrir). Fix: `cd frontend && npm install @capacitor/splash-screen && npx cap sync ios` (imágenes ya generadas en Assets). Requiere binario nuevo
- Recordatorio de build: mantener Version/Build del target Watch SIEMPRE igual al target App
- ~~UX menor: contraseña incorrecta en el modal de eliminar cuenta~~ ✅ corregido 2026-07-06 (ver "Cambios — 6 julio 2026")
- Si Apple borra la cuenta demo probando el flujo de eliminación → recrearla (script Mongoose con `new User()` + `.save()`, nunca insertOne) con su timeline de ejemplo
- Re-monetización futura: `FREE_FOR_ALL = false` en utils.ts + pasos de deployment/IAP-SETUP.md (requiere resolver alta fiscal — de Alex o cuenta nueva a nombre de Dani)

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

## Cambios — Junio 2026

### iOS Safe Area / Dynamic Island (fix definitivo)
- `#root { position: fixed; inset: 0; background: #F1EFEA; overflow: hidden; }` — ancla el root al viewport exacto, elimina drift de height%
- `*, *::before, *::after { overscroll-behavior: none; }` — bloquea bounce en todos los scroll containers
- `html, body { height: 100%; overflow: hidden; }` — el documento nunca scrollea, solo scrollean los containers internos
- `#root::after` pseudo-elemento cubre el inset nativo del WKScrollView con color crema (parche CSS hasta rebuild con config nuevo)
- JS en App.tsx: `blockBounce` listener en touchmove — cancela el evento a nivel documento salvo que venga de un scroll container real
- Todas las páginas cambiadas de `h-screen` → `h-full` para que dimensionen relativo a `#root`
- Cada scroll container recibe `paddingBottom: calc(env(safe-area-inset-bottom) + 1.5rem)` en iOS

### Capacitor config (requería rebuild — ya aplicado en build 8)
- `contentInset: 'never'` (antes: 'automatic') — elimina el inset nativo del WKScrollView que causaba el margen blanco
- `scrollEnabled: false` (antes: true) — desactiva el bounce elástico nativo del WKWebView
- Archivos: `frontend/capacitor.config.ts` + `frontend/ios/App/App/capacitor.config.json`

### Pro Gate overlay (Modo Boda)
- Reemplazado toast (bloqueado por Dynamic Island) por overlay centrado con blur
- Fondo: `backdrop-filter: blur(8px)` + `rgba(10,10,10,0.55)`
- Card: `bg-paper border-ink`, símbolo ✦, título "FUNCIÓN PRO", instrucciones para ir a Safari
- Toca fuera o botón Cerrar para descartar
- Estado: `showProGate` en TimelineView.tsx
- i18n: `plans.proFeature` agregada en es.json y en.json

### App Store — Planes
- Trial eliminado completamente: nuevos fotógrafos entran en plan `free`
- Planes activos: `free` y `pro` (studio/starter se mantienen en BD para usuarios existentes)
- Usuarios invitados: `current_plan: 'guest'`, se muestra como "INVITADO"/"GUEST" en UI

### App Store — Submission (build 8) — enviado a revisión 2026-06-20
- App configurada como iPhone only (TARGETED_DEVICE_FAMILY = 1)
- Screenshots: 5 capturas en español, 1284×2778px (iPhone 15 Plus simulator)
- Watch screenshot: 396×484px (`frontend/src/assets/screenshots/screenshot-watch-46mm.png`)
- Descripción, texto promocional y palabras clave en español agregados
- Cuenta reviewer: apple.review@lenzu.app / LenzuReview2026! (plan pro, sin expiración)
- Notas para Apple: credenciales + explicación de que pagos son solo en lenzu.app/Safari (Guideline 3.1.1)
- Categoría: Productivity · Precio: Gratis · Clasificación: 4+
- Privacy Nutrition Label completado (ver sección "App Store Connect" en Estado actual)
- Publicación configurada como automática al aprobar

### Fix — PrivacyPolicy scroll (2026-06-20)
- `frontend/src/pages/PrivacyPolicy.tsx`: `min-h-screen` → `h-full overflow-y-auto`
- El CSS global `#root { overflow: hidden }` del fix iOS bloqueaba el scroll de la página de privacidad
- Patrón a aplicar en cualquier página standalone que necesite scroll propio

### Notificaciones push — Mensajes de proyecto
- `backend/routes/messages.js`: llama `notifyTimelineMembers()` al guardar cada mensaje
- Solo mensajes de proyecto (no Community Chat) generan push
- Fire-and-forget: nunca bloquea la respuesta al usuario

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

## ⚠️ ARQUITECTURA CRÍTICA — La app iOS carga de lenzu.app (server.url)

**`frontend/capacitor.config.ts` tiene `server.url: 'https://lenzu.app'`.** Esto significa que la app de iOS **NO ejecuta el `dist/` empaquetado en el binario** — carga el sitio web en vivo `https://lenzu.app` dentro del WebView nativo.

Consecuencias (memorizar para no perder horas):
- **Los cambios de frontend NO viven en el binario.** Viven en lo desplegado en lenzu.app. `npm run build` + `npx cap sync ios` + clean build en Xcode **no cambian el comportamiento** de la app: sigue cargando el frontend remoto.
- Para que un fix de frontend llegue a la app iOS hay que **desplegar el frontend a lenzu.app** (ver "Deploy solo frontend" abajo). El efecto es inmediato (carga remota), sin binario nuevo.
- `Capacitor.isNativePlatform()` **es `true`** aunque cargue de lenzu.app (el bridge se inyecta igual). No confundir "veo la versión web dentro de la app" con "isNative es false" — es que la app literalmente carga la web.
- El binario nuevo solo hace falta para cambios **nativos** (íconos, Watch, `TARGETED_DEVICE_FAMILY`, plugins, etc.).
- API y Socket ya usan URL **absoluta** (`VITE_API_URL`/`VITE_SOCKET_URL = https://lenzu.app`), y el CORS del backend ya incluye `capacitor://localhost`. Es decir: migrar a app autocontenida (quitar `server.url` + empaquetar `dist/`) es viable a futuro, pero requiere re-test a fondo (safe-area CSS, OAuth/redirects, push, deep links pasarían a origen `capacitor://localhost`). Apple a veces penaliza wrappers remotos puros (Guideline 4.2).

## Deploy solo frontend (a lenzu.app, sin tocar backend)

Nginx sirve el frontend desde `root /var/www/timeline/frontend/dist` (server block `lenzu.app` en `/etc/nginx/sites-available/timeline`, habilitado por symlink).

```bash
cd "/Volumes/T7/Web APP/Timeline/frontend"
npm run build                                    # tsc && vite build → regenera dist/
scp -r "/Volumes/T7/Web APP/Timeline/frontend/dist/"* \
  alexobregon@192.168.100.150:/var/www/timeline/frontend/dist/
```
- NO ejecutar `deploy-production.sh` si solo quieres frontend (ese hace git push + rsync backend + pm2 restart).
- Verificación post-deploy: `curl -s https://lenzu.app/ | grep -oE "assets/index-[A-Za-z0-9_-]+\.js"` debe mostrar un hash **distinto** al anterior.
- No reinicia pm2 (no hace falta para assets estáticos).

## Cambios — 22 junio 2026 (3 rechazos de Apple resueltos)

### Rechazo Guideline 2.1a — login del usuario demo rebotaba
- Causa: el usuario demo no existía en la BD `wedding-timeline`. No era bug de código.
- **Usuario demo PERMANENTE creado** (vía script Mongoose `new User()` + `.save()` para que el hook pre-save hashee con bcrypt — NUNCA `insertOne` directo):
  - email: `appreview@lenzu.app` · password: en App Store Connect → App Review Information (lleva `$` al final)
  - role: `creator` · current_plan: `pro` · permanente (sin expiración, `is_payment_required: false`)
  - Timeline de ejemplo asociado con contenido visible: "Sofia & Daniel - Tulum Wedding" (9 eventos + 10 shot-list items). Apple rechaza cuentas demo vacías.
- Verificado: login real `POST https://lenzu.app/api/auth/login` → 200 + token; password hasheado en BD; password incorrecto → 401.
- **No borrar este usuario ni su timeline, ni bajar su plan.** Es con el que Apple revisa.

### Rechazo Guideline 4 (Design) — ícono Apple Watch con fondo negro
- watchOS recorta los íconos en círculo y no admite transparencia.
- Fix en `ios/App/LenzuWatch Watch App/Assets.xcassets/AppIcon.appiconset/AppIcon.png`: logo (cuadro lavanda #7B7FE0 rotado -6° + L negra) sobre **fondo crema sólido #F1EBE0**, 1024×1024, **sin canal alfa** (`hasAlpha: no`), con margen de seguridad para el recorte circular.
- Es un cambio **nativo** → requiere binario nuevo (subir build number en Xcode antes de archivar).

### Rechazo Guideline 3.1.1 — acceso a Plan Pro sin IAP
- Decisión de producto: NO implementar IAP. En su lugar, **ocultar en iOS** todo rastro de pago/planes (gating por `isNative`; en web TODO queda igual).
- Patrón: condicionar con `isNative` (`usePlatform()` / `Capacitor.isNativePlatform()`) — ocultar en nativo, mantener en web.
- Casos resueltos en frontend:
  1. **Inspiración**: gating cambiado a **plan del DUEÑO del timeline** (`ownerHasPro` = `FULL_ACCESS_PLANS.includes(currentTimeline.owner.current_plan)`), no del usuario logueado. Así un guest free en proyecto de dueño Pro SÍ ve Inspiración; dueño free → oculta para todos. En nativo+dueño no-Pro, la tab se filtra (sin candado).
  2. Modo Boda: botón oculto en nativo si `!hasPro`.
  3. Overlay ProGate eliminado por completo.
  4. Branding: en nativo redirige a `/settings` sin botón "ver planes".
  5. Navbar: ítem "Mi Plan" oculto en nativo.
  6. Rutas `/pricing` y `/my-plan`: `<Navigate to="/dashboard">` duro y temprano en nativo (App.tsx).
  7. Support: link "Ver planes" + FAQ de suscripción filtrados en nativo.
  8. TrialBanner / TrialExpiredModal: no se muestran en nativo.
  9. Badges de plan en Community/CommunityChat: `null` en nativo.
  10. AccountSettings: etiqueta de plan oculta en nativo.
  11. Login/Register: no navegan a `/pricing` en nativo.
  12. Páginas legales (Terms/Privacy) **siguen accesibles** pero sin menciones de precio/suscripción/facturación/renovación en nativo (regex + override por línea; sección 4 de Terms neutralizada a "Acceso"). En web, texto legal completo.
- master y lifetime siguen en `hasPro`/`FULL_ACCESS_PLANS` → conservan acceso completo en web e iOS.
- **Backend (único cambio, ya desplegado a prod):** `backend/routes/timeline.js` — añadido `current_plan` al `select` de los 7 `populate('owner', ...)`. Necesario para el gating de Inspiración por dueño. Verificado en prod: `GET /timelines` y `/timelines/:id` devuelven `owner.current_plan`, sin filtrar password.

### Fix Service Worker (`frontend/public/sw.js`) — servía builds viejos
- El SW viejo (`lenzu-app-v1`) era **cache-first** y precacheaba `'/'` (index.html) con nombre de caché fijo que nunca se invalidaba → servía código viejo dentro del WebView, sobreviviendo a reinstalar y a clean build.
- Fix v2: `CACHE_NAME = 'lenzu-app-v2'` (el `activate` borra la caché vieja), ya no precachea `'/'` ni assets, **navegación = network-first** (siempre trae index.html fresco), resto a red directa (assets hasheados se auto-bustean). Se auto-sana en cada build futuro.

### Fix safe area — onboarding (`frontend/src/components/Onboarding.tsx`)
- El botón "Omitir" se encimaba con el reloj/Dynamic Island. Header ahora usa `paddingTop: calc(env(safe-area-inset-top) + 1rem)`; navegación inferior usa `paddingBottom: calc(env(safe-area-inset-bottom) + 1.5rem)` (mismo patrón que el resto de la app). `index.html` ya tenía `viewport-fit=cover`.

### Estado de despliegue (22 jun 2026)
- Backend: desplegado a prod (solo `routes/timeline.js`, vía scp + pm2 restart; los otros archivos backend dirty NO se desplegaron).
- Frontend: desplegado a lenzu.app (build + scp de `dist/`), incluye gating 3.1.1, legal, sw.js v2 y fix de onboarding.
- **Pendiente: binario nuevo en Xcode** (solo por el ícono del Watch) → subir build number → Archive → TestFlight/App Store.

## Cambios — 2 julio 2026

### Fix modo boda multi-día
- Bug: con 2 días de cobertura, el modo boda mezclaba ambos itinerarios (Watch los entrelazaba por hora, las notificaciones del día 1 se disparaban el día 2, el teléfono mostraba ambos días)
- Nuevo helper `getActiveDay(days)` en `frontend/src/lib/utils.ts`: día cuya fecha = hoy; si no, el próximo futuro; si todos pasaron, el último (cubre bodas pasada la medianoche)
- Aplicado en: `watchService.syncTimelines()` (Watch recibe solo el día activo), notificaciones locales en TimelineView.tsx, y panel de timeline del WeddingSwipeView
- Fix 100% frontend — no requiere binario

### ⭐ DECISIÓN DE ESTRATEGIA: FREE-FOR-ALL (2 julio 2026)
- **Todo el producto es GRATIS para todos** (web e iOS) mientras se construye base de usuarios. Motivo: Alex no puede darse de alta fiscalmente → no puede firmar el Paid Apps Agreement → no puede ofrecer IAP → la única salida 100% limpia al rechazo 3.1.1 es que no exista nada que comprar en ningún lado
- Flag central: `FREE_FOR_ALL = true` en `frontend/src/lib/utils.ts` — con el flag activo `hasFullAccess()` devuelve true para cualquier usuario logueado (Modo Boda, Watch, Inspiración abiertos para todos)
- UI de planes oculta con el flag (web Y nativo): rutas /pricing y /my-plan redirigen, "Mi Plan" fuera del Navbar, banners/modales de trial, etiqueta de plan en AccountSettings, badges de plan en Community/CommunityChat, FAQ y link "Ver planes" en Support, sección de precios y links "Precios" en Landing (muestra "GRATIS. ASÍ DE SIMPLE.")
- **Para re-monetizar**: poner `FREE_FOR_ALL = false` + configurar RevenueCat/ASC (ver IAP-SETUP.md) + env var `VITE_REVENUECAT_IOS_KEY` — todo el flujo IAP está construido y dormido
- Notas de review para Apple: "Lenzu es una app gratuita; todas las funciones están disponibles para todos los usuarios" — ahora es literalmente cierto
- NO se firmó el Paid Apps Agreement ni se creó el producto en ASC (pausado; no necesario mientras sea gratis)

### In-App Purchase — Plan Pro $4.99/mes (CONSTRUIDO PERO DORMIDO — ver decisión arriba)
- **Guía completa de setup: `deployment/IAP-SETUP.md`** (pasos manuales en App Store Connect + RevenueCat + Xcode)
- Plugin: `@revenuecat/purchases-capacitor` (SPM, requiere binario nuevo + capability In-App Purchase)
- `frontend/src/services/iapService.ts` — configure con `appUserID = user._id` (hooked en authStore login/register/checkAuth/logout), purchase, restore, entitlement `pro`
- `/my-plan` ahora SÍ disponible en nativo: paywall IAP (suscribirse, restaurar compras, disclosure de auto-renovación). `/pricing` (Stripe) sigue bloqueado en nativo → redirige a /my-plan
- Navbar: "Mi Plan" visible también en nativo; botón Modo Boda sin Pro → /my-plan en nativo
- Key `plans.nativeUpgradeMsg` ("visita lenzu.app en Safari") ELIMINADA — era steering prohibido por 3.1.1
- Backend: `backend/routes/iap.js` — `POST /api/iap/webhook` (eventos RevenueCat, auth por header vs `REVENUECAT_WEBHOOK_SECRET`) + `POST /api/iap/verify` (activación inmediata post-compra vía REST API con `REVENUECAT_SECRET_KEY`)
- Modelo User: nuevo campo aditivo `plan_source: 'apple'|'stripe'|'manual'|null` — los eventos de Apple solo bajan planes con source 'apple'; nunca tocan planes manuales (beta testers), master ni lifetime
- Env vars nuevas (NO configuradas aún): backend `REVENUECAT_WEBHOOK_SECRET`, `REVENUECAT_SECRET_KEY`; frontend `VITE_REVENUECAT_IOS_KEY`

### Restricción Apple Watch por plan (pendiente de abril, cerrado)
- `hasFullAccess(user)` + `FULL_ACCESS_PLANS` centralizados en `frontend/src/lib/utils.ts` (role master o plan pro/master/lifetime + legacy studio/starter; bloqueados: free, none, guest). TimelineView y Dashboard ahora importan de ahí (antes tenían copias locales)
- `watchService.syncTimelines()`: sin acceso → manda lista vacía al Watch (limpia timelines viejos de cuentas degradadas)
- `watchService.syncWeddingMode()`: activaciones requieren Pro; desactivaciones siempre pasan (cleanup)
- `watchService.scheduleEventNotifications()`: gated
- App.tsx `handleStartWedding` (modo boda iniciado DESDE el Watch): rechazado sin Pro + resetea el estado del Watch
- 100% frontend, no requiere binario

### Acceso a Configuración + eliminación de cuenta (rechazo 5.1.1)
- El flujo de eliminar cuenta ya existía y está en prod, pero solo era accesible vía sidebar → Configuración (por eso Apple no lo encontró)
- Navbar: menú del avatar ahora incluye "Configuración" como primer item → /settings
- Modal de eliminación en nativo: la línea "Tu suscripción será cancelada" cambia a aviso de cancelar la suscripción de Apple en Ajustes › Suscripciones (`settings.deleteItemAppleSub`) — las suscripciones de Apple no se pueden cancelar server-side

### Rechazos App Review 24 jun 2026 (submission 2857bca6)
- 5.1.1 eliminación de cuenta: YA EXISTE (Ajustes → Danger Zone, endpoint DELETE /users/account) y está en producción — responder a Apple con screen recording del flujo (cuenta desechable, no la demo)
- Guideline 4 ícono Watch: el PNG local ya es el correcto (crema) pero el build 10 no lo incluyó — commitear, clean build, verificar en Organizer antes de subir
- 3.1.1: resuelto con FREE-FOR-ALL (app 100% gratuita — ver decisión de estrategia arriba)

### Fix toast tapado por Dynamic Island (desplegado)
- El offset del Toaster se calculaba con `getComputedStyle(...).getPropertyValue('--sat')` que devuelve el string literal "env(...)" (parseInt → NaN → offset 0) → el toast quedaba bajo el Dynamic Island
- Fix en App.tsx: offset como `calc(env(safe-area-inset-top) + 12px)` directo a sonner, en `offset` Y `mobileOffset` (sonner v2 ignora `offset` en viewports <600px)

### Deploy 2 jul 2026 (COMPLETO — frontend + backend)
- Commits `d39130b` (83 archivos: todo lo de arriba + backend pendiente de sesiones previas) y `254fda2` (toast fix), pusheados a GitHub
- `deploy-production.sh` ejecutado completo: frontend a lenzu.app + backend rsync + pm2 restart — verificado (bundle nuevo, health OK, ruta /api/iap viva y protegida, logs limpios)
- El modo gratis-total quedó vivo también en la app iOS al instante (carga lenzu.app remoto)

### Resubmisión a App Review — ENVIADA 2 jul 2026
- **Build 1.1.0 (11)** archivado y subido — incluye ícono Watch crema (verificado visualmente en Assets antes de archivar)
- **Watch target sincronizado**: estaba en Version 1.0 / Build 4 (probable causa del "Version reviewed: 1.0" en rechazos) → ahora 1.1.0 / 11 igual que la app
- Export compliance: "Ninguno de los algoritmos" (solo HTTPS del sistema = exento)
- Notes de App Review reescritas SIN mencionar plan Pro ni pagos (la mención de "pagos en lenzu.app/Safari" de junio fue probablemente lo que causó el segundo rechazo 3.1.1)
- Video del flujo de eliminación adjunto: `lenzu-account-deletion.mp4` (ojo: ASC rechaza extensiones en MAYÚSCULAS/.MP4 y nombres con espacios)
- Cuenta demo verificada contra prod el mismo día: appreview@lenzu.app / password en ASC → login OK, proyecto "Sofia & Daniel - Tulum Wedding" (9 eventos, 10 shots)
- App Store Connect: Paid Apps Agreement quedó aceptado pero SIN banco ni formularios fiscales — estado "pendiente" indefinido, inofensivo, NO completarlo mientras la app sea gratis; DSA declarado "No soy comerciante / no distribuyo en UE"

## Cambios — 6 julio 2026

### App PUBLICADA en el App Store (live)
- La build 1.1.0 (11) aprobada el 5 jul ya está **visible y descargable** en el store: https://apps.apple.com/app/id6761141674
- App 100% gratuita (FREE_FOR_ALL) — ver [[lenzu-free-for-all]]

### TestFlight → App Store en toda la web
- `Landing.tsx`: botón hero "Probar en iPhone · BETA · TESTFLIGHT" → **"Descarga en App Store · GRATIS · iPHONE"** (link `apps.apple.com/app/id6761141674`)
- `Dashboard.tsx`: banner de creators (solo web) migrado a App Store
- i18n: claves `testflight*` → `appstore*` (ES/EN). **Cero referencias a TestFlight ni al link `UbSPGPQ2` en `src/`**
- El link público de TestFlight (`UbSPGPQ2`) queda obsoleto

### Push notifications — Community Chat
- Nuevo helper `notifyCommunityBroadcast(senderId, notification, data)` en `backend/services/notifications.js`
- `routes/community.js` POST `/`: si el autor es **master** → push a todos los usuarios excepto el autor y excepto `role: 'guest'`. Otros usuarios → sin push (ya llega por Telegram). Fire-and-forget
- Reutiliza `sendPushNotification()` (que YA existía, con limpieza de tokens FCM inválidos)

### Email automático de invitación a proyecto (registrados y no registrados)
- `backend/services/email.js`: nuevo `sendProjectInvitationEmail()` + template Lenzu (navy/crema); usa `branding.emailFooter` del fotógrafo si está configurado
- `routes/invitations.js` POST `/invite/:timelineId`: **ya NO devuelve 404** si el email no está registrado — genera token JWT atado al email y manda correo con link a `/invite/:token`. Usuarios registrados: además del push/in-app, ahora reciben email con link directo al proyecto
- `accept-invite-token`: valida que el email del token coincida con el del usuario (los tokens de "Copiar link" no llevan email → no se ven afectados)
- Frontend: el flujo ya existía casi completo — `InviteAccept.tsx` (logueado→acepta; deslogueado→`/register?invite=`), `Register.tsx` (auto-acepta tras registro). Se agregó: `Login.tsx` maneja `?invite=` (cubre registrado+deslogueado), y el link "Iniciar sesión" de Register preserva el token
- URL base de los links en el email: `process.env.FRONTEND_URL || 'https://lenzu.app'`
- Depende de `EMAIL_USER`/`EMAIL_PASSWORD` en prod (los mismos del welcome/reengagement)

### Fix UX — modal de eliminar cuenta (rechazo 401)
- `lib/api.ts`: el interceptor ya NO fuerza logout en 401 de `/users/account` (antes trataba el "contraseña incorrecta" como sesión expirada y mandaba al login). Variable `isAuthRoute` → `skip401Redirect`
- `AccountSettings.tsx`: en 401 muestra toast localizado "Contraseña incorrecta" y el usuario permanece en Configuración
- i18n: nueva key `settings.incorrectPassword` (ES/EN)

### Info.plist — export compliance
- Agregado `ITSAppUsesNonExemptEncryption = NO` al target App (aplica en el próximo binario que archives). Ver [[ios-pending]]

### Xcode (commits de esta sesión)
- `project.pbxproj`: bumps del build 11 ya aprobado (App 10→11, Watch 4→11 y 1.0→1.1.0) commiteados
- `Package.resolved`: dependencias SPM de RevenueCat (dormidas) commiteadas

### Deploy
- Tres deploys completos (`deploy-production.sh`): commits `2e835fa`, `b5c3055` — frontend a lenzu.app + backend rsync + pm2 restart, verificados (bundle nuevo, health 200)

## Cambios — 15 julio 2026

### Diagnóstico invitaciones "no llegan" a no-registrados
- El backend SÍ enviaba todos los correos (logs pm2 confirman); el problema era de ENTREGA + visibilidad, no de código
- mail-tester desde prod: **10/10** — SPF pass, DKIM firma `d=lenzu.app` (GoDaddy sí firma DKIM vía smtpout), dmarc=pass
- Correos del 6 jul enviados antes de 17:25 UTC salieron con el transporter viejo de Gmail (pm2 se reinició con config GoDaddy a esa hora) → probable Spam
- DNS: hay DOS registros DMARC en `_dmarc.lenzu.app` (p=reject + p=quarantine) = inválido; el DNS está en **Cloudflare** — Alex quedó de borrar el p=reject
- Si un destinatario "no recibe": buscar en Spam/Promotions y revisar rebotes en el buzón de support@lenzu.app (webmail GoDaddy)

### Invitaciones pendientes por email (no registrados) — implementado y desplegado
- `Timeline.pendingEmailInvites` (campo aditivo): `{ email, invitedBy, invitedAt, lang }`
- POST `/invite/:timelineId` rama no-registrado: persiste/actualiza la entrada (re-invitar el mismo email = refresca fecha + token nuevo)
- Limpieza automática: `accept-invite-token` y la rama de usuario registrado borran la entrada al materializarse la invitación
- GET `/timeline/:id/pending`: ahora devuelve `type: 'user' | 'email'` combinando invitedTimelines + pendingEmailInvites
- Nuevo DELETE `/timeline/:id/email-invite?email=` (owner) para cancelar — solo bookkeeping, el JWT enviado sigue válido hasta expirar
- `CollaboratorsModal.tsx`: email invites en "Pending Invitations" con ícono Mail, botón reenviar (RefreshCw, manda correo nuevo con token fresco) y cancelar (X)
- **Tokens de invitación (email y copiar-link): 7d → 30d**
- Backfill en prod: entradas creadas para los 4 invitados aún no registrados (jillimcewan, emilymbrown13, carlo.wedding.2027, hello@beachlensphotography.com) con su fecha original — los links del 6 jul YA EXPIRARON, reenviar desde el modal
- Verificado E2E contra prod (invite → pending → cancel) con JWT firmado server-side; API interna en puerto **5050** (no 5000)
- Deploy completo commit `0928f54`
- DNS: Alex borró el registro DMARC duplicado (queda solo `p=quarantine`, verificado); buzón support@lenzu.app sin rebotes → correos aceptados por Gmail, buscar en Spam/Promotions
- Decisión: NO crear registro www.lenzu.app (el aviso de Cloudflare se ignora; todos los links usan lenzu.app directo)

### Vendors por proyecto (Overview) — implementado y desplegado
- `Timeline.vendorsList` (campo aditivo): `{ name, instagram, role }`
- Card "Vendors" en Overview entre General Information y Photographers Team, mismo patrón de edición global que locaciones (isEditing + Save)
- Instagram normalizado con helper `igHandle()` (acepta `@user`, `user` o URL de instagram.com pegada) → link a instagram.com/handle
- El PUT `/timelines/:id` ya aceptaba cualquier campo del esquema (`Object.assign`) — solo se agregó el campo al modelo
- i18n: keys `overview.vendors*` en ES/EN
- Verificado E2E en prod: PUT guarda vendors y el resto del proyecto queda intacto (days/shots/collaborators/pendingEmailInvites sin cambios)
- Deploy completo commit `4cd9f83`
- Idea futura anotada: biblioteca global "mis vendors" en Settings con autocompletar (vendors recurrentes de fotógrafos destino)

## Cambios — 16 julio 2026

### Fix crítico — registro de guests roto desde el 2 de julio
- El deploy del 2 jul (`d39130b`) agregó `user.current_plan = 'guest'` en `routes/auth.js` pero NUNCA se agregó `'guest'` al enum de `current_plan` en `models/User.js` → **todo registro con role guest (links de invitación) devolvía 500** desde entonces
- Fix: `'guest'` agregado al enum (aditivo). Desplegado a prod (scp + pm2 restart) y verificado E2E: registro guest → 201 con `current_plan: 'guest'` (usuario de prueba borrado después)
- Afectados detectados: planner@destinationweddingstulum.com (3 intentos fallidos 16 jul, nunca se creó su cuenta — su link sigue válido, puede reintentar) y Emily Brown (emilymbrown13@gmail.com), que le sacó la vuelta registrándose como photographer → por eso aparece con plan free en admin, y **quedó SIN conectar al proyecto "Emily & Ryan"** (sin collaborator, sin invitedTimelines, su pendingEmailInvite sigue vivo) — reenviar invitación desde el modal para conectarla

## Personas del proyecto
- Alex Obregon → owner, desarrollador, fotógrafo principal
- Dani (Daniela) → segunda cámara, cuenta lifetime en Lenzu
- Jorge → mejor amigo de Alex, cuenta master en Lenzu
