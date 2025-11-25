# 🚀 COMENZAR FASE 2 - QUICK START

**Última actualización**: 25 Nov 2025  
**Estado**: ✅ Fase 1 completada, lista para Fase 2

---

## ⚡ INICIO RÁPIDO

### 1️⃣ Verificar Estado
```bash
cd /Volumes/T7/Web\ APP/Timeline
git status
git pull origin main
```

### 2️⃣ Leer Documentación Clave
**PRIMERO LEE ESTO** 👉 `PHASE2-PLAN.md`

Documentos de referencia:
- `PROJECT-STATUS.md` - Estado completo del proyecto
- `PHASE1-SUMMARY.md` - Lo que ya se implementó

### 3️⃣ Verificar Servidor
```bash
# Backend
cd backend
npm run dev

# Frontend (otra terminal)
cd frontend
npm run dev
```

---

## 🎯 OBJETIVOS FASE 2

### Principales Tareas
1. ✅ Crear componente `RoleSelector` (frontend)
2. ✅ Actualizar `/auth/register` endpoint (backend)
3. ✅ Implementar lógica de trial automático
4. ✅ Configurar servicio de email
5. ✅ Crear templates de email

### Orden Recomendado de Implementación

#### Paso 1: Frontend - RoleSelector Component
**Archivo**: `frontend/src/components/RoleSelector.tsx`

```tsx
// Crear un componente con 2 opciones:
// - Creator/Photographer (Camera icon)
// - Guest/Invited (Users icon)

interface RoleSelectorProps {
  selectedRole: 'creator' | 'guest';
  onRoleChange: (role: 'creator' | 'guest') => void;
}
```

#### Paso 2: Frontend - Actualizar Register.tsx
**Archivo**: `frontend/src/pages/Register.tsx`

```tsx
// Agregar:
import RoleSelector from '@/components/RoleSelector';

// State para role
const [selectedRole, setSelectedRole] = useState<'creator' | 'guest'>('creator');

// Pasar role al endpoint
await register(name, email, password, selectedRole);
```

#### Paso 3: Frontend - Agregar Traducciones
**Archivos**: `frontend/src/i18n/locales/en.json` y `es.json`

```json
{
  "auth": {
    "selectYourRole": "Select Your Role",
    "creatorRole": "Creator / Photographer",
    "creatorRoleDescription": "Create and manage event timelines",
    "guestRole": "Guest / Invited",
    "guestRoleDescription": "Access shared timelines",
    "trial7Days": "7-day free trial included"
  }
}
```

#### Paso 4: Backend - Actualizar /auth/register
**Archivo**: `backend/routes/auth.js`

```javascript
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Validar rol
  if (!['creator', 'guest'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  
  // Prevenir master user por registro
  if (email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
    return res.status(403).json({ message: 'This email is reserved' });
  }
  
  // Crear usuario
  const user = new User({ name, email, password, role });
  
  // Si es creator, asignar trial
  if (role === 'creator' || role === 'photographer') {
    user.trial_start_date = new Date();
    user.trial_end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.is_trial_active = true;
    user.current_plan = 'trial';
  }
  
  await user.save();
  
  // Enviar email de bienvenida (paso 5)
  await sendWelcomeEmail(user);
  
  res.status(201).json({ message: 'User created successfully' });
});
```

#### Paso 5: Backend - Servicio de Email
**Archivo**: `backend/services/email.js` (NUEVO)

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendWelcomeEmail = async (user) => {
  if (user.role === 'creator' || user.role === 'photographer') {
    // Email de creator con info de trial
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to LenzuApp - Your 7-Day Trial Starts Now!',
      html: `
        <h1>Welcome ${user.name}!</h1>
        <p>Your 7-day free trial has started.</p>
        <p>You can now create up to 3 timelines.</p>
      `
    });
  } else {
    // Email de guest
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Welcome to LenzuApp',
      html: `
        <h1>Welcome ${user.name}!</h1>
        <p>You can now access shared timelines.</p>
      `
    });
  }
};
```

#### Paso 6: Backend - Variables de Entorno
**Archivo**: `backend/.env`

```bash
# Agregar:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="LenzuApp <noreply@lenzu.app>"
```

#### Paso 7: Backend - Instalar Dependencias
```bash
cd backend
npm install nodemailer
```

---

## ✅ TESTING

### Tests a Realizar

1. **Registro como Creator**
```
- Visitar /register
- Seleccionar "Creator/Photographer"
- Completar formulario
- Verificar en DB:
  - role = 'creator'
  - trial_start_date existe
  - trial_end_date = start + 7 días
  - is_trial_active = true
  - current_plan = 'trial'
- Verificar email recibido
```

2. **Registro como Guest**
```
- Visitar /register
- Seleccionar "Guest/Invited"
- Completar formulario
- Verificar en DB:
  - role = 'guest'
  - trial_start_date = null
  - is_trial_active = false
  - current_plan = 'none'
- Verificar email recibido (diferente)
```

3. **Intentar Registro con Email Master**
```
- Usar alex.obregon@outlook.es
- Debe rechazar con error 403
```

---

## 🐛 DEBUGGING

### Script de Debug Usuarios
```bash
cd backend
npm run debug:timelines
```

### Verificar Emails en Producción
```bash
ssh alexobregon@192.168.100.150
cd /var/www/timeline/backend
pm2 logs timeline-api
```

### Verificar Frontend Local
```bash
cd frontend
npm run dev
# Visitar http://localhost:5173
```

---

## 📋 CHECKLIST PRE-DEPLOY

Antes de hacer deploy a producción:

- [ ] RoleSelector funciona correctamente
- [ ] Registro con creator asigna trial
- [ ] Registro con guest NO asigna trial
- [ ] Emails se envían correctamente
- [ ] Frontend build sin errores
- [ ] Backend tests pasados
- [ ] Traducciones en ES e EN
- [ ] Variables de entorno configuradas en servidor

---

## 🚀 DEPLOY FASE 2

```bash
# Build frontend
cd frontend
npm run build

# Deploy
cd ..
bash deployment/deploy-to-server.sh

# Configurar emails en servidor (solo primera vez)
ssh alexobregon@192.168.100.150
nano /var/www/timeline/backend/.env
# Agregar EMAIL_* variables
pm2 restart timeline-api
```

---

## 📞 REFERENCIAS RÁPIDAS

### Master User
- Email: alex.obregon@outlook.es
- Debe ser bypassed en TODOS los checks

### URLs
- Producción: https://lenzu.app
- Local Backend: http://localhost:5050
- Local Frontend: http://localhost:5173

### Archivos Clave
```
backend/
├── routes/auth.js (actualizar)
├── services/email.js (crear)
├── config/constants.js (ya existe)
└── models/User.js (ya actualizado)

frontend/
├── src/components/RoleSelector.tsx (crear)
├── src/pages/Register.tsx (actualizar)
├── src/types/index.ts (ya actualizado)
└── src/i18n/locales/*.json (actualizar)
```

---

## ⚠️ RECORDATORIOS IMPORTANTES

1. ✅ **NUNCA** permitir que usuarios se auto-asignen role 'master'
2. ✅ **SIEMPRE** validar el role en backend (no confiar en frontend)
3. ✅ **PREVENIR** registro con MASTER_EMAIL
4. ✅ **TESTAR** exhaustivamente antes de deploy
5. ✅ **DOCUMENTAR** cambios realizados

---

## 🎯 META DE FASE 2

Al terminar esta fase, deberías tener:

```
✅ Registro funcional con selección de rol
✅ Trial de 7 días automático para creators
✅ Emails de bienvenida personalizados
✅ Diferenciación clara entre Creator y Guest
✅ Base sólida para Fase 3 (password recovery)
```

---

**¡Estás listo para comenzar! Lee PHASE2-PLAN.md y comienza por el RoleSelector component.**

🚀 **¡Éxito con la Fase 2!**
