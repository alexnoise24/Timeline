# 🛠️ Comandos Útiles - Wedding Timeline App

## 🚀 Inicio y Detención

### Iniciar Todo
```bash
# Opción 1: Script automático (recomendado)
./start.sh

# Opción 2: Con npm
npm run dev

# Opción 3: Manual (dos terminales)
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### Detener
```bash
# Presiona Ctrl+C en la terminal donde corre la app
# O si necesitas matar procesos:
pkill -f "node.*server.js"
pkill -f "vite"
```

---

## 📦 Gestión de Dependencias

### Instalar Todo
```bash
# Instalar todas las dependencias (raíz, backend, frontend)
npm run install-all

# O manualmente
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Actualizar Dependencias
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Reinstalar Todo (si hay problemas)
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf package-lock.json backend/package-lock.json frontend/package-lock.json
npm run install-all
```

---

## 🗄️ MongoDB

### Iniciar MongoDB
```bash
# Iniciar servicio
brew services start mongodb-community

# Verificar que está corriendo
brew services list

# O iniciar manualmente
mongod --config /usr/local/etc/mongod.conf
```

### Detener MongoDB
```bash
brew services stop mongodb-community
```

### Reiniciar MongoDB
```bash
brew services restart mongodb-community
```

### Conectar a MongoDB Shell
```bash
mongosh

# O especificar base de datos
mongosh wedding-timeline
```

### Ver Logs de MongoDB
```bash
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Comandos MongoDB Shell
```javascript
// Conectar a la base de datos
use wedding-timeline

// Ver colecciones
show collections

// Ver usuarios
db.users.find().pretty()

// Ver timelines
db.timelines.find().pretty()

// Contar documentos
db.users.countDocuments()
db.timelines.countDocuments()

// Eliminar todo (cuidado!)
db.users.deleteMany({})
db.timelines.deleteMany({})

// Eliminar base de datos completa (cuidado!)
db.dropDatabase()
```

---

## 🔍 Debugging

### Ver Logs del Backend
```bash
# Si usas npm run dev, los logs aparecen en la terminal
# Para logs más detallados, puedes agregar console.log en el código
```

### Ver Logs del Frontend
```bash
# Abre la consola del navegador
# Chrome/Edge: F12 o Cmd+Option+I (Mac)
# Firefox: F12 o Cmd+Option+K (Mac)
# Safari: Cmd+Option+C (Mac)
```

### Verificar Conexiones
```bash
# Ver qué está corriendo en los puertos
lsof -i :5000  # Backend
lsof -i :5173  # Frontend
lsof -i :27017 # MongoDB

# Matar proceso en puerto específico
kill -9 $(lsof -ti:5000)
```

### Probar API con curl
```bash
# Health check
curl http://localhost:5000/api/health

# Registro
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Ver timelines (necesitas token)
curl http://localhost:5000/api/timelines \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 🧹 Limpieza

### Limpiar Builds
```bash
# Frontend
rm -rf frontend/dist

# Si tuvieras build en backend
rm -rf backend/dist
```

### Limpiar Cache
```bash
# npm cache
npm cache clean --force

# Vite cache
rm -rf frontend/.vite
```

### Reset Completo
```bash
# Eliminar todo y empezar de cero
rm -rf node_modules backend/node_modules frontend/node_modules
rm -rf package-lock.json backend/package-lock.json frontend/package-lock.json
rm -rf frontend/dist frontend/.vite
npm run install-all
```

---

## 🔐 Variables de Entorno

### Crear .env en Backend
```bash
cat > backend/.env << 'EOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF
```

### Generar JWT Secret Seguro
```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: UUID
uuidgen
```

### Ver Variables de Entorno
```bash
# Backend
cat backend/.env

# Frontend (si existiera)
cat frontend/.env
```

---

## 🧪 Testing

### Probar Registro y Login
```bash
# 1. Registrar usuario
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'

# 2. Guardar el token que devuelve
TOKEN="eyJhbGc..."

# 3. Verificar autenticación
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Probar Creación de Timeline
```bash
curl -X POST http://localhost:5000/api/timelines \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi Boda",
    "weddingDate": "2025-06-15",
    "couple": {"partner1": "María", "partner2": "Juan"}
  }'
```

---

## 📊 Monitoreo

### Ver Uso de Recursos
```bash
# CPU y memoria de procesos Node
ps aux | grep node

# Espacio en disco
df -h

# Uso de MongoDB
du -sh /usr/local/var/mongodb
```

### Verificar Puertos Abiertos
```bash
# Ver todos los puertos en uso
netstat -an | grep LISTEN

# O con lsof
lsof -i -P | grep LISTEN
```

---

## 🔄 Git (si usas control de versiones)

### Inicializar Repositorio
```bash
git init
git add .
git commit -m "Initial commit: Wedding Timeline App"
```

### Ignorar Archivos Sensibles
```bash
# Ya está configurado en .gitignore
# Verifica que .env no se suba
git status
```

### Crear Rama de Desarrollo
```bash
git checkout -b development
```

---

## 🚢 Preparar para Producción

### Build del Frontend
```bash
cd frontend
npm run build
# Genera archivos en frontend/dist
```

### Variables de Entorno para Producción
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/wedding-timeline
JWT_SECRET=tu_secreto_super_seguro_de_produccion
NODE_ENV=production
FRONTEND_URL=https://tudominio.com
```

### Iniciar en Producción
```bash
# Backend
cd backend
npm start

# Frontend (servir archivos estáticos)
# Usar nginx, Apache, o servicio como Vercel/Netlify
```

---

## 🆘 Solución Rápida de Problemas

### MongoDB no conecta
```bash
# Verificar estado
brew services list

# Reiniciar
brew services restart mongodb-community

# Ver logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Puerto ya en uso
```bash
# Encontrar proceso
lsof -i :5000

# Matar proceso
kill -9 PID_DEL_PROCESO

# O cambiar puerto en .env
```

### Dependencias rotas
```bash
# Reinstalar todo
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install-all
```

### Frontend no carga
```bash
# Verificar que backend esté corriendo
curl http://localhost:5000/api/health

# Limpiar cache de Vite
rm -rf frontend/.vite
cd frontend && npm run dev
```

---

## 📱 Acceso desde Otros Dispositivos

### Encontrar tu IP Local
```bash
# macOS
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet

# O ver todas las interfaces
ifconfig | grep "inet "
```

### Acceder desde Móvil/Tablet
```bash
# En tu dispositivo móvil, abre el navegador y ve a:
http://TU_IP_LOCAL:5173

# Ejemplo:
http://192.168.1.100:5173
```

### Configurar CORS para IP Local
```javascript
// backend/server.js
// Ya está configurado para aceptar localhost:5173
// Para agregar tu IP, edita la configuración de CORS
```

---

## 🎓 Comandos de Desarrollo

### Agregar Nueva Dependencia

**Backend:**
```bash
cd backend
npm install nombre-paquete
```

**Frontend:**
```bash
cd frontend
npm install nombre-paquete
```

### Ver Dependencias Instaladas
```bash
npm list --depth=0
```

### Actualizar Node.js
```bash
# Con nvm
nvm install node
nvm use node

# Verificar versión
node --version
```

---

## 💡 Tips Útiles

### Alias para Comandos Frecuentes
Agrega a tu `~/.zshrc` o `~/.bashrc`:

```bash
# Wedding Timeline App
alias wt-start='cd "/Volumes/T7/Web APP/Timeline" && ./start.sh'
alias wt-mongo='brew services start mongodb-community'
alias wt-logs='tail -f /usr/local/var/log/mongodb/mongo.log'
alias wt-clean='cd "/Volumes/T7/Web APP/Timeline" && rm -rf node_modules backend/node_modules frontend/node_modules'
```

Luego:
```bash
source ~/.zshrc
wt-start  # Inicia la app
```

### Script de Backup de MongoDB
```bash
#!/bin/bash
# backup-db.sh
mongodump --db wedding-timeline --out ./backups/$(date +%Y%m%d)
```

---

## 📚 Recursos Adicionales

- **MongoDB Docs**: https://docs.mongodb.com
- **React Docs**: https://react.dev
- **Express Docs**: https://expressjs.com
- **Socket.io Docs**: https://socket.io/docs
- **TailwindCSS Docs**: https://tailwindcss.com/docs

---

**¡Guarda este archivo para referencia rápida! 🚀**
