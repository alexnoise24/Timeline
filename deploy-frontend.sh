#!/bin/bash

PROJECT_ID="moment-weaver-66582"

echo "🌐 Desplegando frontend a Firebase Hosting..."

# 1. Autenticación en Firebase
echo "🔐 Iniciando sesión en Firebase..."
firebase login
firebase use $PROJECT_ID

# 2. Construir el frontend
echo "🏗️ Construyendo el frontend..."
cd frontend
npm run build
cd ..

# 3. Desplegar a Firebase Hosting
echo "🚀 Desplegando a Firebase Hosting..."
firebase deploy --only hosting

echo "✅ ¡Despliegue del frontend completado!"
echo "🔗 Tu aplicación estará disponible en: https://${PROJECT_ID}.web.app"
echo ""
echo "📋 Verificaciones recomendadas:"
echo "   1. Abre https://${PROJECT_ID}.web.app en tu navegador"
echo "   2. Regístrate e inicia sesión"
echo "   3. Crea una línea de tiempo de prueba"
echo "   4. Verifica que la API responda correctamente"
echo "   5. Prueba la conexión con WebSockets si es necesario"
