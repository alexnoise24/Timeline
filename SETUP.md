# Guía de Instalación y Configuración

## Requisitos Previos

- Node.js (v18 o superior)
- MongoDB (local o MongoDB Atlas)
- npm o yarn

## Pasos de Instalación

### 1. Instalar Dependencias

Desde la raíz del proyecto:

```bash
npm run install-all
```

O manualmente:

```bash
# Instalar dependencias raíz
npm install

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
JWT_SECRET=tu_secreto_jwt_super_seguro_cambiar_en_produccion
NODE_ENV=development
```

**Importante:** 
- Si usas MongoDB Atlas, reemplaza `MONGODB_URI` con tu connection string
- Cambia `JWT_SECRET` por una cadena aleatoria segura

### 3. Iniciar MongoDB

Si usas MongoDB local:

```bash
# macOS (con Homebrew)
brew services start mongodb-community

# O manualmente
mongod --dbpath /path/to/data/directory
```

Si usas MongoDB Atlas, asegúrate de tener tu connection string configurado en `.env`

### 4. Iniciar la Aplicación

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto iniciará:
- Backend en http://localhost:5000
- Frontend en http://localhost:5173

O iniciar por separado:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Uso de la Aplicación

### 1. Registro de Usuario
- Accede a http://localhost:5173
- Haz clic en "Regístrate aquí"
- Completa el formulario con tu nombre, email y contraseña

### 2. Crear Timeline
- Una vez logueado, haz clic en "Nuevo Timeline"
- Completa la información de la boda:
  - Título
  - Nombres de la pareja
  - Fecha de la boda
  - Descripción (opcional)

### 3. Agregar Eventos
- Dentro de un timeline, haz clic en "Agregar Evento"
- Completa los detalles:
  - Título del evento
  - Categoría (Ceremonia, Recepción, etc.)
  - Fecha y hora
  - Ubicación
  - Descripción

### 4. Agregar Notas
- En cualquier evento, haz clic en el botón "Nota"
- Escribe tu nota y guárdala
- Las notas mostrarán quién las escribió y cuándo

### 5. Ver Historial de Cambios
- Cada evento tiene un historial de cambios
- Haz clic en "Historial de cambios" para ver quién hizo cada modificación

### 6. Colaborar
- El propietario puede agregar colaboradores (funcionalidad base implementada)
- Los colaboradores pueden ver y editar eventos
- Todos los cambios se registran con el nombre del usuario

## Características Implementadas

✅ **Autenticación**
- Registro e inicio de sesión
- JWT para sesiones seguras
- Protección de rutas

✅ **Gestión de Timelines**
- Crear múltiples timelines
- Ver lista de timelines propios y compartidos
- Información detallada de cada boda

✅ **Eventos**
- Crear eventos con fecha, hora y ubicación
- Categorizar eventos (ceremonia, recepción, etc.)
- Ordenar eventos cronológicamente
- Editar eventos existentes

✅ **Sistema de Notas**
- Agregar notas a cualquier evento
- Ver quién escribió cada nota
- Timestamp de cada nota

✅ **Tracking de Cambios**
- Registro automático de todos los cambios
- Información de quién hizo cada cambio
- Timestamp de cada modificación
- Historial completo por evento

✅ **Colaboración en Tiempo Real**
- Socket.io configurado para actualizaciones en vivo
- Múltiples usuarios pueden editar simultáneamente
- Notificaciones de cambios en tiempo real

✅ **UI Moderna**
- Diseño responsive con TailwindCSS
- Componentes reutilizables
- Experiencia de usuario intuitiva
- Iconos con Lucide React

## Estructura de la Base de Datos

### Colección: users
```javascript
{
  name: String,
  email: String (único),
  password: String (hasheado),
  avatar: String,
  createdAt: Date
}
```

### Colección: timelines
```javascript
{
  title: String,
  weddingDate: Date,
  couple: {
    partner1: String,
    partner2: String
  },
  description: String,
  owner: ObjectId (ref: User),
  collaborators: [{
    user: ObjectId (ref: User),
    role: String (editor/viewer),
    addedAt: Date
  }],
  events: [{
    title: String,
    description: String,
    date: Date,
    time: String,
    location: String,
    category: String,
    notes: [{
      content: String,
      author: ObjectId (ref: User),
      createdAt: Date
    }],
    changeLogs: [{
      action: String,
      user: ObjectId (ref: User),
      timestamp: Date,
      description: String
    }],
    createdBy: ObjectId (ref: User)
  }],
  changeLogs: [...]
}
```

## Solución de Problemas

### MongoDB no se conecta
- Verifica que MongoDB esté corriendo
- Revisa la URI en el archivo `.env`
- Si usas Atlas, verifica tu IP en la whitelist

### Error de CORS
- Asegúrate de que el backend esté corriendo en el puerto 5000
- Verifica la configuración de CORS en `backend/server.js`

### Dependencias faltantes
- Ejecuta `npm install` en backend y frontend
- Verifica que Node.js sea v18 o superior

### Socket.io no conecta
- Verifica que ambos servidores estén corriendo
- Revisa la consola del navegador para errores
- Asegúrate de estar autenticado

## Próximas Mejoras Sugeridas

- [ ] Búsqueda de usuarios para agregar colaboradores
- [ ] Notificaciones push
- [ ] Exportar timeline a PDF
- [ ] Recordatorios por email
- [ ] Subir imágenes a eventos
- [ ] Chat en tiempo real
- [ ] Modo oscuro
- [ ] Aplicación móvil

## Soporte

Para problemas o preguntas, revisa:
1. Los logs del backend en la terminal
2. La consola del navegador (F12)
3. El archivo README.md principal
