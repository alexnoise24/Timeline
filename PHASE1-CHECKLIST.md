# ✅ FASE 1 - Checklist de Ejecución

## 📋 Pre-Migración (5 min)

- [ ] ✅ Código revisado y entendido
- [ ] ✅ Archivos creados verificados
- [ ] ✅ Email master correcto: alex.obregon@outlook.es
- [ ] 📸 Screenshot de timelines actuales (para comparar después)
- [ ] 📊 Contar timelines existentes: `db.timelines.countDocuments({ owner: ObjectId('tu_id') })`

## 🔧 Ejecución Local (10 min)

```bash
# 1. Commit de cambios
cd /Volumes/T7/Web\ APP/Timeline
git add .
git commit -m "Phase 1: Add roles and trial system"

# 2. Ejecutar migración en LOCAL
cd backend
npm run migrate:users

# 3. Verificar resultado
# Debe mostrar:
# - ✅ Master user detected
# - ✅ X timelines preserved
# - ✅ Migration completed
```

**VERIFICAR SALIDA:**
- [ ] ✅ Master user migrado correctamente
- [ ] ✅ Mismo número de timelines que antes
- [ ] ✅ No hay errores en consola

## 🔍 Verificación Local (5 min)

```bash
# Conectar a MongoDB local
mongosh wedding-timeline

# Verificar tu cuenta
db.users.findOne({ email: 'alex.obregon@outlook.es' }, { 
  email: 1, 
  role: 1, 
  current_plan: 1,
  is_trial_active: 1,
  is_payment_required: 1
})

# DEBE MOSTRAR:
# role: 'master'
# current_plan: 'master'
# is_trial_active: true
# is_payment_required: false
```

**CHECKLIST:**
- [ ] ✅ role = 'master'
- [ ] ✅ current_plan = 'master'
- [ ] ✅ is_trial_active = true
- [ ] ✅ is_payment_required = false
- [ ] ✅ trial_end_date = null

## 🚀 Deploy a Producción (5 min)

```bash
# Solo si verificación local fue exitosa
cd /Volumes/T7/Web\ APP/Timeline
bash deployment/deploy-to-server.sh
```

**ESPERAR:**
- [ ] ✅ Archivos transferidos
- [ ] ✅ PM2 reiniciado
- [ ] ✅ Servidor timeline-api online

## 🌐 Migración en Producción (10 min)

```bash
# Conectar al servidor
ssh alexobregon@192.168.100.150

# Ir a la carpeta del proyecto
cd /var/www/timeline/backend

# Ejecutar migración
npm run migrate:users

# Debe mostrar lo mismo que en local
```

**VERIFICAR SALIDA:**
- [ ] ✅ Master user detected
- [ ] ✅ Timelines preserved
- [ ] ✅ Migration completed successfully

## 🔍 Verificación Producción (5 min)

```bash
# En el servidor
mongosh

# Usar base de datos
use wedding-timeline

# Verificar master user
db.users.findOne({ email: 'alex.obregon@outlook.es' }, {
  email: 1,
  role: 1, 
  current_plan: 1,
  is_trial_active: 1
})

# Contar timelines (debe ser igual que antes)
db.timelines.countDocuments({ owner: ObjectId('tu_id_aqui') })
```

**CHECKLIST:**
- [ ] ✅ Master user con role='master'
- [ ] ✅ Mismo número de timelines
- [ ] ✅ App funciona normalmente en lenzu.app

## 🎯 Prueba Final (5 min)

**En lenzu.app:**
- [ ] ✅ Login funciona
- [ ] ✅ Puedes ver tus timelines
- [ ] ✅ Puedes abrir un timeline
- [ ] ✅ Puedes crear un nuevo timeline
- [ ] ✅ Puedes editar eventos
- [ ] ✅ Shot lists funcionan

## ✨ Post-Migración

Si TODO está ✅:
```bash
# Commit final
git add .
git commit -m "Phase 1: Migration executed successfully"
git push
```

**DOCUMENTAR:**
- [ ] 📝 Número de usuarios migrados
- [ ] 📝 Número de timelines verificados
- [ ] 📝 Fecha y hora de migración
- [ ] 📝 Todo funcionando correctamente

## 🆘 Si Algo Sale Mal

### ❌ Si la migración local falla:
1. **NO desplegar a producción**
2. Revisar logs del error
3. Verificar conexión a MongoDB
4. Revisar que el modelo User esté actualizado

### ❌ Si la migración en producción falla:
1. Revisar logs en el servidor
2. Verificar que los archivos se desplegaron correctamente
3. PM2 logs: `pm2 logs timeline-api`
4. Si es necesario, rollback del código anterior

### 📞 Contacto de Emergencia:
- Detener todo
- No hacer más cambios
- Guardar logs del error
- Revisar documentación en MIGRATION-PHASE1.md

## ⏱️ Tiempo Total Estimado: 40 minutos

- Pre-Migración: 5 min
- Ejecución Local: 10 min
- Verificación Local: 5 min
- Deploy: 5 min
- Migración Producción: 10 min
- Verificación Producción: 5 min

---

## 🎉 ¡Listo para empezar!

Cuando estés listo, sigue esta checklist paso a paso.
NO saltes pasos, verifica cada uno antes de continuar.

**¿Todo claro? ¡Vamos! 🚀**
