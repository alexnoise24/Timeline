# Migración a la nube — Plan por fases

**Motivo:** Alex se muda de casa y no quiere llevarse el servidor local (192.168.100.150).
**Objetivo:** que lenzu.app funcione 100% desde la nube, sin downtime perceptible para los usuarios del App Store.
**Estado:** PLAN APROBADO, NO INICIADO — comenzar solo cuando Alex dé el OK, fase por fase.
**Fecha del plan:** 2026-09-10

## Arquitectura destino

| Pieza actual (server casa) | Destino | Costo |
|---|---|---|
| MongoDB local `wedding-timeline` (0.2 MB, 6 colecciones) | MongoDB Atlas M0 | Gratis |
| Backend Express + Socket.io + pm2 | Railway (recomendado; alt: Render) | ~$5 USD/mes |
| Frontend nginx `/var/www/timeline/frontend/dist` | Vercel | Gratis |
| Fotos `backend/uploads/` (18 MB, disco local) | Cloudflare R2 (alt: Vercel Blob / S3) | Gratis |
| Cloudflare Tunnel | Se elimina — hosts cloud tienen URL pública | — |

**Por qué NO backend en Vercel:** serverless mata Socket.io (WebSockets persistentes), el filesystem es efímero (multer diskStorage) y los patrones fire-and-forget (push, activity log) mueren al responder. Railway/Render corren el Express tal cual, sin reescritura.

## Principios de seguridad (app live en App Store, 33+ usuarios)

- La app iOS carga `https://lenzu.app` en vivo → la migración NO requiere binario nuevo ni revisión de Apple. El cutover de DNS migra a todos los iPhones al instante — y el rollback también.
- **Mismo `JWT_SECRET` en el host nuevo** → ninguna sesión se cierra (crítico: incluye la cuenta demo de Apple appreview@lenzu.app).
- Todo se prueba en staging (`staging.lenzu.app` / `api-staging.lenzu.app`) con el iPhone real de Alex ANTES de tocar el DNS de producción.
- El servidor de casa queda prendido 1–2 semanas post-cutover como rollback (revertir = cambio DNS en Cloudflare, minutos).
- Cutover en hora muerta, verificando en admin/activity log que no haya boda activa ese día.

## Inventario de secretos a migrar (verificado 2026-09-10)

Variables del `.env` de prod: `MONGODB_URI`, `JWT_SECRET`, `PORT` (5050 interno), `NODE_ENV`, `FRONTEND_URL`, `EMAIL_HOST/PORT/SECURE/USER/PASSWORD` (GoDaddy SMTP), `TELEGRAM_BOT_TOKEN/CHAT_ID`, `VAPID_PUBLIC/PRIVATE_KEY`, `STRIPE_*` (dormidas, FREE_FOR_ALL).
**⚠️ Archivo aparte:** `backend/config/firebase-service-account.json` (credencial FCM, NO está en .env ni en git) — en Railway va como variable (JSON en env var o secret file) y hay que adaptar cómo lo carga `services/notifications.js` si lee del filesystem.

---

## FASE 0 — Preparación (sin tocar nada)

1. Alex crea cuentas: MongoDB Atlas, Railway (login con GitHub), Vercel (login con GitHub). Cloudflare ya existe (DNS + futuro R2).
2. Copiar/respaldar fuera del server: `.env` completo y `firebase-service-account.json` (el server desaparece; estos secretos no existen en ningún otro lado).
3. Backup completo: `mongodump` de `wedding-timeline` + tar de `uploads/` guardados en el T7.
4. Decidir subdominio de API definitivo: **`api.lenzu.app`** (Railway) — el frontend en Vercel no puede proxear WebSockets de forma confiable, así que sockets y API van directo al subdominio.
5. Revisar cómo el backend carga la credencial de Firebase (¿ruta hardcodeada al JSON?) y planear el cambio a env var.

## FASE 1 — MongoDB → Atlas (reversible al 100%)

1. Crear cluster M0 gratuito (región US más cercana), usuario de BD, allowlist `0.0.0.0/0` (Railway no tiene IP fija; el acceso real lo protege user/password fuerte).
2. `mongodump` en el server → `mongorestore` a Atlas.
3. Validar: conteo de documentos por colección idéntico (users, timelines, activitylogs, emaillogs, etc.); login de prueba contra Atlas.
4. **Paso clave de de-riesgo:** cambiar `MONGODB_URI` del server de casa a Atlas + `pm2 restart timeline-api`. Prod sigue en casa pero ya usa la BD cloud. Ventana de corte: minutos, en hora muerta (re-dump justo antes de cambiar el URI para no perder escrituras).
5. Rollback: revertir `MONGODB_URI` al local + restart.
6. Observar unos días (latencia, logs pm2).

## FASE 2 — Fotos → R2 (con prod aún en casa)

1. Crear bucket R2 + dominio público (ej. `media.lenzu.app`) + API token.
2. Modificar `backend/middleware/upload.js`: multer memoryStorage → subir a R2 (SDK S3-compatible). Campo aditivo o URL absoluta en BD.
3. Migrar los 18 MB existentes de `uploads/photographers/` a R2 y actualizar las URLs guardadas en los documentos (script de migración, con dry-run).
4. Mantener `app.use('/uploads', express.static(...))` como fallback temporal para URLs viejas no migradas.
5. Probar upload desde la app iOS real (recordar bug HEIC/CORS de abril — retestear ese flujo exacto).
6. Al terminar esta fase el backend es **stateless** → puede vivir en cualquier host.

## FASE 3 — Backend → Railway (staging primero)

1. Deploy desde el repo GitHub (root `backend/`), Node versión igual a la del server (verificar con `node -v` en el server).
2. Env vars: todas las del inventario + `MONGODB_URI` de Atlas + credencial Firebase como env var. `FRONTEND_URL=https://lenzu.app`.
3. Dominio `api-staging.lenzu.app` → servicio Railway (CNAME en Cloudflare, proxy OFF o modo compatible con websockets).
4. Verificar en staging: health, login (JWT viejo sigue válido = mismo secret), **Socket.io conecta** (mensajes en tiempo real entre 2 sesiones), push FCM real al iPhone, email SMTP GoDaddy (puerto saliente 465/587 abierto desde Railway), Telegram, tracking pixel, CORS con `capacitor://localhost`.
5. Crons/scripts (`send-reengagement.js`, etc.): se ejecutan manualmente con `railway run` o Railway cron — documentar el equivalente de cada uno.
6. pm2 ya no aplica (Railway reinicia solo); quitar cualquier suposición de pm2 en docs.

## FASE 4 — Frontend → Vercel (staging primero)

1. Proyecto Vercel desde el repo, root `frontend/`, build `npm run build`, output `dist/`.
2. Env de build: `VITE_API_URL=https://api.lenzu.app`, `VITE_SOCKET_URL=https://api.lenzu.app`, `VITE_FIREBASE_*` (mismos valores actuales).
3. `staging.lenzu.app` → deployment de Vercel.
4. **Rewrites en `vercel.json`:** `/api/*` y `/uploads/*` → `https://api.lenzu.app/...` — mantiene vivos los links ya enviados por email (invitaciones `/invite/:token`, pixel `/api/email-track/`, extend-plan) y cualquier cliente con la URL vieja same-origin. SPA fallback a `index.html` (hoy lo hace nginx).
5. Checklist E2E en staging con iPhone real + web: login/registro, dashboard, timeline CRUD + drag reorder, shot list, colaboradores + invitación por email completa, mensajes en tiempo real (sockets), subida de foto, push notification real, modo boda, **sync Apple Watch**, admin panel, export PDF, i18n, safe areas iOS (verificar que el remote-load desde Vercel no rompa nada del fix de bounce).

## FASE 5 — Cutover de producción (DNS)

1. Pre-check: sin bodas activas/próximas 48h (admin panel), hora muerta (madrugada entre semana), Alex disponible con su iPhone.
2. En Cloudflare: `lenzu.app` → Vercel; `api.lenzu.app` → Railway (crear en este momento o antes); R2 ya en `media.lenzu.app`.
3. `FRONTEND_URL` y CORS del backend ya deben incluir los orígenes definitivos.
4. Verificación inmediata post-cutover: app iOS real (login, timeline, foto, push), web desktop, curl a `/api/health`, logs Railway sin errores, un mensaje de proyecto → push recibido.
5. **Rollback:** revertir registros DNS al Cloudflare Tunnel (el server de casa sigue corriendo con Atlas — sin pérdida de datos porque la BD ya es compartida/cloud desde Fase 1).

## FASE 6 — Decomiso del servidor

1. 1–2 semanas de observación con el server prendido pero sin tráfico.
2. Backup final del server (mongodump de despedida aunque Atlas sea la fuente, `.env`, uploads, configs nginx/cloudflared) archivado en el T7.
3. Apagar server, borrar el tunnel de Cloudflare, actualizar CLAUDE.md y memoria: deploy nuevo = `git push` (Railway/Vercel auto-deploy), muere `deploy-production.sh` y el flujo scp/pm2. Documentar el flujo nuevo de deploy y de acceso a BD (mongosh → Atlas connection string).

## Cambios de código previstos (resumen)

- `middleware/upload.js` + script de migración de fotos (Fase 2) — único cambio funcional real.
- Carga de credencial Firebase desde env var (Fase 3).
- `vercel.json` con rewrites y SPA fallback (Fase 4).
- `.env`/build vars: `VITE_API_URL`/`VITE_SOCKET_URL` → `api.lenzu.app` (Fase 4).
- CORS en `server.js`: agregar orígenes de staging/Vercel si hiciera falta (verificar en Fase 3-4).
- **No se toca:** auth/invitaciones, esquema MongoDB, lógica Watch, FREE_FOR_ALL.
