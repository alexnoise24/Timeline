# 🚀 Configurar Master User en Producción

## Paso 1: Conectar al servidor

```bash
ssh alexobregon@192.168.100.150
```

## Paso 2: Ir a la carpeta del backend

```bash
cd /var/www/timeline/backend
```

## Paso 3: Ejecutar el script de configuración

```bash
npm run fix:master
```

## ✅ Output Esperado:

Deberías ver algo así:

```
╔══════════════════════════════════════╗
║   FIX MASTER USER - PHASE 1          ║
║   Update Master Configuration        ║
╚══════════════════════════════════════╝

🔧 Fixing Master User Configuration...
📊 Connecting to database...
✅ Connected to database

👑 Found master user: alex.obregon@outlook.es
📋 Current values:
   - role: photographer
   - current_plan: none
   - is_trial_active: false
   - is_payment_required: false
   - Owns 2 timelines

🔄 Updating to master configuration...
✅ Master user updated successfully!

📋 New values:
   - role: master ✓
   - current_plan: master ✓
   - is_trial_active: true ✓
   - is_payment_required: false ✓
   - trial_end_date: null (null = never expires) ✓
   - plan_expiration_date: null (null = never expires) ✓

📊 Verification:
   - Timelines before: 2
   - Timelines after: 2
   - Data preserved: ✅ YES

🎉 Master user configuration fixed successfully!
👑 You now have unlimited access to all features

🔌 Database connection closed

✅ Fix completed successfully
```

## Paso 4: Verificar que funciona

1. Ve a https://lenzu.app
2. Haz login con alex.obregon@outlook.es
3. Verifica:
   - ✅ Puedes ver tus timelines
   - ✅ Puedes crear nuevos timelines
   - ✅ Todo funciona sin restricciones

## 🆘 Si algo falla

Si el script falla, copia el error completo y avísame.

---

## 📋 Comandos Resumidos

```bash
# Todo en uno
ssh alexobregon@192.168.100.150
cd /var/www/timeline/backend
npm run fix:master
exit
```

Después de esto, tu cuenta Master estará 100% configurada en producción.
