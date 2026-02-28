# 📱 App Store Screenshots Guide - LenzuApp

## Tamaños Requeridos

### iPhone (Obligatorio)
| Dispositivo | Resolución | Requerido |
|-------------|------------|-----------|
| 6.7" (iPhone 14/15 Pro Max) | 1290 x 2796 | ✅ Sí |
| 6.5" (iPhone 11 Pro Max) | 1242 x 2688 | ✅ Sí |
| 5.5" (iPhone 8 Plus) | 1242 x 2208 | ✅ Sí |

### iPad (Si soportas iPad)
| Dispositivo | Resolución | Requerido |
|-------------|------------|-----------|
| iPad Pro 12.9" | 2048 x 2732 | Opcional |
| iPad Pro 11" | 1668 x 2388 | Opcional |

---

## 📸 Screenshots Recomendados (10 máximo)

### Screenshot 1: Dashboard / Proyectos
**Pantalla:** `/dashboard`
**Qué mostrar:** Lista de proyectos organizados por mes
**Texto sugerido:** "Organiza todos tus eventos en un solo lugar"

### Screenshot 2: Timeline View
**Pantalla:** `/timeline/:id` (tab Timeline)
**Qué mostrar:** Vista de timeline con días y eventos
**Texto sugerido:** "Crea timelines detallados para cada evento"

### Screenshot 3: Shot List
**Pantalla:** `/timeline/:id` (tab Shot List)
**Qué mostrar:** Lista de shots con checkboxes
**Texto sugerido:** "Nunca olvides una foto importante"

### Screenshot 4: Equipo de Fotógrafos
**Pantalla:** `/timeline/:id` (tab Overview - sección Team)
**Qué mostrar:** Grid de fotógrafos con fotos y roles
**Texto sugerido:** "Gestiona tu equipo fácilmente"

### Screenshot 5: Inspiración
**Pantalla:** `/timeline/:id` (tab Inspiration)
**Qué mostrar:** Grid de imágenes de inspiración
**Texto sugerido:** "Comparte inspiración visual con tu equipo"

### Screenshot 6: Colaboración
**Pantalla:** `/timeline/:id` (modal de compartir)
**Qué mostrar:** Invitando colaboradores
**Texto sugerido:** "Colabora en tiempo real con tu equipo"

### Screenshot 7: Mensajes
**Pantalla:** `/messages`
**Qué mostrar:** Chat con mensajes
**Texto sugerido:** "Comunicación integrada por proyecto"

### Screenshot 8: Overview del Evento
**Pantalla:** `/timeline/:id` (tab Overview)
**Qué mostrar:** Información general del evento
**Texto sugerido:** "Toda la información del evento en un vistazo"

---

## 🎨 Diseño de Screenshots

### Estilo Recomendado
- **Fondo:** Gradiente suave o color sólido (#F2F1F0 o similar)
- **Dispositivo:** Mockup de iPhone con la app
- **Texto:** Título arriba o abajo del dispositivo
- **Tipografía:** Usar Recoleta para títulos (consistente con la app)

### Herramientas Sugeridas
1. **Figma** - Diseño de mockups
2. **Rotato** - Mockups 3D de dispositivos
3. **Screenshot Pro** - Screenshots con marcos
4. **LaunchMatic** - Generador de screenshots para App Store

---

## 📝 Pasos para Capturar

### 1. Preparar datos de demostración
```
- Crear un timeline de ejemplo con eventos realistas
- Agregar fotos al equipo de fotógrafos
- Subir imágenes de inspiración
- Tener mensajes de ejemplo
```

### 2. Configurar el simulador/dispositivo
```bash
# En Xcode, seleccionar el simulador correcto:
# - iPhone 15 Pro Max (6.7")
# - iPhone 11 Pro Max (6.5") 
# - iPhone 8 Plus (5.5")
```

### 3. Capturar screenshots
```bash
# Desde el simulador de Xcode:
# Cmd + S = Guardar screenshot

# O desde dispositivo físico:
# Power + Volume Up = Screenshot
```

### 4. Procesar con diseño
- Agregar mockup de dispositivo
- Agregar texto descriptivo
- Exportar en resolución correcta

---

## ✅ Checklist Final

- [ ] Screenshot 1: Dashboard (6.7", 6.5", 5.5")
- [ ] Screenshot 2: Timeline (6.7", 6.5", 5.5")
- [ ] Screenshot 3: Shot List (6.7", 6.5", 5.5")
- [ ] Screenshot 4: Team (6.7", 6.5", 5.5")
- [ ] Screenshot 5: Inspiración (6.7", 6.5", 5.5")
- [ ] Screenshot 6: Colaboración (6.7", 6.5", 5.5")
- [ ] Screenshot 7: Mensajes (6.7", 6.5", 5.5")
- [ ] Screenshot 8: Overview (6.7", 6.5", 5.5")

---

## 📤 Subir a App Store Connect

1. Ir a App Store Connect > Tu App > App Store
2. Sección "Screenshots"
3. Arrastrar imágenes para cada tamaño de dispositivo
4. Ordenar en el orden deseado
5. Guardar cambios

---

## 💡 Tips

- **Primera impresión:** El screenshot 1 es el más importante
- **Consistencia:** Usar mismo estilo en todos los screenshots
- **Localización:** Puedes tener screenshots diferentes por idioma
- **Video:** También puedes agregar un preview video (15-30 segundos)
