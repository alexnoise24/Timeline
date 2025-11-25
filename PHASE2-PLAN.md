# 🎯 FASE 2: SISTEMA DE REGISTRO Y ROLES

## 📋 Estado Actual (Fase 1 Completada)

### ✅ Implementado
- ✅ Modelo User con campos de roles, trial y planes
- ✅ Constantes y helpers (constants.js)
- ✅ Middlewares de protección (checkAccess.js)
- ✅ Scripts de migración (migrate-users.js, fix-master-user.js)
- ✅ Master User configurado (alex.obregon@outlook.es)
- ✅ Frontend actualizado para reconocer todos los roles
- ✅ 4 timelines preservados y visibles

### 🎯 Master User Status
```json
{
  "email": "alex.obregon@outlook.es",
  "role": "master",
  "current_plan": "master",
  "is_trial_active": true,
  "trial_end_date": null,
  "plan_expiration_date": null,
  "is_payment_required": false,
  "timelines": 4
}
```

---

## 🚀 FASE 2: OBJETIVOS

### 1️⃣ Sistema de Registro Mejorado

#### Backend
- [ ] Actualizar `/auth/register` para aceptar selección de rol
- [ ] Validar que solo se puedan seleccionar roles `creator` o `guest`
- [ ] Inicializar trial de 7 días automáticamente para `creator`
- [ ] No dar trial a usuarios `guest`
- [ ] Prevenir registro con email del Master User

#### Frontend
- [ ] Crear componente `RoleSelector` con 2 opciones:
  - **Creator/Photographer** (puede crear timelines)
  - **Guest/Invited** (solo acceso a timelines compartidos)
- [ ] Actualizar formulario de registro en `Register.tsx`
- [ ] Agregar descripciones claras de cada rol
- [ ] Agregar iconos visuales (Camera vs Users)

#### Traducciones
- [ ] Agregar keys en `en.json` y `es.json`:
  - `selectYourRole`
  - `creatorRole`
  - `creatorRoleDescription`
  - `guestRole`
  - `guestRoleDescription`
  - `trial7Days`

---

### 2️⃣ Email de Bienvenida

#### Backend
- [ ] Instalar nodemailer
- [ ] Configurar servicio de email (Gmail, SendGrid, etc.)
- [ ] Crear `services/email.js`
- [ ] Crear templates de email en `templates/emails/`

#### Templates a Crear
1. **Welcome Email - Creator**
   - Saludo personalizado
   - Explicación del trial de 7 días
   - Call-to-action: Crear primer timeline
   - Información de contacto/soporte

2. **Welcome Email - Guest**
   - Saludo personalizado
   - Explicación de cómo funciona el acceso como invitado
   - Instrucciones para aceptar invitaciones
   - Información de contacto/soporte

#### Implementación
```javascript
// services/email.js
export const sendWelcomeEmail = async (user) => {
  if (user.role === 'creator' || user.role === 'photographer') {
    // Send creator welcome email with trial info
  } else if (user.role === 'guest') {
    // Send guest welcome email
  }
};
```

#### Environment Variables Necesarias
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=LenzuApp <noreply@lenzu.app>
```

---

### 3️⃣ Lógica de Trial Automática

#### En el Registro
```javascript
// Al registrar un creator
if (role === 'creator' || role === 'photographer') {
  user.role = role;
  user.trial_start_date = new Date();
  user.trial_end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  user.is_trial_active = true;
  user.current_plan = 'trial';
}
```

#### Validación de Trial
- [ ] Crear middleware `checkTrialStatus` que se ejecute en cada request
- [ ] Si trial expiró: `is_trial_active = false`, `is_payment_required = true`
- [ ] Master User siempre bypassed

---

### 4️⃣ UI de Estado de Trial (Opcional para Fase 2)

#### Componentes a Crear
- [ ] `TrialBanner` - Banner en el dashboard mostrando días restantes
- [ ] `TrialExpiredModal` - Modal cuando el trial expira

#### Ejemplo de Banner
```
┌─────────────────────────────────────────────┐
│ 🎉 Trial Activo - 5 días restantes          │
│ Disfrutando de todas las funciones premium  │
└─────────────────────────────────────────────┘
```

---

## 📦 Dependencias Nuevas

### Backend
```bash
npm install nodemailer
npm install ejs  # Para templates de email
```

### Frontend
No se requieren nuevas dependencias

---

## 🔄 Flujo de Usuario Completo (Fase 2)

### Nuevo Usuario - Creator
```
1. Visita /register
2. Ingresa nombre, email, password
3. Selecciona rol: "Creator/Photographer"
4. Click en "Create Account"
5. Backend:
   - Crea usuario con role='creator'
   - Asigna trial de 7 días
   - Envía email de bienvenida
6. Redirige a /dashboard
7. Ve banner: "Trial activo - 7 días restantes"
8. Puede crear timelines inmediatamente
```

### Nuevo Usuario - Guest
```
1. Visita /register
2. Ingresa nombre, email, password
3. Selecciona rol: "Guest/Invited"
4. Click en "Create Account"
5. Backend:
   - Crea usuario con role='guest'
   - NO asigna trial
   - Envía email de bienvenida (diferente)
6. Redirige a /dashboard
7. Ve mensaje: "Esperando invitaciones"
8. NO puede crear timelines
```

---

## 🧪 Testing de Fase 2

### Test Cases
1. [ ] Registrar usuario como Creator
   - Verificar role='creator'
   - Verificar trial_start_date existe
   - Verificar trial_end_date = start + 7 días
   - Verificar is_trial_active = true
   - Verificar email enviado

2. [ ] Registrar usuario como Guest
   - Verificar role='guest'
   - Verificar trial_start_date = null
   - Verificar is_trial_active = false
   - Verificar email enviado (diferente)

3. [ ] Intentar registrar con email de Master
   - Debe rechazar con error

4. [ ] Creator puede crear timelines
5. [ ] Guest NO puede crear timelines

---

## 📁 Archivos a Crear/Modificar

### Crear Nuevos
```
backend/services/email.js
backend/templates/emails/welcome-creator.ejs
backend/templates/emails/welcome-guest.ejs
frontend/src/components/RoleSelector.tsx
frontend/src/components/TrialBanner.tsx (opcional)
```

### Modificar Existentes
```
backend/routes/auth.js (actualizar /register)
backend/middleware/checkAccess.js (agregar checkTrialStatus)
frontend/src/pages/Register.tsx
frontend/src/i18n/locales/en.json
frontend/src/i18n/locales/es.json
```

---

## ⚠️ Consideraciones Importantes

### Seguridad
- ✅ Validar que role solo sea 'creator' o 'guest' en registro
- ✅ Prevenir que usuarios se auto-asignen role 'master'
- ✅ Sanitizar inputs del formulario
- ✅ Rate limiting en endpoint de registro

### Performance
- ✅ Enviar emails de forma asíncrona (no bloquear request)
- ✅ Usar queues si se espera alto volumen de registros

### UX
- ✅ Mensajes claros sobre qué hace cada rol
- ✅ Confirmación visual después del registro
- ✅ Redirección automática a dashboard

---

## 🎯 Resultado Final Fase 2

Al completar la Fase 2, tendrás:

```
✅ Registro de usuarios funcional con selección de rol
✅ Emails de bienvenida personalizados
✅ Trial de 7 días automático para creators
✅ Diferenciación clara entre Creator y Guest
✅ Base sólida para sistema de suscripciones (Fase 3+)
```

---

## 📝 Notas del Desarrollador

- Master User siempre debe ser bypassed en todos los checks
- Trial logic debe ser flexible para futuras expansiones
- Email templates deben ser responsive (mobile-friendly)
- Considerar internacionalización de emails (español/inglés)

---

**Estado**: ✅ Fase 1 Completada | 🔄 Listo para Fase 2
**Última actualización**: 25 Nov 2025
**Desarrollador**: Alex Obregon
