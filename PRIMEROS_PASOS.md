# 🎯 Primeros Pasos - Wedding Timeline App

## ⚡ Inicio Rápido (5 minutos)

### Paso 1: Configuración Inicial

```bash
# 1. Navega al directorio del proyecto
cd "/Volumes/T7/Web APP/Timeline"

# 2. Ejecuta el script de inicio
./start.sh
```

El script automáticamente:
- ✅ Verifica MongoDB
- ✅ Instala dependencias si es necesario
- ✅ Crea archivo .env si no existe
- ✅ Inicia backend y frontend

### Paso 2: Configurar MongoDB

**Opción A: MongoDB Local (Recomendado para desarrollo)**

```bash
# Instalar MongoDB (si no lo tienes)
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Verificar que está corriendo
brew services list
```

**Opción B: MongoDB Atlas (Cloud)**

1. Crea cuenta en https://www.mongodb.com/cloud/atlas
2. Crea un cluster gratuito
3. Obtén tu connection string
4. Edita `backend/.env` y reemplaza `MONGODB_URI` con tu connection string

### Paso 3: Configurar Variables de Entorno

Si el script no creó el archivo `.env`, créalo manualmente:

```bash
# Crear archivo .env en backend/
cat > backend/.env << EOF
PORT=5000
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF
```

### Paso 4: Verificar que Todo Funciona

Abre tu navegador en: **http://localhost:5173**

Deberías ver la página de login. ¡Perfecto! 🎉

---

## 📱 Primer Uso de la Aplicación

### 1. Crear tu Primera Cuenta

1. En la página de login, haz clic en **"Regístrate aquí"**
2. Completa el formulario:
   - **Nombre**: Tu nombre completo
   - **Email**: tu@email.com
   - **Contraseña**: Mínimo 6 caracteres
3. Haz clic en **"Crear Cuenta"**
4. Serás redirigido automáticamente al dashboard

### 2. Crear tu Primer Timeline

1. En el dashboard, haz clic en **"Nuevo Timeline"**
2. Completa la información:
   ```
   Título: Boda de María y Juan
   Pareja 1: María García
   Pareja 2: Juan Pérez
   Fecha: 2025-06-15
   Descripción: Nuestra boda en el jardín
   ```
3. Haz clic en **"Crear Timeline"**

### 3. Agregar tu Primer Evento

1. Dentro del timeline, haz clic en **"Agregar Evento"**
2. Completa los detalles:
   ```
   Título: Ceremonia
   Categoría: Ceremonia
   Fecha: 2025-06-15
   Hora: 16:00
   Ubicación: Iglesia San José
   Descripción: Ceremonia religiosa
   ```
3. Haz clic en **"Agregar Evento"**

### 4. Agregar una Nota

1. En el evento que acabas de crear, haz clic en **"Nota"**
2. Escribe algo como:
   ```
   Recordar confirmar con el padre la hora exacta
   ```
3. Haz clic en **"Agregar Nota"**
4. Verás tu nota con tu nombre y la hora actual

### 5. Ver el Historial de Cambios

1. Expande **"Historial de cambios"** en el evento
2. Verás todos los cambios:
   - Evento creado por [tu nombre]
   - Nota agregada por [tu nombre]
   - Con timestamps exactos

---

## 🧪 Probar la Colaboración

Para probar la funcionalidad colaborativa:

### Opción 1: Dos Navegadores

1. Abre Chrome en modo normal
2. Abre Chrome en modo incógnito (Cmd+Shift+N)
3. En cada ventana:
   - Registra un usuario diferente
   - Crea o accede al mismo timeline
   - Agrega eventos y notas
   - Observa las actualizaciones en tiempo real

### Opción 2: Dos Usuarios Reales

1. Comparte la URL con un amigo: `http://tu-ip:5173`
2. Que se registre con su propia cuenta
3. Agrega a tu amigo como colaborador (funcionalidad base implementada)
4. Ambos pueden editar y ver cambios en tiempo real

---

## 📊 Ejemplo Completo de Timeline de Boda

Aquí un ejemplo de eventos que podrías crear:

### Preparación (Día anterior)
- **Ensayo de ceremonia** - 18:00 - Iglesia
- **Cena de ensayo** - 20:00 - Restaurante

### Día de la Boda
- **Preparación novia** - 10:00 - Hotel
- **Preparación novio** - 11:00 - Casa
- **Sesión de fotos pre-boda** - 13:00 - Parque
- **Ceremonia** - 16:00 - Iglesia
- **Sesión de fotos** - 17:00 - Jardín
- **Cóctel** - 18:00 - Terraza
- **Recepción** - 19:00 - Salón
- **Primer baile** - 20:30 - Pista de baile
- **Cena** - 21:00 - Salón
- **Fiesta** - 22:00 - Pista de baile

Cada evento puede tener:
- Notas de coordinación
- Detalles de proveedores
- Recordatorios
- Cambios de última hora

---

## 🎨 Categorías de Eventos

Usa las categorías para organizar mejor:

- **🎭 Ceremonia**: Ceremonia religiosa o civil
- **🎉 Recepción**: Cóctel, cena, baile
- **💄 Preparación**: Maquillaje, peinado, vestirse
- **📸 Fotografía**: Sesiones de fotos
- **📋 Otro**: Ensayos, reuniones, etc.

---

## 💡 Tips de Uso

### Para Novios
- Crea un timeline por cada día importante (ensayo, boda, luna de miel)
- Agrega a tu wedding planner como colaborador
- Usa notas para recordatorios de última hora
- Revisa el historial si hay dudas sobre cambios

### Para Wedding Planners
- Crea timelines detallados con horarios exactos
- Agrega notas con contactos de proveedores
- Usa el historial para auditar cambios
- Comparte con el equipo de coordinación

### Para Colaboradores
- Revisa el timeline regularmente
- Agrega notas si ves algo que mejorar
- Actualiza eventos si hay cambios
- Respeta los cambios de otros

---

## 🔧 Comandos Útiles

```bash
# Iniciar la aplicación
./start.sh

# O manualmente
npm run dev

# Solo backend
cd backend && npm run dev

# Solo frontend
cd frontend && npm run dev

# Instalar dependencias
npm run install-all

# Ver logs de MongoDB
tail -f /usr/local/var/log/mongodb/mongo.log

# Detener MongoDB
brew services stop mongodb-community

# Reiniciar todo
brew services restart mongodb-community
./start.sh
```

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar esto en producción?
Sí, pero necesitas:
- Cambiar `JWT_SECRET` por algo seguro
- Usar MongoDB Atlas o servidor dedicado
- Configurar HTTPS
- Ajustar CORS para tu dominio

### ¿Cuántos timelines puedo crear?
Ilimitados. Cada usuario puede crear todos los que necesite.

### ¿Cuántos colaboradores puedo agregar?
Ilimitados. No hay restricción en el número de colaboradores.

### ¿Los cambios se guardan automáticamente?
Sí, cada cambio se guarda inmediatamente en la base de datos.

### ¿Puedo eliminar eventos?
La funcionalidad de eliminación no está implementada aún, pero es fácil de agregar.

### ¿Funciona sin internet?
No, requiere conexión para sincronizar con el servidor y otros usuarios.

---

## 🆘 Ayuda

Si tienes problemas:

1. **Revisa los logs del backend** en la terminal
2. **Abre la consola del navegador** (F12) para ver errores
3. **Verifica MongoDB** con `brew services list`
4. **Consulta** `SETUP.md` para más detalles
5. **Lee** `README.md` para documentación completa

---

## 🎉 ¡Listo para Empezar!

Ya tienes todo lo necesario para usar la aplicación. 

**Siguiente paso:** Abre http://localhost:5173 y crea tu primera cuenta.

¡Disfruta organizando tu boda! 💒✨
