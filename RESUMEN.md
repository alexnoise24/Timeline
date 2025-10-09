# 🎊 Wedding Timeline App - Resumen del Proyecto

## 📋 Descripción

Aplicación web completa para crear y gestionar líneas de tiempo colaborativas para bodas. Permite a múltiples usuarios trabajar juntos en la planificación de eventos, agregar notas y ver un historial completo de todos los cambios realizados.

## ✨ Características Principales

### 1. **Gestión de Timelines**
- Crear múltiples timelines para diferentes bodas
- Información detallada: nombres de la pareja, fecha, descripción
- Vista de dashboard con todos los timelines

### 2. **Eventos Detallados**
- Agregar eventos con fecha, hora y ubicación
- Categorías: Ceremonia, Recepción, Preparación, Fotografía, Otro
- Descripción completa de cada evento
- Ordenamiento cronológico automático

### 3. **Sistema de Notas Colaborativas**
- Agregar notas a cualquier evento
- Identificación del autor de cada nota
- Timestamp automático
- Vista organizada de todas las notas

### 4. **Tracking de Cambios Completo**
- Registro automático de TODOS los cambios
- Información de quién realizó cada cambio
- Timestamp de cada modificación
- Historial expandible por evento
- Tipos de cambios: creado, actualizado, nota agregada

### 5. **Colaboración en Tiempo Real**
- Socket.io para actualizaciones instantáneas
- Múltiples usuarios pueden editar simultáneamente
- Sincronización automática de cambios
- Notificaciones en tiempo real

### 6. **Sistema de Permisos**
- Propietario del timeline
- Colaboradores con roles (editor/viewer)
- Control de acceso a nivel de timeline
- Autenticación segura con JWT

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express**: Servidor y API REST
- **MongoDB + Mongoose**: Base de datos NoSQL
- **Socket.io**: Comunicación en tiempo real
- **JWT**: Autenticación segura
- **bcryptjs**: Encriptación de contraseñas

### Frontend
- **React 18**: Framework UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool rápido
- **TailwindCSS**: Estilos modernos
- **Zustand**: Gestión de estado
- **React Router**: Navegación
- **Lucide React**: Iconos
- **Axios**: Cliente HTTP
- **Socket.io-client**: Cliente WebSocket

## 📁 Estructura del Proyecto

```
wedding-timeline-app/
├── backend/
│   ├── models/
│   │   ├── User.js          # Modelo de usuario
│   │   └── Timeline.js      # Modelo de timeline con eventos y notas
│   ├── routes/
│   │   ├── auth.js          # Rutas de autenticación
│   │   ├── timeline.js      # CRUD de timelines y eventos
│   │   └── user.js          # Búsqueda de usuarios
│   ├── middleware/
│   │   └── auth.js          # Middleware de autenticación JWT
│   ├── socket/
│   │   └── handlers.js      # Manejadores de Socket.io
│   ├── server.js            # Punto de entrada
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/          # Componentes UI reutilizables
│   │   │   ├── Navbar.tsx
│   │   │   └── TimelineCard.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── TimelineView.tsx
│   │   ├── store/
│   │   │   ├── authStore.ts      # Estado de autenticación
│   │   │   └── timelineStore.ts  # Estado de timelines
│   │   ├── lib/
│   │   │   ├── api.ts            # Cliente API
│   │   │   ├── socket.ts         # Cliente Socket.io
│   │   │   └── utils.ts          # Utilidades
│   │   ├── types/
│   │   │   └── index.ts          # Tipos TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── README.md
├── SETUP.md                 # Guía de instalación detallada
├── RESUMEN.md              # Este archivo
└── start.sh                # Script de inicio rápido
```

## 🚀 Inicio Rápido

### Opción 1: Script Automático
```bash
./start.sh
```

### Opción 2: Manual
```bash
# 1. Instalar dependencias
npm run install-all

# 2. Crear archivo .env en backend/
# Copiar contenido de backend/.env.example

# 3. Iniciar MongoDB
brew services start mongodb-community

# 4. Iniciar aplicación
npm run dev
```

## 📊 Modelos de Datos

### User
```javascript
{
  name: String,
  email: String (único),
  password: String (hasheado),
  createdAt: Date
}
```

### Timeline
```javascript
{
  title: String,
  weddingDate: Date,
  couple: { partner1: String, partner2: String },
  owner: User,
  collaborators: [{ user: User, role: String }],
  events: [Event],
  changeLogs: [ChangeLog]
}
```

### Event (subdocumento)
```javascript
{
  title: String,
  date: Date,
  time: String,
  location: String,
  category: String,
  notes: [Note],
  changeLogs: [ChangeLog],
  createdBy: User
}
```

### Note (subdocumento)
```javascript
{
  content: String,
  author: User,
  createdAt: Date
}
```

### ChangeLog (subdocumento)
```javascript
{
  action: String,
  user: User,
  timestamp: Date,
  description: String
}
```

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación JWT con expiración
- ✅ Validación de datos en backend
- ✅ Protección de rutas
- ✅ Control de acceso por roles
- ✅ CORS configurado
- ✅ Variables de entorno para secretos

## 🎯 Funcionalidades Clave Implementadas

### Tracking de Cambios
Cada acción queda registrada:
- ✅ Creación de timeline
- ✅ Actualización de timeline
- ✅ Creación de evento
- ✅ Actualización de evento
- ✅ Nota agregada

Cada registro incluye:
- Usuario que realizó el cambio
- Timestamp exacto
- Descripción de la acción
- Valores anteriores y nuevos (cuando aplica)

### Colaboración
- ✅ Agregar colaboradores a un timeline
- ✅ Roles: editor (puede editar) y viewer (solo ver)
- ✅ Solo el propietario puede agregar colaboradores
- ✅ Todos los cambios se atribuyen al usuario correcto

### Tiempo Real
- ✅ Socket.io configurado y funcionando
- ✅ Eventos emitidos en cada cambio
- ✅ Listeners para actualizaciones
- ✅ Sincronización automática

## 📱 Páginas de la Aplicación

1. **Login** (`/login`)
   - Inicio de sesión con email y contraseña
   - Validación de credenciales
   - Redirección automática

2. **Registro** (`/register`)
   - Crear nueva cuenta
   - Validación de datos
   - Auto-login después del registro

3. **Dashboard** (`/`)
   - Lista de todos los timelines
   - Crear nuevo timeline
   - Acceso rápido a cada timeline

4. **Vista de Timeline** (`/timeline/:id`)
   - Eventos ordenados cronológicamente
   - Agregar nuevos eventos
   - Agregar notas a eventos
   - Ver historial de cambios
   - Información de colaboradores

## 🎨 Diseño UI/UX

- **Colores**: Paleta primary (púrpura/rosa) para bodas
- **Responsive**: Funciona en móvil, tablet y desktop
- **Componentes**: Reutilizables y consistentes
- **Iconos**: Lucide React para claridad visual
- **Feedback**: Mensajes de error y éxito claros
- **Loading states**: Indicadores de carga

## 🔄 Flujo de Trabajo

1. Usuario se registra/inicia sesión
2. Crea un timeline para su boda
3. Agrega eventos (ceremonia, recepción, etc.)
4. Invita colaboradores (wedding planner, familia)
5. Todos pueden agregar notas a los eventos
6. Cada cambio queda registrado con autor y fecha
7. Actualizaciones en tiempo real para todos

## 📈 Próximas Mejoras Sugeridas

- [ ] UI para buscar y agregar colaboradores
- [ ] Notificaciones push
- [ ] Exportar timeline a PDF
- [ ] Subir imágenes a eventos
- [ ] Chat en tiempo real
- [ ] Recordatorios por email
- [ ] Modo oscuro
- [ ] Filtros y búsqueda de eventos
- [ ] Drag & drop para reordenar eventos
- [ ] Plantillas de eventos predefinidas

## 🐛 Testing

Para probar la aplicación:

1. Crear 2 usuarios diferentes
2. Usuario 1 crea un timeline
3. Usuario 1 agrega eventos
4. Usuario 2 puede ser agregado como colaborador
5. Ambos usuarios agregan notas
6. Verificar que el historial muestre quién hizo cada cambio

## 📝 Notas Importantes

- La aplicación requiere MongoDB corriendo
- El JWT_SECRET debe ser cambiado en producción
- Los colaboradores deben ser agregados manualmente por el propietario
- Todos los cambios son permanentes y quedan registrados
- Las contraseñas nunca se almacenan en texto plano

## 🎓 Aprendizajes del Proyecto

Este proyecto demuestra:
- Arquitectura full-stack moderna
- Comunicación en tiempo real con WebSockets
- Autenticación y autorización
- Gestión de estado compleja
- Diseño de base de datos NoSQL
- TypeScript en frontend
- API RESTful bien estructurada
- UI/UX moderna y responsive

---

**¡La aplicación está lista para usar! 🎉**

Para iniciar: `./start.sh` o sigue las instrucciones en `SETUP.md`
