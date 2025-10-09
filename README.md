# 🎊 Wedding Timeline App

Aplicación web completa para crear y gestionar líneas de tiempo colaborativas para bodas. Permite a múltiples usuarios trabajar juntos en la planificación de eventos, agregar notas y ver un historial completo de todos los cambios realizados.

## ✨ Características Principales

- 🎯 **Crear líneas de tiempo personalizadas** para bodas
- 👥 **Compartir con colaboradores** (editores y viewers)
- ✏️ **Edición colaborativa en tiempo real** con Socket.io
- 📝 **Sistema de notas** por evento con autor y timestamp
- 📊 **Historial de cambios completo** - ve quién hizo cada cambio y cuándo
- 🔔 **Actualizaciones en tiempo real** para todos los colaboradores
- 🔐 **Autenticación segura** con JWT
- 📱 **Diseño responsive** - funciona en móvil, tablet y desktop

## Tecnologías

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Zustand (gestión de estado)
- Socket.io-client
- React Router
- Lucide React (iconos)

### Backend
- Node.js + Express
- Socket.io (colaboración en tiempo real)
- MongoDB + Mongoose
- JWT (autenticación)
- bcryptjs

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)
```bash
./start.sh
```

### Opción 2: Instalación Manual

1. **Instalar todas las dependencias:**
```bash
npm run install-all
```

2. **Configurar variables de entorno:**

Crear archivo `.env` en la carpeta `backend/` con:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
JWT_SECRET=tu_secreto_jwt_super_seguro_cambiar_en_produccion
NODE_ENV=development
```

3. **Iniciar MongoDB:**
```bash
# macOS con Homebrew
brew services start mongodb-community

# O usa MongoDB Atlas y actualiza MONGODB_URI
```

4. **Iniciar la aplicación:**
```bash
npm run dev
```

**La aplicación estará disponible en:**
- 🌐 Frontend: http://localhost:5173
- 🔌 Backend: http://localhost:5000

📖 **Para más detalles, consulta:** `SETUP.md`

## Estructura del Proyecto

```
wedding-timeline-app/
├── backend/           # Servidor Node.js + Express
│   ├── models/       # Modelos de MongoDB
│   ├── routes/       # Rutas de la API
│   ├── middleware/   # Middleware (auth, etc.)
│   ├── socket/       # Lógica de Socket.io
│   └── server.js     # Punto de entrada
├── frontend/         # Aplicación React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   ├── store/       # Estado global (Zustand)
│   │   ├── lib/         # Utilidades
│   │   └── App.tsx      # Componente principal
│   └── index.html
└── README.md
```

## 📖 Cómo Usar la Aplicación

### 1. Registro e Inicio de Sesión
- Accede a http://localhost:5173
- Haz clic en **"Regístrate aquí"**
- Completa el formulario con tu nombre, email y contraseña
- O inicia sesión si ya tienes cuenta

### 2. Crear un Timeline
- En el dashboard, haz clic en **"Nuevo Timeline"**
- Completa la información:
  - Título del timeline
  - Nombres de la pareja (opcional)
  - Fecha de la boda
  - Descripción (opcional)
- Haz clic en **"Crear Timeline"**

### 3. Agregar Eventos
- Dentro de un timeline, haz clic en **"Agregar Evento"**
- Completa los detalles:
  - Título del evento (ej: "Ceremonia", "Recepción")
  - Categoría (Ceremonia, Recepción, Preparación, Fotografía, Otro)
  - Fecha y hora
  - Ubicación (opcional)
  - Descripción (opcional)
- Los eventos se ordenan automáticamente por fecha

### 4. Agregar Notas a Eventos
- En cualquier evento, haz clic en el botón **"Nota"**
- Escribe tu nota y guárdala
- Las notas mostrarán:
  - Quién escribió la nota
  - Cuándo se escribió
  - El contenido completo

### 5. Ver Historial de Cambios
- Cada evento tiene un historial de cambios
- Haz clic en **"Historial de cambios"** para expandir
- Verás:
  - Quién realizó cada cambio
  - Qué tipo de cambio fue (creado, actualizado, nota agregada)
  - Cuándo se realizó el cambio

### 6. Colaborar con Otros Usuarios
- El propietario del timeline puede agregar colaboradores
- Los colaboradores pueden:
  - Ver todos los eventos
  - Agregar nuevos eventos
  - Agregar notas
  - Editar eventos existentes
- Todos los cambios quedan registrados con el nombre del usuario

## 🎯 Características Implementadas

✅ **Sistema de Autenticación Completo**
- Registro de usuarios
- Inicio de sesión
- JWT tokens con expiración
- Protección de rutas

✅ **Gestión de Timelines**
- Crear múltiples timelines
- Ver todos tus timelines
- Información detallada de cada boda
- Compartir con colaboradores

✅ **Gestión de Eventos**
- Crear eventos con toda la información
- Categorizar eventos
- Ordenamiento cronológico automático
- Editar eventos existentes

✅ **Sistema de Notas Colaborativas**
- Agregar notas a cualquier evento
- Ver quién escribió cada nota
- Timestamp automático
- Múltiples notas por evento

✅ **Tracking Completo de Cambios**
- Registro automático de TODOS los cambios
- Información del usuario que hizo el cambio
- Timestamp de cada modificación
- Historial completo por evento y timeline

✅ **Colaboración en Tiempo Real**
- Socket.io configurado
- Actualizaciones instantáneas
- Múltiples usuarios simultáneos
- Sincronización automática

✅ **UI/UX Moderna**
- Diseño responsive
- Componentes reutilizables
- Iconos intuitivos
- Feedback visual claro

## 🔐 Seguridad

- Contraseñas encriptadas con bcrypt
- Autenticación JWT segura
- Validación de datos en backend
- Control de acceso por roles
- Variables de entorno para secretos
- CORS configurado correctamente

## 📚 Documentación Adicional

- **SETUP.md**: Guía detallada de instalación y configuración
- **RESUMEN.md**: Resumen completo del proyecto y arquitectura
- **backend/.env.example**: Plantilla de variables de entorno

## 🐛 Solución de Problemas

### MongoDB no conecta
```bash
# Verifica que MongoDB esté corriendo
brew services list

# Inicia MongoDB si no está corriendo
brew services start mongodb-community
```

### Errores de dependencias
```bash
# Reinstala todas las dependencias
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install-all
```

### Puerto ya en uso
```bash
# Cambia el puerto en backend/.env
PORT=5001

# Y actualiza el proxy en frontend/vite.config.ts
```

## 🚀 Próximas Mejoras

- [ ] UI para buscar y agregar colaboradores
- [ ] Notificaciones push en tiempo real
- [ ] Exportar timeline a PDF
- [ ] Subir imágenes a eventos
- [ ] Chat en tiempo real entre colaboradores
- [ ] Recordatorios por email
- [ ] Modo oscuro
- [ ] Aplicación móvil nativa

## 📄 Licencia

ISC

---

**Desarrollado con ❤️ para hacer la planificación de bodas más fácil y colaborativa**
