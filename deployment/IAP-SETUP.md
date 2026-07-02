# In-App Purchase (Plan Pro) — Guía de configuración

El código ya está listo (frontend + backend + plugin nativo). Estos son los pasos
manuales para activarlo, en orden.

## Arquitectura

- **Compra:** la app iOS usa RevenueCat (`@revenuecat/purchases-capacitor`) → StoreKit.
- **Identidad:** al hacer login, la app configura RevenueCat con `appUserID = user._id` de Mongo.
- **Activación del plan:** dos caminos redundantes:
  1. `POST /api/iap/verify` — la app lo llama justo después de comprar/restaurar; el backend consulta la REST API de RevenueCat y activa `current_plan: 'pro'` al instante.
  2. `POST /api/iap/webhook` — RevenueCat lo llama en compras, renovaciones y expiraciones (fuente de verdad a largo plazo).
- **`plan_source: 'apple'`** en el modelo User: los eventos de Apple solo bajan de plan a usuarios cuyo plan vino de Apple. Nunca toca planes manuales (beta testers), Stripe, master o lifetime.
- **Web:** Stripe sigue exactamente igual. `/pricing` sigue bloqueado en nativo; `/my-plan` en nativo muestra el paywall IAP.

## 1. App Store Connect

1. **Acuerdo de apps de pago:** Business → aceptar el Paid Applications Agreement y completar datos bancarios/fiscales (sin esto las compras no funcionan ni en sandbox de review).
2. **Crear la suscripción:** App → Features (Funciones) → In-App Purchases → Suscripciones:
   - Grupo de suscripción: `Lenzu Pro` (nuevo)
   - Product ID: `lenzu_pro_monthly`
   - Duración: 1 mes
   - Precio: **$4.99 USD** (tier equivalente en otros países)
   - Localización ES: "Plan Pro" — "Modo boda, sincronización con Apple Watch e inspiración"
   - Localización EN: "Pro Plan" — "Wedding mode, Apple Watch sync and inspiration"
   - Screenshot de review de la suscripción (puede ser una captura del paywall en /my-plan)
3. Al enviar el próximo binario, **adjuntar la suscripción a la versión** (sección In-App Purchases de la versión).

## 2. RevenueCat (app.revenuecat.com — cuenta gratis)

1. Crear proyecto "Lenzu" → agregar app iOS con el bundle ID de la app.
2. Subir la **App Store Connect API Key** (RevenueCat te guía) para que valide recibos.
3. **Entitlement:** crear uno con identifier `pro` (el código lo espera exactamente así).
4. **Product:** importar `lenzu_pro_monthly` y adjuntarlo al entitlement `pro`.
5. **Offering:** en el offering `default`, agregar un package **Monthly** con ese producto.
6. **Webhook:** Project settings → Integrations → Webhooks:
   - URL: `https://lenzu.app/api/iap/webhook`
   - Authorization header: un secreto largo aleatorio (ej. `openssl rand -hex 32`) — el mismo valor va en el `.env` del backend.
7. Copiar dos llaves:
   - **Public API key (Apple)** → frontend
   - **Secret API key** → backend

## 3. Variables de entorno

**Backend (`/var/www/timeline/backend/.env` en el servidor):**
```
REVENUECAT_WEBHOOK_SECRET=<el secreto del webhook>
REVENUECAT_SECRET_KEY=<secret api key de RevenueCat>
```
Después: `pm2 restart timeline-api`

**Frontend (`.env` local, se hornea en el build):**
```
VITE_REVENUECAT_IOS_KEY=<public api key apple de RevenueCat>
```
Después: `npm run build` + deploy de `dist/` a lenzu.app.

## 4. Xcode (binario nuevo — mismo build del ícono del Watch)

1. `npx cap sync ios` (ya ejecutado — el paquete SPM `RevenuecatPurchasesCapacitor` ya está en Package.swift).
2. En el target **App**: Signing & Capabilities → **+ Capability → In-App Purchase**.
3. Subir build number → Archive → verificar en el Organizer que el ícono del Watch se ve crema → subir.

## 5. Prueba en sandbox

1. Crear un **Sandbox Tester** en App Store Connect (Users and Access → Sandbox).
2. En un iPhone físico: Ajustes → App Store → Sandbox Account → iniciar sesión con el tester.
3. En la app (TestFlight): login → menú usuario → Mi Plan → Suscribirse. El precio debe salir localizado y el sheet de compra de Apple debe aparecer.
4. Verificar que tras comprar, el plan cambia a PRO (revisar también en el admin panel).
5. Probar "Restaurar compras" tras reinstalar la app.

## 6. Notas para App Review (actualizar en App Store Connect)

- El plan Pro se puede comprar dentro de la app vía In-App Purchase ($4.99/mes) en Mi Plan.
- NO mencionar que también se vende en la web (ya no es necesario explicarlo; 3.1.3(b) lo permite mientras exista el IAP).
- La cuenta demo `appreview@lenzu.app` ya tiene Pro para que puedan ver las funciones sin comprar.

## Solución de problemas

- Paywall dice "compras no disponibles": falta `VITE_REVENUECAT_IOS_KEY` en el build desplegado, o el offering `default` no tiene package Monthly, o el Paid Apps Agreement no está aceptado.
- Compra exitosa pero el plan no cambia: revisar `pm2 logs timeline-api` (errores `[iap]`), y que `REVENUECAT_SECRET_KEY`/webhook estén configurados. El webhook de RevenueCat tiene reintentos automáticos.
- El webhook responde 401: el Authorization header del dashboard de RevenueCat no coincide con `REVENUECAT_WEBHOOK_SECRET`.
