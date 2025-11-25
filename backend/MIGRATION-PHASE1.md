# 📋 FASE 1 - Migración de Sistema de Roles y Trial

## ✅ Cambios Implementados

### 1. Modelo User Actualizado
Se agregaron los siguientes campos **SIN modificar datos existentes**:

```javascript
role: 'master' | 'creator' | 'photographer' | 'guest'
trial_start_date: Date | null
trial_end_date: Date | null
is_trial_active: Boolean
current_plan: 'none' | 'trial' | 'free' | 'starter' | 'pro' | 'studio' | 'master'
is_payment_required: Boolean
plan_start_date: Date | null
plan_expiration_date: Date | null
```

### 2. Constantes y Helpers
**Archivo**: `backend/config/constants.js`
- `MASTER_EMAIL`: Email del usuario maestro
- `isMasterUser(email)`: Verifica si es el usuario maestro
- `isMaster(user)`: Verifica si el usuario es maestro
- `canCreateTimelines(user)`: Verifica si puede crear timelines
- `hasValidAccess(user)`: Verifica si tiene acceso válido (trial o plan)

### 3. Middlewares de Protección
**Archivo**: `backend/middleware/checkAccess.js`

#### `requirePremiumAccess`
Verifica que el usuario tenga acceso premium (trial activo o plan válido).
Master user siempre pasa.

```javascript
router.get('/premium-feature', authenticate, requirePremiumAccess, async (req, res) => {
  // req.user contiene los datos del usuario
  // req.isMaster indica si es master
});
```

#### `requireCanCreateTimelines`
Verifica que el usuario pueda crear timelines.
Master user y creators con trial/plan activo pueden crear.

```javascript
router.post('/timelines', authenticate, requireCanCreateTimelines, async (req, res) => {
  // Usuario puede crear timelines
});
```

#### `requireRole(roles)`
Verifica que el usuario tenga uno de los roles permitidos.
Master user siempre pasa.

```javascript
router.post('/admin-action', authenticate, requireRole(['creator', 'master']), async (req, res) => {
  // Solo creators y master pueden acceder
});
```

#### `attachUserInfo`
Adjunta información del usuario al request sin bloquear.

```javascript
router.get('/info', authenticate, attachUserInfo, async (req, res) => {
  // req.user y req.isMaster están disponibles
});
```

### 4. Script de Migración
**Archivo**: `backend/scripts/migrate-users.js`

Migra usuarios existentes agregando los nuevos campos:
- **Master user** (alex.obregon@outlook.es):
  - role: 'master'
  - current_plan: 'master'
  - Sin restricciones ni expiraciones
  
- **Creators/Photographers existentes**:
  - role: 'creator'
  - Trial de 7 días activado desde hoy
  - current_plan: 'trial'
  
- **Guests**:
  - role: 'guest'
  - Sin trial ni plan (no lo necesitan)

## 🚀 Cómo Ejecutar la Migración

### Paso 1: Verificar que todo esté commiteado
```bash
git status
git add .
git commit -m "Phase 1: Add roles and trial system"
```

### Paso 2: Ejecutar migración en LOCAL primero
```bash
cd backend
npm run migrate:users
```

### Paso 3: Verificar resultados
El script mostrará:
- ✅ Número de usuarios migrados
- 👑 Usuario master detectado
- 📊 Resumen de timelines del master
- 🎨 Creators con trial activado
- 👥 Guests migrados

### Paso 4: Desplegar al servidor
```bash
cd ..
bash deployment/deploy-to-server.sh
```

### Paso 5: Ejecutar migración en PRODUCCIÓN
```bash
ssh alexobregon@192.168.100.150
cd /var/www/timeline/backend
npm run migrate:users
```

## 🔐 Seguridad de la Migración

### ✅ Lo que el script HACE:
- Agrega campos nuevos a usuarios existentes
- Preserva TODOS los datos existentes (timelines, eventos, etc.)
- Detecta si un usuario ya fue migrado (no duplica)
- Muestra resumen detallado de cambios

### ❌ Lo que el script NO hace:
- NO borra datos
- NO modifica timelines
- NO cambia contraseñas
- NO altera relaciones (owner, collaborators)

## 📊 Verificación Post-Migración

### Verificar tu cuenta master:
```javascript
// En MongoDB o mediante endpoint
db.users.findOne({ email: 'alex.obregon@outlook.es' })

// Debe mostrar:
{
  role: 'master',
  current_plan: 'master',
  is_trial_active: true,
  trial_end_date: null,
  is_payment_required: false
}
```

### Verificar timelines intactos:
```javascript
// Contar timelines del master
db.timelines.countDocuments({ owner: ObjectId('tu_id') })
// Debe ser el mismo número que antes
```

## 🎯 Próximos Pasos (Fase 2)

Una vez verificada la migración:
1. ✅ Proteger rutas de creación de timelines
2. ✅ Implementar lógica de expiración de trial
3. ✅ Actualizar UI para mostrar estado de trial
4. ✅ Agregar pantalla de "Trial Expirado"

## 🆘 Rollback (Si algo sale mal)

Si necesitas revertir:
```bash
# Restaurar backup
mongorestore --db wedding-timeline /backup/pre-migration

# O actualizar manualmente
db.users.updateMany(
  {},
  { 
    $unset: {
      trial_start_date: "",
      trial_end_date: "",
      is_trial_active: "",
      current_plan: "",
      is_payment_required: "",
      plan_start_date: "",
      plan_expiration_date: ""
    }
  }
)
```

## 📞 Soporte

Si hay algún problema durante la migración, detener y contactar antes de continuar.
