#!/bin/bash

echo "🚀 Iniciando Wedding Timeline App..."
echo ""

# Verificar si existe el archivo .env en backend
if [ ! -f backend/.env ]; then
    echo "⚠️  No se encontró archivo .env en backend/"
    echo "📝 Creando archivo .env desde .env.example..."
    cp backend/.env.example backend/.env
    echo "✅ Archivo .env creado. Por favor, edita backend/.env con tus configuraciones."
    echo ""
fi

# Verificar si MongoDB está corriendo
echo "🔍 Verificando MongoDB..."
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB está corriendo"
else
    echo "⚠️  MongoDB no está corriendo"
    echo "💡 Inicia MongoDB con: brew services start mongodb-community"
    echo "   O usa MongoDB Atlas y configura MONGODB_URI en backend/.env"
    echo ""
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm run install-all
    echo ""
fi

echo "🎉 Iniciando servidores..."
echo "📍 Backend: http://localhost:5000"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Presiona Ctrl+C para detener los servidores"
echo ""

npm run dev
