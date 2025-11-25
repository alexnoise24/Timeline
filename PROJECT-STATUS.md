# 📊 TIMELINE APP - ESTADO DEL PROYECTO

**Última actualización**: 25 Noviembre 2025
**Versión**: 1.1.0
**Estado**: ✅ Producción - Fase 1 Completada

---

## 🎯 OBJETIVO GENERAL

Implementar un sistema completo de:
1. ✅ **Roles de usuario** (master, creator, photographer, guest)
2. ✅ **Trial de 7 días** para creators
3. 🔄 **Sistema de registro** con selección de rol
4. 🔄 **Emails automatizados** (bienvenida, trial, recovery)
5. 🔜 **Planes de suscripción** (free, starter, pro, studio)
6. 🔜 **Integración con Stripe** (pagos)

---

## ✅ FASE 1: COMPLETADA (25 Nov 2025)

### Implementado

#### Backend
- ✅ `User` model actualizado con campos de roles, trial y planes
- ✅ `constants.js` con configuración de Master User y helpers
- ✅ `checkAccess.js` middlewares de protección
- ✅ Scripts de migración:
  - `migrate-users.js` - Migración de usuarios existentes
  - `fix-master-user.js` - Configuración de Master User
  - `debug-timelines.js` - Debug de dashboard
  - `test-auth-me.js` - Test de autenticación
- ✅ Middleware `requirePhotographer` actualizado para aceptar master/creator

#### Frontend
- ✅ User interface types actualizados (master, creator, photographer, guest)
- ✅ `Navbar.tsx` reconoce todos los roles
- ✅ `Dashboard.tsx` muestra opciones según rol
- ✅ Build y deploy exitoso

#### Infraestructura
- ✅ Base de datos migrada sin pérdida de datos
- ✅ 4 timelines preservados
- ✅ Master User configurado:
  - Email: alex.obregon@outlook.es
  - Rol: master
  - Plan: master (ilimitado)
  - Acceso: sin restricciones
- ✅ Código en GitHub (7 commits)
- ✅ Desplegado en producción (https://lenzu.app)

### Commits de Fase 1
```
1. Phase 1: Implement roles, trial system and master user
2. Add fix-master script and update master user configuration  
3. Fix: Update requirePhotographer middleware to accept master, creator and photographer roles
4. Add debug script to investigate empty dashboard
5. Fix: Update frontend to recognize master and creator roles
6. Add test script for auth/me endpoint debugging
7. (Push to GitHub)
```

---

## 🔄 FASE 2: PENDIENTE

**Archivo de referencia**: `PHASE2-PLAN.md`

### Objetivos Principales
1. Sistema de registro con selección de rol
2. Emails de bienvenida (creator vs guest)
3. Lógica automática de trial de 7 días
4. UI de estado de trial (opcional)

### Archivos a Crear
- `backend/services/email.js`
- `backend/templates/emails/welcome-creator.ejs`
- `backend/templates/emails/welcome-guest.ejs`
- `frontend/src/components/RoleSelector.tsx`
- `frontend/src/components/TrialBanner.tsx`

### Archivos a Modificar
- `backend/routes/auth.js`
- `backend/middleware/checkAccess.js`
- `frontend/src/pages/Register.tsx`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/es.json`

---

## 🔜 FASES FUTURAS

### Fase 3: Password Recovery
- Endpoint de "forgot password"
- Email con link de recuperación
- Página de reset password
- Token temporal de recuperación

### Fase 4: Trial Management
- Banner de días restantes
- Modal de trial expirado
- Notificaciones de trial (7 días, 3 días, 1 día, expirado)
- Lógica de restricción post-trial

### Fase 5: Planes y Suscripciones
- Definir límites por plan
- UI de selección de plan
- Página de pricing
- Comparación de planes

### Fase 6: Integración Stripe
- Checkout de suscripción
- Webhooks de Stripe
- Gestión de suscripciones activas
- Cancelación y renovación

---

## 📋 CONFIGURACIÓN ACTUAL

### Master User
```json
{
  "email": "alex.obregon@outlook.es",
  "role": "master",
  "current_plan": "master",
  "is_trial_active": true,
  "trial_end_date": null,
  "plan_expiration_date": null,
  "is_payment_required": false,
  "restrictions": "NONE - Full unlimited access"
}
```

### Roles Disponibles
| Rol | Puede Crear Timelines | Trial | Uso |
|-----|----------------------|-------|-----|
| `master` | ✅ Sí (ilimitado) | ✅ Siempre activo | Alex (dueño) |
| `creator` | ✅ Sí (con trial/plan) | ✅ 7 días gratis | Fotógrafos nuevos |
| `photographer` | ✅ Sí (con trial/plan) | ✅ Legacy support | Usuarios antiguos |
| `guest` | ❌ No | ❌ No aplica | Invitados |

### Planes Disponibles
| Plan | Status | Timelines | Colaboradores | Eventos | Storage |
|------|--------|-----------|---------------|---------|---------|
| `none` | Default | 0 | 0 | 0 | 0 |
| `trial` | 7 días | 3 | 5 | Ilimitado | 1 GB |
| `free` | Gratis | 1 | 2 | Ilimitado | 500 MB |
| `starter` | $9.99/mes | 5 | 10 | Ilimitado | 5 GB |
| `pro` | $19.99/mes | 20 | 50 | Ilimitado | 20 GB |
| `studio` | $49.99/mes | Ilimitado | Ilimitado | Ilimitado | 100 GB |
| `master` | Admin | Ilimitado | Ilimitado | Ilimitado | Ilimitado |

---

## 🛠️ STACK TECNOLÓGICO

### Backend
- Node.js + Express
- MongoDB (Local - mongodb://localhost:27017/wedding-timeline)
- Mongoose
- JWT Authentication
- Socket.io
- PM2 (Process Manager)

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- Zustand (State Management)
- React Router
- i18next (Internacionalización)

### Deployment
- Servidor: Ubuntu 192.168.100.150
- Cloudflare Tunnel: timeline-tunnel (lenzu.app)
- Backend Port: 5050
- Ruta Backend: `/var/www/timeline/backend`
- Ruta Frontend: `/var/www/timeline/frontend/dist`

---

## 📝 SCRIPTS DISPONIBLES

### Backend
```bash
npm run dev              # Desarrollo con nodemon
npm run start            # Producción
npm run migrate:users    # Migrar usuarios existentes
npm run fix:master       # Configurar Master User
npm run debug:timelines  # Debug de timelines en dashboard
```

### Frontend
```bash
npm run dev              # Desarrollo (puerto 5173)
npm run build            # Build para producción
npm run preview          # Preview del build
```

### Deployment
```bash
bash deployment/deploy-to-server.sh    # Deploy completo
```

---

## 🔐 VARIABLES DE ENTORNO

### Backend (.env)
```
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
JWT_SECRET=your-secret-key
PORT=5050
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=https://lenzu.app
```

---

## 🎨 FEATURES IMPLEMENTADAS (General)

### Core
- ✅ Autenticación (Login/Register/Logout)
- ✅ Sistema de roles y permisos
- ✅ Creación de timelines
- ✅ Sistema de eventos
- ✅ Shot list con completado
- ✅ Colaboradores e invitaciones
- ✅ Chat en tiempo real (Socket.io)
- ✅ Notificaciones push
- ✅ Google Maps integration
- ✅ Change logs (historial de cambios)
- ✅ Multi-idioma (ES/EN)

### UI/UX
- ✅ Diseño minimalista (inspirado en alex-obregon.com)
- ✅ Tipografía: Recoleta (headings) + Sofia Pro (body)
- ✅ Paleta de colores: #F2F1F0, #3B3B3B, #AFAFAF, #CDD973
- ✅ Responsive design
- ✅ Dark mode en tabs
- ✅ Horarios grandes en timeline

---

## 📚 DOCUMENTACIÓN DISPONIBLE

- `README.md` - Documentación general del proyecto
- `PHASE1-SUMMARY.md` - Resumen de Fase 1
- `PHASE1-CHECKLIST.md` - Checklist de ejecución Fase 1
- `PHASE2-PLAN.md` - Plan detallado para Fase 2 ⭐
- `MIGRATION-PHASE1.md` - Documentación técnica de migración
- `PRODUCTION-FIX-MASTER.md` - Instrucciones para fix en producción
- `PROJECT-STATUS.md` - Este archivo

---

## 🚀 PRÓXIMOS PASOS

1. **Inmediato**: Comenzar Fase 2
   - Leer `PHASE2-PLAN.md`
   - Implementar RoleSelector component
   - Actualizar endpoint de registro
   - Configurar servicio de email

2. **Corto Plazo**: Completar Fase 2 y 3
   - Sistema de registro funcional
   - Emails automatizados
   - Password recovery

3. **Mediano Plazo**: Fase 4 y 5
   - UI de trial management
   - Sistema de planes
   - Página de pricing

4. **Largo Plazo**: Fase 6
   - Integración con Stripe
   - Procesamiento de pagos
   - Gestión de suscripciones

---

## 📞 INFORMACIÓN DE CONTACTO

**Desarrollador**: Alex Obregon
**Email**: alex.obregon@outlook.es
**App URL**: https://lenzu.app
**GitHub**: https://github.com/alexnoise24/Timeline

---

## ✅ CHECKLIST PARA PRÓXIMA SESIÓN

Cuando abras Windsurf nuevamente:

1. [ ] Lee `PHASE2-PLAN.md` completo
2. [ ] Verifica que el servidor esté corriendo
3. [ ] Haz pull de los últimos cambios: `git pull origin main`
4. [ ] Comienza por el componente `RoleSelector`
5. [ ] Luego actualiza el endpoint `/auth/register`
6. [ ] Configura el servicio de email
7. [ ] Prueba el flujo completo de registro

**Comando para empezar**:
```bash
cd /Volumes/T7/Web\ APP/Timeline
git status
npm run dev  # En backend y frontend
```

---

**🎉 ¡Fase 1 completada exitosamente! Lista para continuar con Fase 2.**
